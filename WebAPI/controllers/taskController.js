const Task = require("../models/Task");
const { isActiveAdmin } = require("../utils/userHelpers");
const { groupSessionsByDay, calculateEstimatedMinutes } = require("../utils/taskHelpers");

/* =============================================================
    ADMIN CONTROLLERS
   ============================================================= */

/**
 * 🧑‍💼 Create a new task
 * Expects projectNumber, startDate, endDate, and estimatedTime from Frontend
 */
exports.createTask = async (req, res) => {
  try {
    if (!isActiveAdmin(req.user)) {
      return res.status(403).json({ message: "Access denied." });
    }

    const {
      title, projectNumber, projectDetails, assignedTo,
      startDate, endDate, priority, allocatedTime // NEW: Received from Frontend
    } = req.body;

    // Validation
    if (!title || !projectNumber || !assignedTo?.length || !startDate || !endDate || !allocatedTime) {
      return res.status(400).json({ message: "Missing required fields (including Allocated Time)" });
    }

    // BACKEND CALCULATION (Calendar-based estimation)
    const estimatedTime = calculateEstimatedMinutes(startDate, endDate);

    // Check for Unique Project Number
    const existingProject = await Task.findOne({ projectNumber });
    if (existingProject) {
      return res.status(400).json({ message: `Project Number "${projectNumber}" already exists.` });
    }

    const workLogs = assignedTo.map(empId => ({
      employee: empId,
      totalMinutesConsumed: 0,
      isTimerRunning: false,
      sessions: []
    }));

    const task = await Task.create({
      title,
      projectNumber,
      projectDetails,
      createdBy: req.user.id,
      assignedTo: workLogs,
      estimatedTime, // Keep your auto-calc here
      allocatedTime: estimatedTime, // Start with the system suggestion
      priority: priority || "Medium",
      startDate,
      endDate,
      assignmentDate: new Date(),
    });

    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * 🧑‍💼 Update task (supports projectNumber and date changes)
 */
exports.updateTask = async (req, res) => {
  try {
    if (!isActiveAdmin(req.user)) {
      return res.status(403).json({ message: "Access denied." });
    }

    const { id } = req.params;
    const {
      title, projectNumber, projectDetails, assignedTo,
      startDate, endDate, priority, allocatedTime, status
    } = req.body;

    // 1. Prepare the update object
    const updateData = {
      title,
      projectNumber,
      projectDetails,
      priority,
      status,
      startDate,
      endDate
    };

    // 2. Handle Allocated Time (Convert Hours back to Minutes)
    if (allocatedTime !== undefined) {
      updateData.allocatedTime = Number(allocatedTime) * 60;
    }

    // 3. Handle Assigned Personnel
    // If assignedTo is an array of IDs, we need to map them back to the workLog format
    if (assignedTo && Array.isArray(assignedTo)) {
      // NOTE: Be careful here—if you overwrite assignedTo entirely, 
      // you might lose existing work logs/timer data. 
      // Most systems only update the list of employees while keeping logs.
      updateData.assignedTo = assignedTo.map(empId => ({
        employee: empId,
        // Keep default values for new assignments
        totalMinutesConsumed: 0,
        isTimerRunning: false,
        sessions: []
      }));
    }

    // 4. Recalculate Estimation if dates changed
    if (startDate && endDate) {
      updateData.estimatedTime = calculateEstimatedMinutes(startDate, endDate);
    }

    const updatedTask = await Task.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true } // runValidators ensures allocatedTime is checked
    ).populate("assignedTo.employee", "name");

    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found." });
    }

    res.json(updatedTask);
  } catch (err) {
    console.error("Update Error:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * 🧑‍💼 Get all tasks with multi-filter (Admin)
 * Filters: start, end, search (Title or Project Number)
 */
exports.getAllTasks = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 10, createdAt, startDate, endDate } = req.query;
    let query = {};

    // Filters
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { projectNumber: { $regex: search, $options: "i" } },
      ];
    }
    if (status && status !== "All") query.status = status;

    if (createdAt) {
      const day = new Date(createdAt);
      query.createdAt = {
        $gte: new Date(day.setHours(0, 0, 0, 0)),
        $lte: new Date(day.setHours(23, 59, 59, 999))
      };
    }

    // 3. Filter by Mission Start Date (Exact Day)
    if (startDate) {
      const day = new Date(startDate);
      query.startDate = {
        $gte: new Date(day.setHours(0, 0, 0, 0)),
        $lte: new Date(day.setHours(23, 59, 59, 999))
      };
    }

    // 4. Filter by Mission End Date (Exact Day)
    if (endDate) {
      const day = new Date(endDate);
      query.endDate = {
        $gte: new Date(day.setHours(0, 0, 0, 0)),
        $lte: new Date(day.setHours(23, 59, 59, 999))
      };
    }

    // Pagination Logic
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const totalTasks = await Task.countDocuments(query);

    const tasks = await Task.find(query)
      .populate("assignedTo.employee", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      tasks,
      totalTasks,
      totalPages: Math.ceil(totalTasks / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

/**
 * 🧑‍💼 Get tasks for a specific employee with filters
 */
exports.getTasksByEmployee = async (req, res) => {
  try {
    // Use || to try both common parameter names
    const userId = req.params.userId || req.params.id;

    // VALIDATION: Stop the execution if the ID is missing or is the string "undefined"
    if (!userId || userId === "undefined") {
      console.error("Backend received an invalid ID:", userId);
      return res.status(400).json({ 
        message: "A valid Employee ID is required to fetch tasks." 
      });
    }

    const { start, end, search } = req.query;

    // Use the validated userId
    let filter = { "assignedTo.employee": userId };

    if (start && end) {
      filter.startDate = { $gte: new Date(start) };
      filter.endDate = { $lte: new Date(end) };
    }

    if (search) {
      filter.$and = [
        { "assignedTo.employee": userId },
        {
          $or: [
            { title: { $regex: search, $options: "i" } },
            { projectNumber: { $regex: search, $options: "i" } }
          ]
        }
      ];
    }

    const tasks = await Task.find(filter).sort({ createdAt: -1 });
    
     const formattedTasks = tasks.map(t => ({
      taskId: t._id,
      projectNumber: t.projectNumber,
      title: t.title,
      estimatedTime: t.estimatedTime,
      status: t.status,
      startDate: t.startDate,
      endDate: t.endDate,
      createdAt: t.createdAt
    }));

    res.json(formattedTasks);
  } catch (err) {
    console.error("Task Fetch Error:", err);
    res.status(500).json({ message: "Error fetching employee tasks", error: err.message });
  }
};
/**
 * 🧑‍💼 Delete Task
 */
exports.deleteTask = async (req, res) => {
  try {
    if (!isActiveAdmin(req.user)) return res.status(403).json({ message: "Forbidden" });
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: "Task deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * 🧑‍💼 Get Full Task Detail
 */
exports.getTaskDetail = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate("assignedTo.employee", "name email role status")
      .lean();

    if (!task) return res.status(404).json({ message: "Task not found" });

    // Enforce daily logs breakdown for details view
    const assigneeBreakdown = task.assignedTo.map(w => ({
      employeeId: w.employee?._id,
      name: w.employee?.name,
      totalMinutesConsumed: w.totalMinutesConsumed || 0,
      dailyLogs: groupSessionsByDay(w.sessions),
      isTimerRunning: w.isTimerRunning
    }));

    res.json({ ...task, assignees: assigneeBreakdown });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* =============================================================
    EMPLOYEE CONTROLLERS
   ============================================================= */

exports.getMyTasks = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 6 } = req.query;
    
    // 1. Base filter: Only tasks assigned to this user
    let query = { "assignedTo.employee": req.user.id };

    // 2. Add Status Filter
    if (status && status !== "All") {
      query.status = status;
    }

    // 3. Add Search Filter (Title or Project Number)
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { projectNumber: { $regex: search, $options: "i" } },
      ];
    }

    // 4. Pagination Calculation
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const totalTasks = await Task.countDocuments(query);

    // 5. Execute Query
    const tasks = await Task.find(query)
      .populate("createdBy", "name")
      .sort({ createdAt: -1 }) // Newest assignments first
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      tasks,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(totalTasks / limit),
        count: totalTasks
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};;
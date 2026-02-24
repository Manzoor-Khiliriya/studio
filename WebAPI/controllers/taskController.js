const mongoose = require("mongoose");
const Task = require("../models/Task");
const Project = require("../models/Project"); // <-- ADD THIS IMPORT
const TimeLog = require("../models/TimeLog");
const Employee = require("../models/Employee");
const sendTaskNotification = require("../utils/notifier");
const { calculateEstimatedHours } = require("../utils/taskHelpers");

// POST: Create a task under a project
exports.createTask = async (req, res) => {
  try {
    // Note: 'project' comes from the frontend payload fix we did earlier
    const { project, title, startDate, endDate, priority, allocatedTime, projectDetails } = req.body;

    if (!title || !project || !startDate || !endDate) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    const projectExists = await Project.findById(project);
    if (!projectExists) {
      return res.status(404).json({ message: "Parent Project not found" });
    }

    const estimatedTime = await calculateEstimatedHours(startDate, endDate);
    const finalAllocatedTime = allocatedTime !== undefined ? Number(allocatedTime) : estimatedTime;

    const task = await Task.create({
      title,
      project, // ObjectId linking to Project Model
      projectDetails,
      createdBy: req.user._id,
      assignedTo: [],
      estimatedTime,
      allocatedTime: finalAllocatedTime,
      priority: priority || "Medium",
      startDate: start,
      endDate: end,
    });

    // Populate project before sending back so UI has the title immediately
    const populatedTask = await task.populate("project");

    res.status(201).json(populatedTask);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH: Update specific task details
exports.updateTask = async (req, res) => {
  try {
    const {
      title, assignedTo, startDate, endDate, project, // Included project link
      priority, status, allocatedTime, activeStatus, liveStatus, projectDetails
    } = req.body;

    const io = req.app.get('socketio');
    const task = await Task.findById(req.params.id);

    if (!task) return res.status(404).json({ message: "Task not found" });

    const oldAssigneeIds = task.assignedTo.map(id => id.toString());

    // Basic fields
    if (title) task.title = title;
    if (project) task.project = project; // Allow re-assigning to different project
    if (priority) task.priority = priority;
    if (status) task.status = status;
    if (activeStatus) task.activeStatus = activeStatus;
    if (liveStatus) task.liveStatus = liveStatus;
    if (projectDetails !== undefined) task.projectDetails = projectDetails;

    // Date/Assignment Logic
    if (startDate || endDate || assignedTo) {
      task.startDate = startDate ? new Date(startDate) : task.startDate;
      task.endDate = endDate ? new Date(endDate) : task.endDate;
      if (assignedTo) task.assignedTo = assignedTo;

      task.estimatedTime = await calculateEstimatedHours(task.startDate, task.endDate);
      if (allocatedTime !== undefined) task.allocatedTime = Number(allocatedTime);
    }

    await task.save();

    // Re-populate everything for the response
    const updated = await Task.findById(task._id)
      .populate("project") // Essential for the table view
      .populate({ path: "assignedTo", populate: { path: "user", select: "name" } })
      .populate("timeLogs");

    // Notifications
    if (assignedTo) {
      const newAssigneeIds = assignedTo.map(id => id.toString());
      const added = newAssigneeIds.filter(id => !oldAssigneeIds.includes(id));

      if (added.length > 0) {
        const addedEmps = await Employee.find({ _id: { $in: added } }).populate("user");
        for (const emp of addedEmps) {
          await sendTaskNotification(emp.user, {
            type: "task",
            message: `New Task "${task.title}" added to Project: ${updated.project?.title}`,
            taskId: task._id
          }, io);
        }
      }
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET: All Tasks (Updated to populate project)

exports.updateTaskStatus = async (req, res) => {
  try {
    const { status, activeStatus } = req.body;

    if (!status && !activeStatus) {
      return res.status(400).json({ message: "No status updates provided" });
    }

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (status) task.status = status;
    if (activeStatus) task.activeStatus = activeStatus;

    await task.save();

    res.json({
      _id: task._id,
      status: task.status,
      activeStatus: task.activeStatus,
      projectNumber: task.projectNumber
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllTasks = async (req, res) => {
  try {
    const { search, status, liveStatus, page = 1, limit = 10 } = req.query;
    let query = {};

    // Search logic: Note that searching by project title requires a different 
    // approach (aggregation) if searching via $regex. 
    // For now, we search task title.
    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    if (status && status !== "All") query.status = status;
    if (liveStatus && liveStatus !== "All") query.liveStatus = liveStatus;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const tasks = await Task.find(query)
      .populate("project") // <-- CRUCIAL FOR THE TABLE
      .populate({ path: "assignedTo", populate: { path: "user", select: "name" } })
      .populate("timeLogs")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Task.countDocuments(query);
    const availableStatuses = await Task.distinct("status");

    res.json({
      tasks,
      totalTasks: total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      availableStatuses: ["All", ...availableStatuses.filter(Boolean)]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.getTaskDetail = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("createdBy", "name")
      .populate({ path: "assignedTo", populate: { path: "user", select: "name" } })
      .populate("timeLogs");
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTasksByEmployee = async (req, res) => {
  try {
    // Find the employee profile using the User ID from the URL params
    const employee = await Employee.findOne({ user: req.params.userId });

    if (!employee) {
      return res.status(404).json({ message: "Employee profile not found" });
    }

    // New: Handle optional liveStatus filtering from query (e.g., ?liveStatus=In progress)
    const { liveStatus } = req.query;
    const query = { assignedTo: employee._id };

    if (liveStatus && liveStatus !== "All") {
      query.liveStatus = { $in: liveStatus.split(",") };
    }

    const tasks = await Task.find(query)
      .populate({ path: "createdBy", select: "name" })
      .populate("timeLogs") // Crucial for totalConsumedHours virtual
      .sort({ createdAt: -1 })
      .lean({ virtuals: true }); // Ensures virtuals like progressPercent are included

    res.json(tasks);
  } catch (err) {
    console.error("Get Tasks By Employee Error:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getMyTasks = async (req, res) => {
  try {
    const { search, status, liveStatus, activeStatus, page = 1, limit = 6 } = req.query;

    // 1. Find the employee profile
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.json({ tasks: [], pagination: { current: 1, totalPages: 0, totalTasks: 0 } });
    }

    // 2. Base Query: Only tasks assigned to this employee
    const query = { assignedTo: employee._id };

    // 3. Search Filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { projectNumber: { $regex: search, $options: "i" } },
      ];
    }

    /** * 4. NOT EQUAL LOGIC: 
     * If status starts with "!", we use MongoDB's $ne operator.
     * Example: status="!Completed" => query.status = { $ne: "Completed" }
     */
    if (status && status !== "All") {
      if (status.startsWith("!")) {
        const excludeValue = status.substring(1); // "Completed"
        query.status = { $ne: excludeValue };
      } else {
        query.status = status;
      }
    }

    /**
     * 5. ACTIVE STATUS FILTER:
     * Added specifically for your request to filter by activeStatus
     */
    if (activeStatus && activeStatus !== "All") {
      if (activeStatus.startsWith("!")) {
        query.activeStatus = { $ne: activeStatus.substring(1) };
      } else {
        query.activeStatus = activeStatus;
      }
    }

    // 6. Live Status Filter (comma-separated support)
    if (liveStatus && liveStatus !== "All") {
      const liveStatuses = liveStatus.split(",");
      query.liveStatus = { $in: liveStatuses };
    }

    // 7. Execution
    const skip = (Number(page) - 1) * Number(limit);
    const tasks = await Task.find(query)
      .populate("createdBy", "name")
      .populate("timeLogs")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Task.countDocuments(query);

    res.json({
      tasks,
      pagination: {
        current: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalTasks: total,
        count: total // Added count for your StatCards
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteTask = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const task = await Task.findByIdAndDelete(req.params.id).session(session);
    if (!task) throw new Error("Task not found");
    await TimeLog.deleteMany({ task: task._id }).session(session);
    await session.commitTransaction();
    res.json({ message: "Task and related logs deleted" });
  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({ error: err.message });
  } finally {
    session.endSession();
  }
};


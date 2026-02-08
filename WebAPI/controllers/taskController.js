const mongoose = require("mongoose");
const Task = require("../models/Task");
const TimeLog = require("../models/TimeLog");
const { calculateEstimatedHours } = require("../utils/taskHelpers");
const { calculateEmployeeAvailableHours } = require("../utils/workerHelpers");
const { isUserOnLeaveDuring } = require("../utils/leaveHelpers");
const Employee = require("../models/Employee");

/* =========================================================
   ADMIN CONTROLLERS
   ========================================================= */

exports.createTask = async (req, res) => {
  try {
    const { title, projectNumber, projectDetails, assignedTo, startDate, endDate, priority } = req.body;

    if (!title || !projectNumber || !assignedTo?.length || !startDate || !endDate) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (await Task.exists({ projectNumber })) {
      return res.status(400).json({ message: "Project number already exists" });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start) || isNaN(end)) {
      return res.status(400).json({ message: "Invalid start or end date" });
    }

    // 🔴 Leave conflict check
    for (const userId of assignedTo) {
      const onLeave = await isUserOnLeaveDuring(userId, startDate, endDate);
      if (onLeave) {
        return res.status(400).json({
          message: `Cannot assign task. User ${userId} has approved leave during this period.`
        });
      }
    }


    // 🧠 Estimated hours (calendar aware)
    const estimatedTime = await calculateEstimatedHours(startDate, endDate);

    // 🧠 Employee join-date capacity adjustment
    let minAvailableHours = Infinity;

    for (const userId of assignedTo) {
      const emp = await Employee.findOne({ user: userId });
      const available = await calculateEmployeeAvailableHours(startDate, endDate, emp?.joinedDate);
      minAvailableHours = Math.min(minAvailableHours, available);
    }

    const allocatedTime = Math.min(estimatedTime, minAvailableHours);

    const task = await Task.create({
      title,
      projectNumber,
      projectDetails,
      createdBy: req.user._id,
      assignedTo,
      estimatedTime,
      allocatedTime,
      priority: priority || "Medium",
      startDate,
      endDate,
    });

    res.status(201).json(task);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    // 1. Destructure all fields from body including allocatedTime
    const { 
      title, 
      projectNumber, 
      description,      
      projectDetails,   
      assignedTo,       
      startDate, 
      endDate, 
      priority,
      status,
      allocatedTime // <--- Manually sent from frontend
    } = req.body;

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    // 2. Direct assignment
    if (title) task.title = title;
    if (projectNumber) task.projectNumber = projectNumber;
    if (priority) task.priority = priority;
    if (status) task.status = status;
    
    // Manual override for allocated time if provided
    if (allocatedTime !== undefined) {
      task.allocatedTime = Number(allocatedTime);
    }

    if (description || projectDetails) {
      task.projectDetails = projectDetails || description;
    }

    // 3. Conditional Recalculation
    if (startDate || endDate || assignedTo) {
      const finalStart = startDate ? new Date(startDate) : task.startDate;
      const finalEnd = endDate ? new Date(endDate) : task.endDate;
      const finalAssignees = assignedTo || task.assignedTo;

      if (startDate) task.startDate = finalStart;
      if (endDate) task.endDate = finalEnd;
      if (assignedTo) task.assignedTo = finalAssignees;

      // Conflict Check
      for (const empId of finalAssignees) {
        const emp = await Employee.findById(empId);
        if (emp) {
          const onLeave = await isUserOnLeaveDuring(emp.user, finalStart, finalEnd);
          if (onLeave) {
            return res.status(400).json({ message: "Conflict: Operator on leave." });
          }
        }
      }

      // Auto-calculate logic (Only runs if user DID NOT manually send allocatedTime)
      const estimated = await calculateEstimatedHours(finalStart, finalEnd);
      task.estimatedTime = estimated;

      if (allocatedTime === undefined) {
        let minAvailable = Infinity;
        for (const empId of finalAssignees) {
          const emp = await Employee.findById(empId);
          const available = await calculateEmployeeAvailableHours(finalStart, finalEnd, emp?.joinedDate);
          minAvailable = Math.min(minAvailable, available);
        }
        task.allocatedTime = Math.min(estimated, minAvailable);
      }
    }

    // 4. Save
    await task.save();

    // 5. Final Populate for Virtuals & UI
    const updated = await Task.findById(task._id)
      .populate("timeLogs") 
      .populate({
        path: "assignedTo",
        populate: { path: "user", select: "name" }
      });

    res.json(updated);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Delete Task + its logs
 */
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

/**
 * Get All Tasks (Admin View with filters)
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

    const tasks = await Task.find(query)
      // Reach into Employee, then reach into User to get the Name
      .populate({
        path: "assignedTo",
        populate: {
          path: "user",
          select: "name"
        }
      })
      .populate("timeLogs")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Task.countDocuments(query);

    res.json({
      tasks,
      totalTasks: total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page)
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get Single Task Detail
 */
exports.getTaskDetail = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("createdBy", "name")
      .populate({
        path: "assignedTo",
        populate: {
          path: "user",
          select: "name"
        }
      })
      .populate("timeLogs");

    if (!task) return res.status(404).json({ message: "Task not found" });

    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Admin view: Tasks by employee
 */
exports.getTasksByEmployee = async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.params.userId })
      .populate("timeLogs")
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* =========================================================
   EMPLOYEE CONTROLLERS
   ========================================================= */

/**
 * Get My Tasks (Employee Dashboard)
 */
exports.getMyTasks = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 6 } = req.query;

    // 1. Find the Employee record linked to this User
    const employee = await Employee.findOne({ user: req.user._id });
    
    if (!employee) {
      return res.json({
        tasks: [],
        pagination: { current: 1, totalPages: 0, totalTasks: 0 }
      });
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Number(limit));
    const skip = (pageNum - 1) * limitNum;

    // 2. Query using the Employee's _id
    const query = { assignedTo: employee._id }; 

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { projectNumber: { $regex: search, $options: "i" } },
      ];
    }

    if (status && status !== "All") query.status = status;

    const tasks = await Task.find(query)
      .populate("createdBy", "name")
      .populate("timeLogs")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Task.countDocuments(query);

    res.json({
      tasks,
      pagination: {
        current: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalTasks: total,
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

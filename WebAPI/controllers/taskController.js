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
    const update = { ...req.body };

    const start = update.startDate || req.body.startDate;
    const end = update.endDate || req.body.endDate;

    // 🔴 Leave conflict check if assignments or dates changed
    if (update.assignedTo && start && end) {
      for (const userId of update.assignedTo) {
        const onLeave = await isUserOnLeaveDuring(userId, start, end);
        if (onLeave) {
          return res.status(400).json({
            message: `Cannot assign task. User ${userId} is on approved leave.`
          });
        }
      }
    }

    // 🧠 Recalculate estimates if dates changed
    if (update.startDate && update.endDate) {
      update.estimatedTime = await calculateEstimatedHours(update.startDate, update.endDate);

      let minAvailableHours = Infinity;

      const employees = update.assignedTo || (await Task.findById(req.params.id).select("assignedTo")).assignedTo;

      for (const userId of employees) {
        const emp = await Employee.findOne({ user: userId });
        const available = await calculateEmployeeAvailableHours(update.startDate, update.endDate, emp?.joinedDate);
        minAvailableHours = Math.min(minAvailableHours, available);
      }

      update.allocatedTime = Math.min(update.estimatedTime, minAvailableHours);
    }

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    ).populate("assignedTo", "name");

    if (!task) return res.status(404).json({ message: "Task not found" });

    res.json(task);

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
      .populate("assignedTo", "name")
      .populate("timeLogs")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

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
      .populate("assignedTo", "name email")
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

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Number(limit));
    const skip = (pageNum - 1) * limitNum;

    const query = { assignedTo: req.user._id };

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

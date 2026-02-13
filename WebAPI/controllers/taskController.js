const mongoose = require("mongoose");
const Task = require("../models/Task");
const TimeLog = require("../models/TimeLog");
const User = require("../models/User");
const Employee = require("../models/Employee");
const sendTaskNotification = require("../utils/notifier");
const { calculateEstimatedHours } = require("../utils/taskHelpers");
const { calculateEmployeeAvailableHours } = require("../utils/workerHelpers");
const { isUserOnLeaveDuring } = require("../utils/leaveHelpers");


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

    for (const userId of assignedTo) {
      const onLeave = await isUserOnLeaveDuring(userId, startDate, endDate);
      if (onLeave) {
        const conflictUser = await User.findById(userId);
        return res.status(400).json({
          message: `Conflict: ${conflictUser?.name || 'User'} has a Project Blackout (Leave) during this period.`
        });
      }
    }

    const estimatedTime = await calculateEstimatedHours(startDate, endDate);
    let minAvailableHours = Infinity;

    const employeeRecords = [];
    for (const userId of assignedTo) {
      const emp = await Employee.findOne({ user: userId }).populate("user");
      if (emp) {
        employeeRecords.push(emp);
        const available = await calculateEmployeeAvailableHours(startDate, endDate, emp.joinedDate);
        minAvailableHours = Math.min(minAvailableHours, available);
      }
    }

    const allocatedTime = Math.min(estimatedTime, minAvailableHours);

    const task = await Task.create({
      title,
      projectNumber,
      projectDetails,
      createdBy: req.user._id,
      assignedTo: employeeRecords.map(e => e._id),
      estimatedTime,
      allocatedTime,
      priority: priority || "Medium",
      startDate,
      endDate,
    });

    try {
      const io = req.app.get('socketio');
      for (const emp of employeeRecords) {
        await sendTaskNotification(emp.user, {
          type: "task",
          message: `New Mission Assigned: ${task.title} (#${task.projectNumber})`,
          subject: `🚀 New Assignment: ${task.projectNumber}`,
          taskId: task._id
        }, io);
      }
    } catch (notifErr) {
      console.error("Notification failed:", notifErr.message);
    }

    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { title, projectNumber, projectDetails, assignedTo, startDate, endDate, priority, status, allocatedTime } = req.body;
    const io = req.app.get('socketio');

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const oldAssigneeIds = task.assignedTo.map(id => id.toString());
    const isStatusChanged = status && status !== task.status;

    const finalStart = startDate ? new Date(startDate) : task.startDate;
    const finalEnd = endDate ? new Date(endDate) : task.endDate;
    const finalAssigneeIds = assignedTo || task.assignedTo;

    if (startDate || endDate || assignedTo) {
      for (const id of finalAssigneeIds) {
        const emp = await Employee.findById(id);
        if (!emp) continue;

        const onLeave = await isUserOnLeaveDuring(emp.user, finalStart, finalEnd);
        if (onLeave) {
          const conflictUser = await User.findById(emp.user);
          return res.status(400).json({
            message: `Conflict: ${conflictUser?.name || 'Personnel'} is unavailable during the requested schedule.`
          });
        }
      }
    }

    if (title) task.title = title;
    if (projectNumber) task.projectNumber = projectNumber;
    if (priority) task.priority = priority;
    if (status) task.status = status;
    if (allocatedTime !== undefined) task.allocatedTime = Number(allocatedTime);
    if (projectDetails) task.projectDetails = projectDetails;

    if (startDate || endDate || assignedTo) {
      task.startDate = finalStart;
      task.endDate = finalEnd;
      task.assignedTo = finalAssigneeIds;

      const estimated = await calculateEstimatedHours(finalStart, finalEnd);
      task.estimatedTime = estimated;

      if (allocatedTime === undefined) {
        let minAvailable = Infinity;
        for (const empId of finalAssigneeIds) {
          const emp = await Employee.findById(empId);
          const available = await calculateEmployeeAvailableHours(finalStart, finalEnd, emp?.joinedDate);
          minAvailable = Math.min(minAvailable, available);
        }
        task.allocatedTime = Math.min(estimated, minAvailable);
      }
    }

    await task.save();

    if (assignedTo) {
      const newAssigneeIds = assignedTo.map(id => id.toString());
      const added = newAssigneeIds.filter(id => !oldAssigneeIds.includes(id));
      const removed = oldAssigneeIds.filter(id => !newAssigneeIds.includes(id));
      const remained = newAssigneeIds.filter(id => oldAssigneeIds.includes(id));

      const addedEmps = await Employee.find({ _id: { $in: added } }).populate("user");
      for (const emp of addedEmps) {
        await sendTaskNotification(emp.user, {
          type: "task", message: `Added to mission: ${task.projectNumber}`, taskId: task._id
        }, io);
      }

      const removedEmps = await Employee.find({ _id: { $in: removed } }).populate("user");
      for (const emp of removedEmps) {
        await sendTaskNotification(emp.user, {
          type: "system", message: `Removed from mission: ${task.projectNumber}`, taskId: task._id
        }, io);
      }

      if (isStatusChanged || startDate || endDate) {
        const remainedEmps = await Employee.find({ _id: { $in: remained } }).populate("user");
        for (const emp of remainedEmps) {
          await sendTaskNotification(emp.user, {
            type: "status", message: `Mission Update: ${task.projectNumber} is ${task.status}`, taskId: task._id
          }, io);
        }
      }
    }

    const updated = await Task.findById(task._id).populate({
      path: "assignedTo",
      populate: { path: "user", select: "name" }
    });
    res.json(updated);
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

exports.getAllTasks = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 10, createdAt, startDate, endDate } = req.query;
    let query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { projectNumber: { $regex: search, $options: "i" } },
      ];
    }
    if (status && status !== "All") query.status = status;
    
    if (startDate && endDate) {
      query.startDate = { $gte: new Date(new Date(startDate).setHours(0,0,0,0)) };
      query.endDate = { $lte: new Date(new Date(endDate).setHours(23,59,59,999)) };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const tasks = await Task.find(query)
      .populate({ path: "assignedTo", populate: { path: "user", select: "name" } })
      .populate("timeLogs")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Task.countDocuments(query);
    res.json({ tasks, totalTasks: total, totalPages: Math.ceil(total / parseInt(limit)), currentPage: parseInt(page) });
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
    // 1. First, find the Employee record associated with the User ID from the URL
    const employee = await Employee.findOne({ user: req.params.userId });
    
    if (!employee) {
      return res.status(404).json({ message: "Employee profile not found" });
    }

    // 2. Find tasks assigned to this Employee ID
    const tasks = await Task.find({ assignedTo: employee._id })
      .populate("timeLogs")
      .sort({ createdAt: -1 })
      .lean(); // Use lean for faster read-only performance

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMyTasks = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 6 } = req.query;
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) return res.json({ tasks: [], pagination: { current: 1, totalPages: 0, totalTasks: 0 } });

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
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await Task.countDocuments(query);
    res.json({ tasks, pagination: { current: Number(page), totalPages: Math.ceil(total / Number(limit)), totalTasks: total } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
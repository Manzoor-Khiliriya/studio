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
    const { title, projectNumber, projectDetails, startDate, endDate, priority, allocatedTime } = req.body;

    // 1. Validation: assignedTo is no longer required here
    if (!title || !projectNumber || !startDate || !endDate) {
      return res.status(400).json({ message: "Missing required fields: title, projectNumber, startDate, or endDate" });
    }

    if (await Task.exists({ projectNumber })) {
      return res.status(400).json({ message: "Project number already exists" });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start) || isNaN(end)) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    // 2. Simple Time Calculation (No employee check needed for creation)
    const estimatedTime = await calculateEstimatedHours(startDate, endDate);
    
    // If admin didn't manually provide an allocatedTime, use the calculated estimate
    const finalAllocatedTime = allocatedTime !== undefined ? Number(allocatedTime) : estimatedTime;

    const task = await Task.create({
      title,
      projectNumber,
      projectDetails,
      createdBy: req.user._id,
      assignedTo: [], // Starts empty per your request
      estimatedTime,
      allocatedTime: finalAllocatedTime,
      priority: priority || "Medium",
      startDate: start,
      endDate: end,
      status: "To be started",
      activeStatus: "Draft-1"
    });

    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { 
      title, projectNumber, projectDetails, assignedTo, 
      startDate, endDate, priority, status, allocatedTime, activeStatus 
    } = req.body;
    const io = req.app.get('socketio');

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const oldAssigneeIds = task.assignedTo.map(id => id.toString());
    const finalStart = startDate ? new Date(startDate) : task.startDate;
    const finalEnd = endDate ? new Date(endDate) : task.endDate;

    // 1. Assignment & Leave Logic (Crucial for UPDATE)
    if (assignedTo) {
      for (const id of assignedTo) {
        const emp = await Employee.findById(id);
        if (!emp) continue;

        const onLeave = await isUserOnLeaveDuring(emp.user, finalStart, finalEnd);
        if (onLeave) {
          const conflictUser = await User.findById(emp.user);
          return res.status(400).json({
            message: `Conflict: ${conflictUser?.name || 'Personnel'} is unavailable (on leave) during this schedule.`
          });
        }
      }
    }

    // 2. Update Basic Fields
    if (title) task.title = title;
    if (projectNumber) task.projectNumber = projectNumber;
    if (priority) task.priority = priority;
    if (status) task.status = status;
    if (activeStatus) task.activeStatus = activeStatus;
    if (projectDetails !== undefined) task.projectDetails = projectDetails;

    // 3. Handle Schedule/Team Changes
    if (startDate || endDate || assignedTo) {
      task.startDate = finalStart;
      task.endDate = finalEnd;
      if (assignedTo) task.assignedTo = assignedTo;

      const estimated = await calculateEstimatedHours(finalStart, finalEnd);
      task.estimatedTime = estimated;

      // Recalculate allocatedTime based on assigned team's capacity
      if (allocatedTime === undefined) {
        const currentAssignees = assignedTo || task.assignedTo;
        if (currentAssignees.length > 0) {
          let minAvailable = Infinity;
          for (const empId of currentAssignees) {
            const emp = await Employee.findById(empId);
            const available = await calculateEmployeeAvailableHours(finalStart, finalEnd, emp?.joinedDate);
            minAvailable = Math.min(minAvailable, available);
          }
          task.allocatedTime = Math.min(estimated, minAvailable);
        } else {
          task.allocatedTime = estimated;
        }
      } else {
        task.allocatedTime = Number(allocatedTime);
      }
    } else if (allocatedTime !== undefined) {
      task.allocatedTime = Number(allocatedTime);
    }

    await task.save();

    // 4. Notifications (Only trigger if assignedTo changed)
    if (assignedTo) {
      const newAssigneeIds = assignedTo.map(id => id.toString());
      const added = newAssigneeIds.filter(id => !oldAssigneeIds.includes(id));
      const removed = oldAssigneeIds.filter(id => !newAssigneeIds.includes(id));

      if (added.length > 0) {
        const addedEmps = await Employee.find({ _id: { $in: added } }).populate("user");
        for (const emp of addedEmps) {
          await sendTaskNotification(emp.user, {
            type: "task", message: `New Assignment: ${task.title}`, taskId: task._id
          }, io);
        }
      }

      if (removed.length > 0) {
        const removedEmps = await Employee.find({ _id: { $in: removed } }).populate("user");
        for (const emp of removedEmps) {
          await sendTaskNotification(emp.user, {
            type: "system", message: `Removed from Project: ${task.projectNumber}`, taskId: task._id
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

    if (createdAt) {
      const day = new Date(createdAt);
      query.createdAt = { $gte: new Date(day.setHours(0, 0, 0, 0)), $lte: new Date(day.setHours(23, 59, 59, 999)) };
    }

    if (startDate && endDate) {
      query.startDate = { $gte: new Date(new Date(startDate).setHours(0, 0, 0, 0)) };
      query.endDate = { $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)) };
    } else {
      if (startDate) {
        const sDay = new Date(startDate);
        query.startDate = {
          $gte: new Date(sDay.setHours(0, 0, 0, 0)),
          $lte: new Date(sDay.setHours(23, 59, 59, 999))
        };
      }
      if (endDate) {
        const eDay = new Date(endDate);
        query.endDate = {
          $gte: new Date(eDay.setHours(0, 0, 0, 0)),
          $lte: new Date(eDay.setHours(23, 59, 59, 999))
        };
      }
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
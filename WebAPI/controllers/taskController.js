const mongoose = require("mongoose");
const Task = require("../models/Task");
const TimeLog = require("../models/TimeLog");
const User = require("../models/User");
const Employee = require("../models/Employee");
const sendTaskNotification = require("../utils/notifier");
const { calculateEstimatedHours } = require("../utils/taskHelpers");
const { calculateEmployeeAvailableHours } = require("../utils/workerHelpers");
const { isUserOnLeaveDuring } = require("../utils/leaveHelpers");

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

    // Leave conflict check
    for (const userId of assignedTo) {
      const onLeave = await isUserOnLeaveDuring(userId, startDate, endDate);
      if (onLeave) {
        return res.status(400).json({
          message: `Cannot assign task. User has approved leave during this period.`
        });
      }
    }

    const estimatedTime = await calculateEstimatedHours(startDate, endDate);
    let minAvailableHours = Infinity;

    // We need the Employee IDs to save in the Task
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

    /* =========================================================
        NOTIFICATION LOGIC (CREATE)
       ========================================================= */
    try {
      const io = req.app.get('socketio');
      for (const emp of employeeRecords) {
        await sendTaskNotification(emp.user, {
          type: "task",
          message: `New Mission Assigned: ${task.title} (#${task.projectNumber})`,
          subject: `🚀 New Assignment: ${task.projectNumber}`,
          taskId: task._id,
          htmlContent: `
            <div style="font-family: sans-serif; border: 1px solid #f97316; padding: 20px; border-radius: 15px;">
              <h2 style="color: #f97316;">New Mission Authorized</h2>
              <p>Hello <b>${emp.user.name}</b>,</p>
              <p>You have been assigned to a new mission critical task.</p>
              <div style="background: #fff7ed; padding: 15px; border-radius: 10px; border: 1px solid #ffedd5;">
                <p><b>Mission:</b> ${task.title}</p>
                <p><b>ID:</b> ${task.projectNumber}</p>
              </div>
              <p>Please log in to your dashboard to begin.</p>
            </div>`
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

    // 1. TRACK CHANGES (Old Employee IDs)
    const oldAssigneeIds = task.assignedTo.map(id => id.toString());
    const isStatusChanged = status && status !== task.status;

    // 2. UPDATE FIELDS
    if (title) task.title = title;
    if (projectNumber) task.projectNumber = projectNumber;
    if (priority) task.priority = priority;
    if (status) task.status = status;
    if (allocatedTime !== undefined) task.allocatedTime = Number(allocatedTime);
    if (projectDetails) task.projectDetails = projectDetails;

    if (startDate || endDate || assignedTo) {
      const finalStart = startDate ? new Date(startDate) : task.startDate;
      const finalEnd = endDate ? new Date(endDate) : task.endDate;
      const finalAssignees = assignedTo || task.assignedTo;

      task.startDate = finalStart;
      task.endDate = finalEnd;
      task.assignedTo = finalAssignees;

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

    await task.save();

    /* =========================================================
        NOTIFICATION LOGIC (DIFF CHECK)
       ========================================================= */
    if (assignedTo) {
      const newAssigneeIds = assignedTo.map(id => id.toString());
      const added = newAssigneeIds.filter(id => !oldAssigneeIds.includes(id));
      const removed = oldAssigneeIds.filter(id => !newAssigneeIds.includes(id));
      const remained = newAssigneeIds.filter(id => oldAssigneeIds.includes(id));

      // A. Notify Added
      const addedEmps = await Employee.find({ _id: { $in: added } }).populate("user");
      for (const emp of addedEmps) {
        await sendTaskNotification(emp.user, {
          type: "task",
          message: `Added to mission: ${task.projectNumber}`,
          subject: `🚀 New Assignment: ${task.projectNumber}`,
          taskId: task._id
        }, io);
      }

      // B. Notify Removed
      const removedEmps = await Employee.find({ _id: { $in: removed } }).populate("user");
      for (const emp of removedEmps) {
        await sendTaskNotification(emp.user, {
          type: "system",
          message: `Removed from mission: ${task.projectNumber}`,
          subject: `⚠️ Task Removal: ${task.projectNumber}`,
          taskId: task._id,
          htmlContent: `
            <div style="font-family: sans-serif; border: 1px solid #ef4444; padding: 20px; border-radius: 15px;">
              <h2 style="color: #ef4444;">Assignment Revoked</h2>
              <p>You have been <b>removed</b> from task: <b>${task.title}</b></p>
            </div>`
        }, io);
      }

      // C. Notify Remained of General Updates
      if (isStatusChanged || startDate || endDate) {
        const remainedEmps = await Employee.find({ _id: { $in: remained } }).populate("user");
        for (const emp of remainedEmps) {
          await sendTaskNotification(emp.user, {
            type: "status",
            message: `Mission Update: ${task.projectNumber} is now ${task.status}`,
            subject: `Task Update: ${task.projectNumber}`,
            taskId: task._id
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

/* =========================================================
    REMAINING HELPER CONTROLLERS (Unchanged)
   ========================================================= */

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
    // START / END RANGE FILTER
    // START / END FILTER
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      // started after start AND finished before end
      query.startDate = { $gte: start };
      query.endDate = { $lte: end };
    }
    else if (startDate) {
      const day = new Date(startDate);
      const start = new Date(day.setHours(0, 0, 0, 0));
      const end = new Date(day.setHours(23, 59, 59, 999));

      query.startDate = { $gte: start, $lte: end };
    }
    else if (endDate) {
      const day = new Date(endDate);
      const start = new Date(day.setHours(0, 0, 0, 0));
      const end = new Date(day.setHours(23, 59, 59, 999));

      query.endDate = { $gte: start, $lte: end };
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
    const tasks = await Task.find({ assignedTo: req.params.userId }).populate("timeLogs").sort({ createdAt: -1 });
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

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Number(limit));
    const skip = (pageNum - 1) * limitNum;
    const query = { assignedTo: employee._id };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { projectNumber: { $regex: search, $options: "i" } },
      ];
    }
    if (status && status !== "All") query.status = status;

    const tasks = await Task.find(query).populate("createdBy", "name").populate("timeLogs").sort({ createdAt: -1 }).skip(skip).limit(limitNum);
    const total = await Task.countDocuments(query);
    res.json({ tasks, pagination: { current: pageNum, totalPages: Math.ceil(total / limitNum), totalTasks: total } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
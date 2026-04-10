const mongoose = require("mongoose");
const Task = require("../models/Task");
const Project = require("../models/Project");
const TimeLog = require("../models/TimeLog");
const Employee = require("../models/Employee");
const sendTaskNotification = require("../utils/notifier");
const { calculateEstimatedHours } = require("../utils/taskHelpers");
const { emitDashboardUpdate } = require("../utils/socket");

const emitEvent = (req, event, data, userIds = []) => {
  const io = req.app.get("socketio");
  if (!io) return;
  if (userIds.length) {
    userIds.forEach(id => {
      io.to(id.toString()).emit(event, data);
    });
  } else {
    io.emit(event, data);
  }
};

exports.createTask = async (req, res) => {
  try {
    const { project, title, description, allocatedTime } = req.body;
    if (!title || !project) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }
    const projectExists = await Project.findById(project);
    if (!projectExists) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }
    const estimatedTime = await calculateEstimatedHours(
      projectExists.startDate,
      projectExists.endDate
    );
    const task = await Task.create({
      title,
      project,
      description,
      estimatedTime,
      allocatedTime: allocatedTime || estimatedTime
    });
    const populatedTask = await task.populate("project");
    emitEvent(req, "taskCreated", populatedTask);
    emitDashboardUpdate(req);
    return res.status(201).json({
      success: true,
      message: "Task created successfully",
      task: populatedTask
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { title, assignedTo, project, priority, allocatedTime, description } = req.body;
    const io = req.app.get("socketio");

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }
    const oldAssigneeIds = task.assignedTo.map(id => id.toString());
    if (title) task.title = title;
    if (priority) task.priority = priority;
    if (description !== undefined) task.description = description;
    if (project && project !== task.project.toString()) {
      const projectExists = await Project.findById(project);
      if (!projectExists) {
        return res.status(404).json({ success: false, message: "Project not found" });
      }
      task.project = project;
      task.estimatedTime = await calculateEstimatedHours(
        projectExists.startDate,
        projectExists.endDate
      );
    }
    if (assignedTo) task.assignedTo = assignedTo;
    if (allocatedTime !== undefined) task.allocatedTime = Number(allocatedTime);
    await task.save();
    const updated = await Task.findById(task._id)
      .populate("project")
      .populate({ path: "assignedTo", populate: { path: "user", select: "name" } })
      .populate("timeLogs");
    if (assignedTo) {
      const newAssigneeIds = assignedTo.map(id => id.toString());
      const added = newAssigneeIds.filter(id => !oldAssigneeIds.includes(id));

      if (added.length) {
        const addedEmps = await Employee.find({ _id: { $in: added } }).populate("user");

        for (const emp of addedEmps) {
          await sendTaskNotification(emp.user, {
            type: "task",
            message: `New Task "${task.title}" added to Project: ${updated.project?.title}`,
            taskId: task._id
          }, io);
        }

        emitEvent(req, "taskAssigned", updated, addedEmps.map(e => e.user._id));
      }
    }

    emitEvent(req, "taskUpdated", updated);
    emitDashboardUpdate(req);

    return res.status(200).json({
      success: true,
      message: "Task updated successfully",
      task: updated
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.updateTaskStatus = async (req, res) => {
  try {
    const { status, activeStatus } = req.body;

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    if (status) task.status = status;
    if (activeStatus) task.activeStatus = activeStatus;

    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate("project", "projectCode title clientName startDate endDate createdAt")
      .populate({ path: "assignedTo", populate: { path: "user", select: "name" } })
      .populate("timeLogs");

    emitEvent(req, "taskStatusUpdated", updatedTask);
    emitDashboardUpdate(req);
    return res.status(200).json({
      success: true,
      message: "Task status updated",
      task: updatedTask
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.getAllTasks = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 5, createdAt, startDate, endDate } = req.query;

    const projectQuery = { status: 'Active' };

    if (search) {
      projectQuery.$or = [
        { projectCode: { $regex: search, $options: "i" } },
        { title: { $regex: search, $options: "i" } }
      ];
    }

    if (createdAt) {
      const dayStart = new Date(createdAt);
      const dayEnd = new Date(createdAt);
      dayEnd.setHours(23, 59, 59, 999);
      projectQuery.createdAt = { $gte: dayStart, $lte: dayEnd };
    }

    if (startDate || endDate) {
      const dateFilter = {};
      if (startDate) {
        const s = new Date(startDate);
        s.setHours(0, 0, 0, 0);
        dateFilter.$gte = s;
      }
      if (endDate) {
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        dateFilter.$lte = e;
      }
      projectQuery.startDate = dateFilter;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const totalProjects = await Project.countDocuments(projectQuery);
    const paginatedProjects = await Project.find(projectQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const projectIds = paginatedProjects.map(p => p._id);

    const taskQuery = { project: { $in: projectIds } };

    if (status && status !== "All") {
      taskQuery.status = status;
    }

    const tasks = await Task.find(taskQuery)
      .populate("project", "projectCode title clientName startDate endDate createdAt")
      .populate({ path: "assignedTo", populate: { path: "user", select: "name" } })
      .populate("timeLogs")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      tasks,
      allProjects: paginatedProjects,
      pagination: {
        totalProjects,
        totalPages: Math.ceil(totalProjects / limit),
        currentPage: Number(page),
        limit: Number(limit)
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.getTaskDetail = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("project", "projectCode title clientName startDate endDate createdAt")
      .populate({
        path: "assignedTo",
        populate: {
          path: "user",
          select: "name",
          populate: { path: "employee", select: "employeeCode" }
        }
      })
      .populate({
        path: "timeLogs",
        populate: {
          path: "user",
          select: "name",
          populate: { path: "employee", select: "employeeCode" }
        }
      });

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    return res.status(200).json({ success: true, task });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.getTasksByEmployee = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.params.userId });

    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    const tasks = await Task.find({ assignedTo: employee._id })
      .populate("project", "projectCode")
      .populate("timeLogs")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, tasks });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.getMyTasks = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });

    if (!employee) {
      return res.status(200).json({ success: true, tasks: [] });
    }

    const tasks = await Task.find({ assignedTo: employee._id })
      .populate("project", "projectCode title")
      .populate("timeLogs")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, tasks });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.deleteTask = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const task = await Task.findById(req.params.id).session(session);

    if (!task) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    await Task.deleteOne({ _id: task._id }).session(session);
    await TimeLog.deleteMany({ task: task._id }).session(session);

    await session.commitTransaction();

    emitEvent(req, "taskDeleted", task._id);
    emitDashboardUpdate(req);
    return res.status(204).send();
  } catch (err) {
    await session.abortTransaction();
    return res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    session.endSession();
  }
};
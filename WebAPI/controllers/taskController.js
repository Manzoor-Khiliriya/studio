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
    emitEvent(req, "taskChanged", populatedTask);
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
            message: `A new task "${task.title}" has been assigned to you under project"${updated.project?.title}". Please check it out.`,
            taskId: task._id
          }, io);
        }

        emitEvent(req, "taskChanged", updated, addedEmps.map(e => e.user._id));
      }
    }

    emitEvent(req, "taskChanged", updated);
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

    emitEvent(req, "taskChanged", updatedTask);
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
          populate: {
            path: "employee",
            select: "employeeCode"
          }
        }
      })
      .populate({
        path: "timeLogs",
        populate: {
          path: "user",
          select: "name",
          populate: {
            path: "employee",
            select: "employeeCode"
          }
        }
      })

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found"
      });
    }

    const totalAllocatedSeconds = (task.allocatedTime || 0) * 3600;
    const contributorMap = new Map();

    (task.timeLogs || []).forEach((log) => {
      if (log.logType !== "work") return;

      const user = log.user;
      if (!user?._id) return;

      const userId = user._id.toString();

      if (!contributorMap.has(userId)) {
        contributorMap.set(userId, {
          id: userId,
          name: user.name || "Unknown",
          code: user?.employee?.employeeCode || "N/A",
          seconds: 0,
          isCurrentlyAssigned: (task.assignedTo || []).some(
            a => a?.user?._id?.toString() === userId
          )
        });
      }

      contributorMap.get(userId).seconds += (log.durationSeconds || 0);
    });

    const historicalContributors = Array.from(contributorMap.values()).map(c => ({
      ...c,
      percentage:
        totalAllocatedSeconds > 0
          ? ((c.seconds / totalAllocatedSeconds) * 100).toFixed(1)
          : 0
    }));

    const totalConsumedSeconds = (task.timeLogs || [])
      .filter(log => log.logType === "work")
      .reduce((sum, log) => sum + (log.durationSeconds || 0), 0);

    const totalConsumedHours = totalConsumedSeconds / 3600;

    const taskData = {
      ...task.toObject(),
      liveStatus: task.liveStatus,
      totalConsumedSeconds,
      totalConsumedHours,
      stats: {
        totalAssigned: task.assignedTo?.length || 0,
        totalHistoricalContributors: historicalContributors.length,
        historicalContributors
      }
    };

    return res.status(200).json({
      success: true,
      task: taskData
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

exports.getTasksByEmployee = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.params.userId });
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found", });
    }
    const tasksWithLogs = await TimeLog.distinct("task", { user: req.params.userId, });
    const { liveStatus: filterStatus } = req.query;
    const query = {
      $or: [
        { assignedTo: employee._id },
        { _id: { $in: tasksWithLogs } },
      ],
    };
    const allRelatedTasks = await Task.find(query)
      .populate("project", "projectCode")
      .populate("timeLogs")
      .sort({ createdAt: -1 });

    const tasksWithStatus = allRelatedTasks.map(task => {
      const userLogs = (task.timeLogs || []).filter(log =>
        (log.user?._id || log.user).toString() === req.params.userId
      );

      const isRunning = userLogs.some(log =>
        log.isRunning === true && log.logType === "work"
      );

      const hasWorked = userLogs.some(log =>
        log.logType === "work" && log.durationSeconds > 0
      );

      let status = "To be started";
      if (isRunning) status = "In progress";
      else if (hasWorked) status = "Started";
      return {
        ...task.toObject(),
        liveStatus: status
      };
    });

    let finalTasks = tasksWithStatus;

    if (filterStatus && filterStatus !== "All") {
      const allowed = filterStatus.split(",");
      finalTasks = tasksWithStatus.filter(task =>
        allowed.includes(task.liveStatus)
      );
    }

    const currentlyAssigned = finalTasks.filter(task =>
      task.assignedTo?.some(id => id.toString() === employee._id.toString())
    );
    return res.status(200).json({ success: true, currentlyAssigned, workedAndAssigned: finalTasks });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Internal server error", });
  }
};

exports.getMyTasks = async (req, res) => {
  try {
    const {
      search,
      status,
      liveStatus,
      activeStatus,
      page = 1,
      limit = 6,
    } = req.query;

    const employee = await Employee.findOne({ user: req.user._id });

    if (!employee) {
      return res.status(200).json({
        success: true,
        tasks: [],
        pagination: { current: 1, totalPages: 0, totalTasks: 0 },
      });
    }

    const activeProjects = await Project.find({
      status: "Active",
      deleteStatus: "Disable",
    }).select("_id");

    const query = {
      assignedTo: employee._id,
      project: { $in: activeProjects.map((p) => p._id) },
    };

    if (search) {
      const matchingProjects = await Project.find({
        status: "Active",
        deleteStatus: "Disable",
        $or: [
          { projectCode: { $regex: search, $options: "i" } },
          { title: { $regex: search, $options: "i" } },
        ],
      }).select("_id");

      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { project: { $in: matchingProjects.map((p) => p._id) } },
      ];
    }

    if (status && status !== "All") {
      query.status = status.startsWith("!")
        ? { $ne: status.substring(1) }
        : status;
    }

    if (activeStatus && activeStatus !== "All") {
      query.activeStatus = activeStatus.startsWith("!")
        ? { $ne: activeStatus.substring(1) }
        : activeStatus;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const tasks = await Task.find(query)
      .populate("project", "projectCode title")
      .populate("timeLogs")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    if (!tasks.length) {
      return res.status(200).json({
        success: true,
        tasks: [],
        pagination: {
          current: Number(page),
          totalPages: 0,
          totalTasks: 0,
        },
      });
    }

    let finalTasks = tasks.map((task) => {
      const totalSeconds = (task.timeLogs || []).reduce(
        (acc, log) => acc + (log.durationSeconds || 0),
        0
      );

      return {
        ...task.toObject(),
        liveStatus: task.liveStatus,
        totalLoggedSeconds: totalSeconds,
        totalConsumedHours: totalSeconds / 3600,
      };
    });

    if (liveStatus && liveStatus !== "All") {
      const allowed = liveStatus.split(",");
      finalTasks = finalTasks.filter((t) =>
        allowed.includes(t.liveStatus)
      );
    }

    const total = await Task.countDocuments(query);

    return res.status(200).json({
      success: true,
      tasks: finalTasks,
      pagination: {
        current: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalTasks: total,
      },
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
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

    emitEvent(req, "taskChanged", task._id);
    emitDashboardUpdate(req);
    return res.status(204).send();
  } catch (err) {
    await session.abortTransaction();
    return res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    session.endSession();
  }
};
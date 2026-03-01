const mongoose = require("mongoose");
const Task = require("../models/Task");
const Project = require("../models/Project");
const TimeLog = require("../models/TimeLog");
const Employee = require("../models/Employee");
const sendTaskNotification = require("../utils/notifier");
const { calculateEstimatedHours } = require("../utils/taskHelpers");

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
    return res.status(201).json({ success: true, message: "Task created successfully", task: populatedTask });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { title, assignedTo, project, priority, allocatedTime, description } = req.body;

    const io = req.app.get('socketio');
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    const oldAssigneeIds = task.assignedTo.map(id => id.toString());

    if (title) task.title = title;
    if (priority) task.priority = priority;
    if (assignedTo) task.assignedTo = assignedTo;
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

    if (allocatedTime !== undefined) {
      task.allocatedTime = Number(allocatedTime);
    }
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
      }
    }
    return res.status(200).json({ success: true, message: "Task updated successfully", task: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.updateTaskStatus = async (req, res) => {
  try {
    const { status, activeStatus } = req.body;

    const task = await Task.findById(req.params.id).populate("project");
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (status) task.status = status;
    if (activeStatus) task.activeStatus = activeStatus;

    await task.save();
    return res.status(200).json({
      success: true,
      message: "Task status updated",
      task: {
        _id: task._id,
        status: task.status,
        activeStatus: task.activeStatus
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.getAllTasks = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 5, createdAt, startDate, endDate } = req.query;

    // 1. BUILD PROJECT QUERY
    const projectQuery = { status: 'Active' };

    if (search) {
      projectQuery.$or = [
        { project_code: { $regex: search, $options: "i" } },
        { title: { $regex: search, $options: "i" } }
      ];
    }

    if (createdAt) {
      const dayStart = new Date(createdAt);
      dayStart.setHours(0, 0, 0, 0);
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

    // 2. PAGINATE PROJECTS (These will be your "Cards")
    const skip = (Number(page) - 1) * Number(limit);
    
    const totalProjects = await Project.countDocuments(projectQuery);
    const paginatedProjects = await Project.find(projectQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const projectIds = paginatedProjects.map(p => p._id);

    // 3. FETCH TASKS ONLY FOR THESE PAGINATED PROJECTS
    const taskQuery = { project: { $in: projectIds } };
    
    // Apply status filter to tasks if provided
    if (status && status !== "All") {
      taskQuery.status = status;
    }

    const tasks = await Task.find(taskQuery)
      .populate("project", "project_code title clientName startDate endDate createdAt")
      .populate({ path: "assignedTo", populate: { path: "user", select: "name" } })
      .populate("timeLogs")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      tasks, // Only tasks for the projects on this page
      allProjects: paginatedProjects, // The projects for this page
      pagination: {
        totalProjects: totalProjects,
        totalPages: Math.ceil(totalProjects / limit),
        currentPage: Number(page),
        limit: Number(limit)
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.getTaskDetail = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("project", "project_code title clientName startDate endDate createdAt")
      .populate({ path: "assignedTo", populate: { path: "user", select: "name" } })
      .populate("timeLogs")
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
      return res.status(404).json({ success: false, message: "Employee profile not found" });
    }

    const { liveStatus } = req.query;
    const query = { assignedTo: employee._id };

    if (liveStatus && liveStatus !== "All") {
      query.liveStatus = { $in: liveStatus.split(",") };
    }

    const tasks = await Task.find(query)
      .populate("project", "project_code title startDate endDate createdAt")
      .populate({ path: "assignedTo", populate: { path: "user", select: "name" } })
      .populate("timeLogs")
      .sort({ createdAt: -1 })
      .lean({ virtuals: true });

    return res.status(200).json({ success: true, tasks });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.getMyTasks = async (req, res) => {
  try {
    const { search, status, liveStatus, activeStatus, page = 1, limit = 6 } = req.query;

    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.status(200).json({ success: true, data: [], pagination: { current: 1, totalPages: 0, totalTasks: 0 } });
    }

    const query = { assignedTo: employee._id };

    if (search) {
      const matchingProjects = await Project.find({
        project_code: { $regex: search, $options: "i" }
      }).select("_id");

      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { project: { $in: matchingProjects.map(p => p._id) } }
      ];
    }

    if (status && status !== "All") {
      if (status.startsWith("!")) {
        const excludeValue = status.substring(1);
        query.status = { $ne: excludeValue };
      } else {
        query.status = status;
      }
    }

    if (activeStatus && activeStatus !== "All") {
      if (activeStatus.startsWith("!")) {
        query.activeStatus = { $ne: activeStatus.substring(1) };
      } else {
        query.activeStatus = activeStatus;
      }
    }

    if (liveStatus && liveStatus !== "All") {
      const liveStatuses = liveStatus.split(",");
      query.liveStatus = { $in: liveStatuses };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const tasks = await Task.find(query)
      .populate("project", "project_code title startDate endDate createdAt")
      .populate({ path: "assignedTo", populate: { path: "user", select: "name" } })
      .populate("timeLogs")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Task.countDocuments(query);

    return res.status(200).json({
      success: true,
      tasks,
      pagination: {
        current: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalTasks: total
      }
    });
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
    return res.status(204).send();
  } catch (err) {
    await session.abortTransaction();
    return res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    session.endSession();
  }
};


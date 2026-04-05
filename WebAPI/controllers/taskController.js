const mongoose = require("mongoose");
const Task = require("../models/Task");
const Project = require("../models/Project");
const TimeLog = require("../models/TimeLog");
const Employee = require("../models/Employee");
const sendTaskNotification = require("../utils/notifier");
const { calculateEstimatedHours, getLiveStatus } = require("../utils/taskHelpers");

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
    console.error(err)
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

    if (assignedTo) {
      task.assignedTo = assignedTo;
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
    console.error(err);
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

    // 1. BUILD PROJECT QUERY
    const projectQuery = { status: 'Active' };

    if (search) {
      projectQuery.$or = [
        { projectCode: { $regex: search, $options: "i" } },
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
      .populate("project", "projectCode title clientName startDate endDate createdAt")
      .populate({ path: "assignedTo", populate: { path: "user", select: "name" } })
      .populate("timeLogs")
      .sort({ createdAt: -1 });

    const today = new Date().toISOString().split("T")[0];

    const tasksWithStatus = tasks.map(task => ({
      ...task.toObject(),
      liveStatus: getLiveStatus(task, today)
    }));

    return res.status(200).json({
      success: true,
      tasks: tasksWithStatus, // Only tasks for the projects on this page
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
      .populate("project", "projectCode title clientName startDate endDate createdAt")
      .populate({
        path: "assignedTo", populate: {
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
      });

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    // --- CUSTOM CALCULATIONS ---
    const totalAllocatedSeconds = (task.allocatedTime || 0) * 3600;
    const contributorMap = new Map();

    // Loop through logs to find every unique person who ever worked
    task.timeLogs.forEach((log) => {
      if (log.logType !== "work") return;

      const user = log.user;
      const userId = user?._id.toString();

      if (!contributorMap.has(userId)) {
        contributorMap.set(userId, {
          id: userId,
          name: user?.name || "Unknown",
          code: user?.employee?.employeeCode || "N/A",
          seconds: 0,
          isCurrentlyAssigned: task.assignedTo.some(a => a.user?._id.toString() === userId)
        });
      }

      const current = contributorMap.get(userId);
      current.seconds += (log.durationSeconds || 0);
    });

    const historicalContributors = Array.from(contributorMap.values()).map(c => ({
      ...c,
      percentage: totalAllocatedSeconds > 0 ? ((c.seconds / totalAllocatedSeconds) * 100).toFixed(1) : 0
    }));

    // Construct the final response object
    const taskData = {
      ...task.toObject(),
      stats: {
        totalAssigned: task.assignedTo?.length || 0,
        totalHistoricalContributors: historicalContributors.length,
        historicalContributors
      }
    };

    return res.status(200).json({ success: true, task: taskData });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.getTasksByEmployee = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.params.userId });
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }
    const tasksWithLogs = await TimeLog.distinct("task", { user: req.params.userId });

    const { liveStatus } = req.query;
    const query = {
      $or: [
        { assignedTo: employee._id },
        { _id: { $in: tasksWithLogs } }
      ]
    };

    if (liveStatus && liveStatus !== "All") {
      query.liveStatus = { $in: liveStatus.split(",") };
    }

    const today = new Date().toISOString().split("T")[0];

    const allRelatedTasks = await Task.find(query)
      .populate("project", "projectCode")
      .populate("timeLogs")
      .sort({ createdAt: -1 })
      .lean({ virtuals: true });

    const tasksWithStatus = allRelatedTasks.map(task => ({
      ...task,
      liveStatus: getLiveStatus(task, today)
    }));

    const response = {
      success: true,
      currentlyAssigned: tasksWithStatus.filter(task =>
        task.assignedTo?.toString() === employee._id.toString()
      ),
      workedAndAssigned: tasksWithStatus
    };

    return res.status(200).json(response);

  } catch (err) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.getMyTasks = async (req, res) => {
  try {
    const { search, status, liveStatus, activeStatus, page = 1, limit = 6 } = req.query;

    // 1. Find the Employee profile
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.status(200).json({
        success: true,
        tasks: [],
        pagination: { current: 1, totalPages: 0, totalTasks: 0 }
      });
    }

    // 2. Build Query Base
    const query = { assignedTo: employee._id };

    // 3. Project Filter (Only show tasks from projects that AREN'T deleted/archived)
    // You can add { isDeleted: false } or { status: "Active" } here
    const activeProjectFilter = { status: "Active" };

    if (search) {
      const matchingProjects = await Project.find({
        ...activeProjectFilter,
        $or: [
          { projectCode: { $regex: search, $options: "i" } },
          { title: { $regex: search, $options: "i" } }
        ]
      }).select("_id");

      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { project: { $in: matchingProjects.map(p => p._id) } }
      ];
    }

    // 4. Status Filters
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

    if (liveStatus && liveStatus !== "All") {
      query.liveStatus = { $in: liveStatus.split(",") };
    }

    // 5. Execution with Population
    const skip = (Number(page) - 1) * Number(limit);

    // We use .find(query) but also ensure the project itself exists and is valid
    const tasks = await Task.find(query)
      .populate({
        path: "project",
        match: activeProjectFilter, // Only populates if project is active
        select: "projectCode title startDate endDate createdAt"
      })
      .populate({
        path: "assignedTo",
        populate: { path: "user", select: "name" }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(); // Use lean for faster processing and to allow manual property editing

    // 6. Filter out tasks where project became null due to the 'match' filter
    const filteredTasks = tasks.filter(task => task.project !== null);

    // 7. Calculate Seconds for Utilization Bar
    // If your Task model doesn't have a virtual for totalSeconds, calculate it here:
    // const today = new Date().toISOString().split("T")[0];
    const finalTasks = filteredTasks.map(task => {
      const totalSeconds = task.timeLogs?.reduce((acc, log) => acc + (log.durationSeconds || 0), 0) || 0;

      return {
        ...task,
        totalLoggedSeconds: totalSeconds,
        totalConsumedHours: totalSeconds / 3600,
        // liveStatus: getLiveStatus(task, today) // 🔥 IMPORTANT
      };
    });

    const total = await Task.countDocuments(query);

    return res.status(200).json({
      success: true,
      tasks: tasks,
      pagination: {
        current: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalTasks: total
      }
    });
  } catch (err) {
    console.error("GetMyTasks Error:", err);
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


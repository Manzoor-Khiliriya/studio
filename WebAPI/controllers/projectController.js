const Project = require("../models/Project");
const Task = require("../models/Task");
const TimeLog = require("../models/TimeLog");
const { emitDashboardUpdate } = require("../utils/socket");
const { calculateEstimatedHours } = require("../utils/taskHelpers");

const emitEvent = (req, event, data) => {
  const io = req.app.get("socketio");
  if (!io) return;
  io.emit(event, data);
};

exports.createProject = async (req, res) => {
  try {
    const { projectCode, projectType, title, clientName, startDate, endDate } = req.body;
    if (!projectCode || !projectType || !title || !startDate || !endDate) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }
    const existingProject = await Project.findOne({ projectCode: projectCode.toUpperCase() });
    if (existingProject) {
      return res.status(409).json({ success: false, message: "Project Code already exists" });
    }
    const project = await Project.create({
      projectCode: projectCode.toUpperCase(),
      projectType,
      title,
      clientName,
      startDate,
      endDate
    });
    emitEvent(req, "projectChanged", project);
    emitDashboardUpdate(req);
    return res.status(201).json({ success: true, message: "Project created successfully", project });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.getAllProjects = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 5,
      search,
      activeTab,
      createdAt,
      startDate,
      endDate,
      createdFrom,
      createdTo,
      taskSearch,
      liveStatus,
      taskStatus,
      projectType,
      status
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    let query = {};

    if (activeTab === "live") {
      query.deleteStatus = { $ne: "Enable" };
    }

    if (projectType && projectType !== "All") {
      query.projectType = projectType;
    }

    if (status && status !== "All") {
      query.status = status;
    }

    if (activeTab === "live") {
      if (search) {
        query.$or = [
          { projectCode: { $regex: search, $options: "i" } },
          { title: { $regex: search, $options: "i" } }
        ];
      }
    } else {
      if (search) {
        query.$or = [
          { projectCode: { $regex: search, $options: "i" } },
          { title: { $regex: search, $options: "i" } },
          { clientName: { $regex: search, $options: "i" } },
          { projectType: { $regex: search, $options: "i" } },
          { status: { $regex: search, $options: "i" } },
          { invoiceNumber: { $regex: search, $options: "i" } }
        ];
      }
    }

    if (activeTab === "live" && createdAt) {
      const start = new Date(createdAt);
      const end = new Date(createdAt);
      end.setHours(23, 59, 59, 999);

      query.createdAt = { $gte: start, $lte: end };
    }

    if (activeTab !== "live" && (createdFrom || createdTo)) {

      if (createdFrom && !createdTo) {
        const start = new Date(createdFrom);
        const end = new Date(createdFrom);
        end.setHours(23, 59, 59, 999);

        query.createdAt = { $gte: start, $lte: end };
      }

      else if (!createdFrom && createdTo) {
        const start = new Date(createdTo);
        const end = new Date(createdTo);
        end.setHours(23, 59, 59, 999);

        query.createdAt = { $gte: start, $lte: end };
      }

      else {
        const start = new Date(createdFrom);
        const end = new Date(createdTo);
        end.setHours(23, 59, 59, 999);

        query.createdAt = { $gte: start, $lte: end };
      }
    }

    if (startDate || endDate) {
      if (startDate && endDate) {
        query.startDate = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      } else if (startDate) {
        const s = new Date(startDate);
        const e = new Date(startDate);
        e.setHours(23, 59, 59, 999);
        query.startDate = { $gte: s, $lte: e };
      } else if (endDate) {
        const s = new Date(endDate);
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        query.endDate = { $gte: s, $lte: e };
      }
    }

    const projects = await Project.find(query)
      .sort({ createdAt: -1 })
      .populate({
        path: "tasks",
        match: {
          ...(taskSearch && { title: { $regex: taskSearch, $options: "i" } }),
          ...(taskStatus && taskStatus !== "All" && { status: taskStatus })
        },
        populate: [
          { path: "assignedTo", populate: { path: "user", select: "name" } },
          { path: "timeLogs" }
        ]
      });

    let projectsWithStatus = projects.map(project => ({
      ...project.toObject(),
      tasks: (project.tasks || []).map(task => ({
        ...task.toObject(),
        liveStatus: task.liveStatus
      }))
    }));

    if (liveStatus && liveStatus !== "All") {
      projectsWithStatus = projectsWithStatus.map(project => ({
        ...project,
        tasks: project.tasks.filter(t => t.liveStatus === liveStatus)
      }));
    }

    const isTaskFilterApplied =
      (taskSearch && taskSearch.trim() !== "") ||
      (taskStatus && taskStatus !== "All") ||
      (liveStatus && liveStatus !== "All");

    if (isTaskFilterApplied) {
      projectsWithStatus = projectsWithStatus.filter(
        project => project.tasks && project.tasks.length > 0
      );
    }

    const totalTasksAcrossAllFilteredProjects = projectsWithStatus.reduce(
      (acc, project) => acc + (project.tasks?.length || 0),
      0
    );

    const totalProjects = projectsWithStatus.length;
    const paginatedProjects = projectsWithStatus.slice(skip, skip + Number(limit));

    return res.status(200).json({
      success: true,
      projects: paginatedProjects,
      pagination: {
        totalProjects: totalProjects,
        totalTasks: totalTasksAcrossAllFilteredProjects,
        totalPages: Math.ceil(totalProjects / limit),
        currentPage: Number(page)
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

exports.getEstimate = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const hours = await calculateEstimatedHours(project.startDate, project.endDate);

    return res.status(200).json({ success: true, hours });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (updateData.projectCode) {
      updateData.projectCode = updateData.projectCode.toUpperCase();
    }

    const project = await Project.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    emitEvent(req, "projectChanged", project);
    emitDashboardUpdate(req);
    return res.status(200).json({
      success: true,
      message: "Project updated successfully",
      project
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "Project Code already exists" });
    }
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    const tasks = await Task.find({ project: projectId }).select("_id");
    const taskIds = tasks.map(task => task._id);

    if (taskIds.length > 0) {
      await TimeLog.deleteMany({ task: { $in: taskIds } });
    }

    await Task.deleteMany({ project: projectId });
    await Project.deleteOne({ _id: projectId });

    emitEvent(req, "projectChanged", projectId);
    emitDashboardUpdate(req);
    return res.status(200).json({
      success: true,
      message: "Project and all related tasks/timelogs deleted successfully."
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.getTaskPerformanceReport = async (req, res) => {
  try {
    const { page = 1, limit = 5, search = "" } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const projectQuery = {};
    if (search) {
      projectQuery.$or = [
        { projectCode: { $regex: search, $options: "i" } },
        { title: { $regex: search, $options: "i" } }
      ];
    }

    const report = await Project.aggregate([
      { $match: projectQuery },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: "tasks",
          localField: "_id",
          foreignField: "project",
          as: "taskList"
        }
      },
      {
        $lookup: {
          from: "timelogs",
          localField: "taskList._id",
          foreignField: "task",
          pipeline: [{ $match: { logType: "work" } }],
          as: "workLogs"
        }
      }
    ]);

    const totalProjects = await Project.countDocuments(projectQuery);

    res.json({
      projects: report,
      pagination: {
        totalProjects,
        totalPages: Math.ceil(totalProjects / limit),
        currentPage: Number(page)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getProjectCalendarStacks = async (req, res) => {
  try {
    const { search } = req.query;

    const projectStacks = await Project.aggregate([
      {
        $match: {
          deleteStatus: "Disable",

          ...(search && {
            $or: [
              { projectCode: { $regex: search, $options: "i" } },
              { title: { $regex: search, $options: "i" } }
            ]
          })
        }
      },

      // ✅ get tasks
      {
        $lookup: {
          from: "tasks",
          localField: "_id",
          foreignField: "project",
          as: "taskList"
        }
      },

      // ✅ get logs
      {
        $lookup: {
          from: "timelogs",
          localField: "taskList._id",
          foreignField: "task",
          as: "timeLogs"
        }
      },

      {
        $project: {
          id: { $toString: "$_id" },
          title: "$title",
          start: { $dateToString: { format: "%Y-%m-%d", date: "$startDate" } },
          end: { $dateToString: { format: "%Y-%m-%d", date: "$endDate" } },

          extendedProps: {
            projectCode: "$projectCode",

            tasks: {
              $map: {
                input: "$taskList",
                as: "task",
                in: {
                  _id: "$$task._id",
                  title: "$$task.title",

                  liveStatus: {
                    $let: {
                      vars: {
                        taskLogs: {
                          $filter: {
                            input: "$timeLogs",
                            as: "log",
                            cond: { $eq: ["$$log.task", "$$task._id"] }
                          }
                        }
                      },
                      in: {
                        $cond: [
                          // 🔥 IN PROGRESS
                          {
                            $gt: [
                              {
                                $size: {
                                  $filter: {
                                    input: "$$taskLogs",
                                    as: "log",
                                    cond: {
                                      $and: [
                                        { $eq: ["$$log.isRunning", true] },
                                        { $eq: ["$$log.logType", "work"] }
                                      ]
                                    }
                                  }
                                }
                              },
                              0
                            ]
                          },
                          "In progress",

                          // 🔥 STARTED
                          {
                            $cond: [
                              {
                                $gt: [
                                  {
                                    $size: {
                                      $filter: {
                                        input: "$$taskLogs",
                                        as: "log",
                                        cond: {
                                          $and: [
                                            { $eq: ["$$log.logType", "work"] },
                                            { $gt: ["$$log.durationSeconds", 0] }
                                          ]
                                        }
                                      }
                                    }
                                  },
                                  0
                                ]
                              },
                              "Started",

                              // 🔥 TO BE STARTED
                              "To be started"
                            ]
                          }
                        ]
                      }
                    }
                  }
                }
              }
            },

            taskCount: { $size: "$taskList" }
          }
        }
      }
    ]);

    res.status(200).json(projectStacks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const Project = require("../models/Project");
const Task = require("../models/Task");
const { calculateEstimatedHours } = require("../utils/taskHelpers");

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

    return res.status(201).json({ success: true, message: "Project created successfully", project });
  } catch (error) {
    console.error(error);

    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.getAllProjects = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 5,
      search,
      createdAt,
      startDate,
      endDate,
      taskSearch, // New
      liveStatus, // New
      taskStatus  // New
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    let query = { };

    if (search) {
      query.$or = [
        { projectCode: { $regex: search, $options: "i" } },
        { title: { $regex: search, $options: "i" } }
      ];
    }

    const isTaskSearching = (taskSearch && taskSearch.trim() !== "");
    const isLiveStatusFiltering = (liveStatus && liveStatus !== "All" && liveStatus !== "");
    const isTaskStatusFiltering = (taskStatus && taskStatus !== "All" && taskStatus !== "");

    if (isTaskSearching || isLiveStatusFiltering || isTaskStatusFiltering) {
      const taskFilter = {};
      if (isTaskSearching) taskFilter.title = { $regex: taskSearch, $options: "i" };
      if (isLiveStatusFiltering) taskFilter.liveStatus = liveStatus;
      if (isTaskStatusFiltering) taskFilter.status = taskStatus;

      const matchingTaskProjects = await Task.find(taskFilter).distinct("project");

      query._id = { $in: matchingTaskProjects };
    }

    if (createdAt) {
      const start = new Date(createdAt);
      const end = new Date(createdAt);
      end.setHours(23, 59, 59, 999);
      query.createdAt = { $gte: start, $lte: end };
    }

    if (startDate || endDate) {
      query.startDate = {};

      if (startDate && endDate) {
        query.startDate = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      } else if (startDate) {
        const start = new Date(startDate);
        const end = new Date(startDate);
        end.setHours(23, 59, 59, 999);
        query.startDate = { $gte: start, $lte: end };
      } else if (endDate) {
        const start = new Date(endDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.endDate = { $gte: start, $lte: end };
        delete query.startDate;
      }
    }

    const total = await Project.countDocuments(query);

    const projects = await Project.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate({
        path: "tasks",
        match: {
          ...(taskSearch && { title: { $regex: taskSearch, $options: "i" } }),
          ...(liveStatus && liveStatus !== "All" && { liveStatus }),
          ...(taskStatus && taskStatus !== "All" && { status: taskStatus }),
        },
        populate: [
          { path: "assignedTo", populate: { path: "user", select: "name" } },
          { path: "timeLogs" }
        ]
      });

    return res.status(200).json({
      success: true,
      projects,
      pagination: { totalProjects: total, totalPages: Math.ceil(total / limit), currentPage: Number(page) }
    });
  } catch (error) {
    console.error("Project Fetch Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
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

    return res.status(200).json({ 
      success: true, 
      message: "Project updated successfully", 
      project 
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "Project Code already exists" });
    }
    console.error(error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    await Project.deleteOne({ _id: project._id });
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// project.controller.js

exports.getTaskPerformanceReport = async (req, res) => {
  try {
    const { page = 1, limit = 5, search = "" } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Filter projects first - This is why it's faster here
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

      // Join Tasks
      {
        $lookup: {
          from: "tasks",
          localField: "_id",
          foreignField: "project",
          as: "taskList"
        }
      },

      // Join Timelogs only for the tasks found above
      {
        $lookup: {
          from: "timelogs",
          localField: "taskList._id",
          foreignField: "task",
          pipeline: [{ $match: { logType: "work" } }], // Filter logs early in the join
          as: "workLogs"
        }
      },

      {
        $project: {
          projectCode: 1,
          title: 1,
          clientName: 1,
          startDate: 1,
          endDate: 1,
          taskList: {
            $map: {
              input: "$taskList",
              as: "t",
              in: {
                _id: "$$t._id",
                title: "$$t.title",
                status: "$$t.status",
                allocatedTime: { $ifNull: ["$$t.allocatedTime", 0] },
                // Calculate hours for this specific task from the joined workLogs
                consumedHours: {
                  $round: [
                    {
                      $divide: [
                        {
                          $reduce: {
                            input: {
                              $filter: {
                                input: "$workLogs",
                                as: "log",
                                cond: { $eq: ["$$log.task", "$$t._id"] }
                              }
                            },
                            initialValue: 0,
                            in: { $add: ["$$value", { $ifNull: ["$$this.durationSeconds", 0] }] }
                          }
                        },
                        3600 // Convert seconds to hours
                      ]
                    },
                    2
                  ]
                }
              }
            }
          }
        }
      },

      // Final Totals for the Project Card
      {
        $addFields: {
          totalBudget: { $sum: "$taskList.allocatedTime" },
          totalConsumed: { $sum: "$taskList.consumedHours" },
          progressPercent: {
            $cond: [
              { $gt: [{ $sum: "$taskList.allocatedTime" }, 0] },
              {
                $round: [
                  {
                    $multiply: [
                      { $divide: [{ $sum: "$taskList.consumedHours" }, { $sum: "$taskList.allocatedTime" }] },
                      100
                    ]
                  },
                  0
                ]
              },
              0
            ]
          }
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
        $match: search
          ? {
            $or: [
              { projectCode: { $regex: search, $options: "i" } },
              { title: { $regex: search, $options: "i" } }
            ]
          }
          : {}
      },
      {
        $lookup: {
          from: "tasks",
          localField: "_id",
          foreignField: "project",
          as: "taskList"
        }
      },
      {
        $project: {
          id: { $toString: "$_id" },
          title: "$title", // Project Title
          start: { $dateToString: { format: "%Y-%m-%d", date: "$startDate" } },
          end: { $dateToString: { format: "%Y-%m-%d", date: "$endDate" } },
          extendedProps: {
            projectCode: "$projectCode",
            tasks: "$taskList", // Send the whole array of tasks
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
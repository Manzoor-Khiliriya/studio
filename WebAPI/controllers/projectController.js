const Project = require("../models/Project");
const Task = require("../models/Task");
const { calculateEstimatedHours } = require("../utils/taskHelpers");

exports.createProject = async (req, res) => {
  try {
    const { project_code, title, clientName, startDate, endDate } = req.body;

    if (!project_code || !title || !startDate || !endDate) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const existingProject = await Project.findOne({ project_code: project_code.toUpperCase() });

    if (existingProject) {
      return res.status(409).json({ success: false, message: "Project Code already exists" });
    }

    const project = await Project.create({
      project_code: project_code.toUpperCase(),
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

// exports.getAllProjects = async (req, res) => {
//   try {
//     const projects = await Project.find()
//       .sort({ createdAt: -1 });

//     return res.status(200).json({ success: true, projects });

//   } catch (error) {
//     return res.status(500).json({ success: false, message: "Internal server error" });
//   }
// };

exports.getAllProjects = async (req, res) => {
  try {
    const { page = 1, limit = 5, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Filter logic
    const query = {};
    if (search) {
      query.$or = [
        { project_code: { $regex: search, $options: "i" } },
        { title: { $regex: search, $options: "i" } }
      ];
    }

    const total = await Project.countDocuments(query);

    const projects = await Project.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      // This populates the virtual "tasks" we created in the schema
      .populate({
        path: 'tasks',
        populate: { path: 'assignedTo', populate: { path: 'user', select: 'name' } }
      });

    return res.status(200).json({ 
      success: true, 
      projects,
      pagination: {
        totalProjects: total,
        totalPages: Math.ceil(total / limit),
        currentPage: Number(page)
      }
    });
  } catch (error) {
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
    const { project_code, title, clientName, startDate, endDate, status } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    if (project_code) project.project_code = project_code.toUpperCase();
    if (title) project.title = title;
    if (clientName !== undefined) project.clientName = clientName;
    if (startDate) project.startDate = startDate;
    if (endDate) project.endDate = endDate;
    if (status) project.status = status;

    await project.save();
    return res.status(200).json({ success: true, message: "Project updated successfully", project });
  } catch (error) {
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

exports.getProjectCalendarStacks = async (req, res) => {
  try {
    const { search } = req.query;

    const taskEvents = await Project.aggregate([
      {
        $match: search 
          ? { $or: [
                { project_code: { $regex: search, $options: "i" } },
                { title: { $regex: search, $options: "i" } }
              ] 
            }
          : {}
      },
      {
        $lookup: {
          from: "tasks", // Ensure this matches your collection name
          localField: "_id",
          foreignField: "project",
          as: "taskList"
        }
      },
      // CRITICAL: Turn each task into its own event
      { $unwind: "$taskList" },
      {
        $project: {
          _id: 0,
          id: { $toString: "$taskList._id" }, // Using Task ID for navigation
          title: "$taskList.title",           // Task Title
          start: { $dateToString: { format: "%Y-%m-%d", date: "$startDate" } },
          end: { $dateToString: { format: "%Y-%m-%d", date: "$endDate" } },
          allDay: { $literal: true },
          extendedProps: {
            projectCode: "$project_code",
            liveStatus: "$taskList.liveStatus",
            hasActive: { $eq: ["$taskList.liveStatus", "In progress"] }
          }
        }
      }
    ]);

    res.status(200).json(taskEvents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
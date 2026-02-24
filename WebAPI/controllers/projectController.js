const Project = require("../models/Project");

// @desc    Create a new project
// @route   POST /api/projects
exports.createProject = async (req, res) => {
  try {
    const { projectNumber, title, description, clientName } = req.body;

    // Check if project number already exists
    const existingProject = await Project.findOne({ projectNumber: projectNumber.toUpperCase() });
    if (existingProject) {
      return res.status(400).json({ message: "Project ID already exists" });
    }

    const project = await Project.create({
      projectNumber,
      title,
      description,
      clientName
    });

    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all projects
// @route   GET /api/projects
exports.getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a project
// @route   PUT /api/projects/:id
exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a project
// @route   DELETE /api/projects/:id
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    
    // Note: You might want to delete associated tasks here too
    res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const TaskStatus = require("../models/TaskStatus");

exports.getTaskStatuses = async (req, res) => {
  try {
    const { type, status = "Enable" } = req.query;

    const filter = {};

    if (type) filter.type = type;
    if (status) filter.status = status;

    const taskStatuses = await TaskStatus.find(filter)
      .sort({ order: 1, createdAt: 1 });

    res.json(taskStatuses);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
};

exports.createTaskStatus = async (req, res) => {
  try {
    const { name, type, order } = req.body;

    const exists = await TaskStatus.findOne({
      name: name.trim(),
      type,
    });

    if (exists) {
      return res.status(400).json({
        error: "Status already exists",
      });
    }

    const taskStatus = await TaskStatus.create({
      name,
      type,
      order,
    });

    res.status(201).json(taskStatus);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
};

exports.updateTaskStatus = async (req, res) => {
  try {
    const taskStatus = await TaskStatus.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!taskStatus) {
      return res.status(404).json({
        error: "Status not found",
      });
    }

    res.json(taskStatus);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
};

exports.deleteTaskStatus = async (req, res) => {
  try {
    const taskStatus = await TaskStatus.findById(req.params.id);

    if (!taskStatus) {
      return res.status(404).json({
        error: "Status not found",
      });
    }

    const Task = require("../models/Task");

    const inUse = await Task.exists({
      $or: [
        { status: taskStatus._id },
        { activeStatus: taskStatus._id },
      ],
    });

    if (inUse) {
      return res.status(400).json({
        error: "Status is being used by tasks",
      });
    }

    await taskStatus.deleteOne();

    res.json({
      message: "Status deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
};
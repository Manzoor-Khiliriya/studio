const TaskStatus = require("../models/TaskStatus");

const emitEvent = (req, event, data, userIds = []) => {
  const io = req.app.get("socketio");
  if (!io) return;
  if (userIds.length) {
    userIds.forEach((id) => {
      io.to(id.toString()).emit(event, data);
    });
  } else {
    io.emit(event, data);
  }
};

exports.getTaskStatuses = async (req, res) => {
  try {
    const { type } = req.query;

    const filter = {};

    if (type) filter.type = type;

    const taskStatuses = await TaskStatus.find(filter).sort({
      order: 1,
      createdAt: 1,
    });

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

    // emitEven(req, "taskStatusChanged", updatedTask);

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
      $or: [{ status: taskStatus._id }, { activeStatus: taskStatus._id }],
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

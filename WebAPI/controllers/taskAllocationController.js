const Task = require("../models/Task");
const Employee = require("../models/Employee");
const TaskAllocation = require("../models/TaskAllocation");

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

exports.updateTaskAllocation = async (req, res) => {
  try {
    const { role, priorityOrder, allocatedHours } = req.body;

    const allocation = await TaskAllocation.findById(req.params.id);

    if (!allocation) {
      return res.status(404).json({
        success: false,
        message: "Allocation not found",
      });
    }

    if (role !== undefined) {
      allocation.role = role;
    }

    if (priorityOrder !== undefined) {
      allocation.priorityOrder = priorityOrder;
    }

    if (allocatedHours !== undefined) {
      allocation.allocatedHours = allocatedHours;
    }

    await allocation.save();
    emitEvent(req, "allocationChanged", {
      taskId: allocation.task,
    });
    return res.status(200).json({
      success: true,
      message: "Allocation updated",
      allocation,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

exports.deleteTaskAllocation = async (req, res) => {
  try {
    const allocation = await TaskAllocation.findById(req.params.id);

    if (!allocation) {
      return res.status(404).json({
        success: false,
        message: "Allocation not found",
      });
    }

    await allocation.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Allocation deleted",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

exports.getEmployeeAllocations = async (req, res) => {
  try {
    const allocations = await TaskAllocation.find()

      .populate({
        path: "employee",
        populate: {
          path: "user",
          select: "name",
        },
      })

      .populate({
        path: "task",
        select: "title project",

        populate: {
          path: "project",
          select: "title projectCode",
        },
      });

    const grouped = {};

    allocations.forEach((allocation) => {
      const employeeId = allocation.employee?._id?.toString();

      if (!employeeId) return;

      if (!grouped[employeeId]) {
        grouped[employeeId] = {
          employee: allocation.employee,

          tasks: [],
        };
      }
      grouped[employeeId].tasks.push(allocation);
    });

    return res.status(200).json({
      success: true,
      employees: Object.values(grouped),
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

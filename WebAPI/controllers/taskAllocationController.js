const Task = require("../models/Task");
const Employee = require("../models/Employee");
const TaskAllocation = require("../models/TaskAllocation");

exports.createTaskAllocation = async (req, res) => {
  try {
    const { task, employee, role, priorityOrder, allocatedHours } = req.body;

    if (!task || !employee || !priorityOrder) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const taskExists = await Task.findById(task);

    if (!taskExists) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    const employeeExists = await Employee.findById(employee);

    if (!employeeExists) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const existing = await TaskAllocation.findOne({
      task,
      employee,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Allocation already exists",
      });
    }

    const allocation = await TaskAllocation.create({
      task,
      employee,
      role,
      priorityOrder,
      allocatedHours,
    });

    const populated = await TaskAllocation.findById(allocation._id)
      .populate("task")
      .populate({
        path: "employee",
        populate: {
          path: "user",
          select: "name email",
        },
      });

    return res.status(201).json({
      success: true,
      message: "Task allocation created",
      allocation: populated,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
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

exports.getEmployeeTaskQueue = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const allocations = await TaskAllocation.find({
      employee: employeeId,
    })
      .populate({
        path: "task",
        populate: {
          path: "project",
          select: "title projectCode",
        },
      })
      .sort({ priorityOrder: 1 });

    return res.status(200).json({
      success: true,
      allocations,
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

exports.getMyTaskQueue = async (req, res) => {
  try {
    const employee = await Employee.findOne({
      user: req.user._id,
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const allocations = await TaskAllocation.find({
      employee: employee._id,
    })
      .populate({
        path: "task",
        populate: {
          path: "project",
          select: "title projectCode",
        },
      })
      .sort({ priorityOrder: 1 });

    return res.status(200).json({
      success: true,
      allocations,
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
        select: "title priority status",
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

const Employee = require("../models/Employee");
const Project = require("../models/Project");
const Task = require("../models/Task");

const getIO = (req) => req.app.get("socketio");

exports.emitToUser = (req, userId, event, data) => {
  const io = getIO(req);
  if (!io) return;

  io.to(userId.toString()).emit(event, data);
};

exports.emitToRole = (req, role, event, data) => {
  const io = getIO(req);
  if (!io) return;

  io.to(role).emit(event, data);
};

exports.emitToDepartment = (req, departmentId, event, data) => {
  const io = getIO(req);
  if (!io) return;

  io.to(`department:${departmentId}`).emit(event, data);
};

exports.emitToAll = (req, event, data) => {
  const io = getIO(req);
  if (!io) return;

  io.emit(event, data);
};

exports.emitDashboardUpdate = (req) => {
  const io = getIO(req);
  if (!io) return;

  io.emit("dashboardUpdated");
};

exports.emitToEmployeeHierarchy = async (req, userId, event, data) => {
  const io = getIO(req);
  if (!io) return;

  const employee = await Employee.findOne({ user: userId }).lean();

  io.to(userId.toString()).emit(event, data);

  if (!employee) return;

  if (employee.manager) {
    io.to(employee.manager.toString()).emit(event, data);
  }

  if (employee.hrManager) {
    io.to(employee.hrManager.toString()).emit(event, data);
  }

  employee.admin?.forEach((adminId) => {
    io.to(adminId.toString()).emit(event, data);
  });
};

exports.emitToProject = async (req, projectId, event, data) => {
  const io = getIO(req);
  if (!io) return;

  io.to("Admin").emit(event, data);
  io.to("Manager").emit(event, data);

  const project = await Project.findById(projectId).populate({
    path: "tasks",
    populate: {
      path: "assignedTo",
      select: "user",
    },
  });

  if (!project) return;

  const users = new Set();

  project.tasks.forEach((task) => {
    task.assignedTo.forEach((emp) => {
      users.add(emp.user.toString());
    });
  });

  users.forEach((userId) => {
    io.to(userId).emit(event, data);
  });
};

exports.emitToTask = async (req, task, event, data) => {
  const io = getIO(req);
  if (!io) return;

  io.to("Admin").emit(event, data);
  io.to("Manager").emit(event, data);
  const taskId = task._id || task;

  const populatedTask = await Task.findById(taskId).populate({
    path: "assignedTo",
    populate: {
      path: "user",
      select: "_id name",
    },
  });

  if (!populatedTask) return;

  const users = new Set();

  populatedTask.assignedTo.forEach((emp) => {
    if (emp.user?._id) {
      users.add(emp.user._id.toString());
    }
  });

  console.log(populatedTask.assignedTo.length);

  console.log("Socket users:");

  users.forEach((userId) => {
    const room = io.sockets.adapter.rooms.get(userId);
    console.log(userId);
    io.to(userId).emit(event, data);
  });
};

exports.emitToLeaveUsers = async (req, userId, event, data) => {
  const io = getIO(req);
  if (!io) return;

  const employee = await Employee.findOne({ user: userId }).lean();
  if (!employee) return;

  const users = new Set();
  users.add(userId.toString());
  if (employee.manager) {
    users.add(employee.manager.toString());
  }
  if (employee.hrManager) {
    users.add(employee.hrManager.toString());
  }

  employee.admin?.forEach((adminId) => {
    users.add(adminId.toString());
  });

  users.forEach((id) => {
    io.to(id).emit(event, data);
  });
};

exports.emitToTaskHierarchy = async (req, userId, event, data) => {
  const io = getIO(req);
  if (!io) return;

  const employee = await Employee.findOne({ user: userId }).lean();
  if (!employee) return;

  const users = new Set();

  // Employee
  users.add(userId.toString());

  // Manager
  if (employee.manager) {
    users.add(employee.manager.toString());
  }

  // Admins
  employee.admin?.forEach((adminId) => {
    users.add(adminId.toString());
  });

  users.forEach((id) => {
    io.to(id).emit(event, data);
  });
};

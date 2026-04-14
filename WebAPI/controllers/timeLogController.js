const TimeLog = require("../models/TimeLog");
const Task = require("../models/Task");
const Employee = require("../models/Employee");
const mongoose = require("mongoose");
const { applyProficiency } = require("../utils/userHelpers");
const { emitDashboardUpdate } = require("../utils/socket");

const emitEvent = (req, event, data, userId = null) => {
  const io = req.app.get("socketio");
  if (!io) return;
  io.emit(event, data);
  if (userId) {
    io.to(userId.toString()).emit(event, data);
  }
};

exports.startTimer = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { taskId } = req.body;
    const userId = req.user._id;
    const today = new Date().toISOString().split("T")[0];

    const employee = await Employee.findOne({ user: userId });
    if (!employee) throw new Error("Employee profile not found.");

    const task = await Task.findOne({ _id: taskId, assignedTo: employee._id });
    if (!task) throw new Error("Task not found or not assigned to you.");

    const logs = await TimeLog.find({ user: userId, dateString: today, logType: "work" });
    const hoursToday = logs.reduce((sum, l) => sum + (l.durationSeconds / 3600 || 0), 0);

    if (hoursToday >= employee.dailyWorkLimit) {
      throw new Error(`Daily limit reached (${employee.dailyWorkLimit} hrs).`);
    }

    const activeLog = await TimeLog.findOne({ user: userId, isRunning: true });

    if (activeLog) {
      const now = new Date();
      const rawSeconds = Math.max(0, Math.floor((now - new Date(activeLog.startTime)) / 1000));

      if (activeLog.logType === "work") {
        const { adjustedSeconds } = await applyProficiency(userId, rawSeconds);
        activeLog.rawDurationSeconds = rawSeconds;
        activeLog.durationSeconds = adjustedSeconds;
      } else {
        activeLog.durationSeconds = rawSeconds;
      }

      activeLog.endTime = now;
      activeLog.isRunning = false;
      await activeLog.save({ session });
    }

    const log = await TimeLog.create([{
      user: userId,
      task: taskId,
      startTime: new Date(),
      isRunning: true,
      logType: "work",
      action: "Start",
      dateString: today
    }], { session });

    await session.commitTransaction();
    emitEvent(req, "taskChanged", { taskId });
    emitEvent(req, "timeLogChanged", log[0], userId);
    emitDashboardUpdate(req);
    res.status(201).json(log[0]);

  } catch (err) {
    await session.abortTransaction();
    res.status(400).json({ error: err.message });
  } finally {
    session.endSession();
  }
};

exports.togglePause = async (req, res) => {
  try {
    const userId = req.user._id;

    const active = await TimeLog.findOne({ user: userId, isRunning: true });
    if (!active) return res.status(404).json({ message: "No active timer." });

    const now = new Date();
    const rawSeconds = Math.max(0, Math.floor((now - new Date(active.startTime)) / 1000));

    if (active.logType === "work") {
      const { adjustedSeconds } = await applyProficiency(userId, rawSeconds);
      active.rawDurationSeconds = rawSeconds;
      active.durationSeconds = adjustedSeconds;
    } else {
      active.durationSeconds = rawSeconds;
    }

    active.endTime = now;
    active.isRunning = false;
    await active.save();

    const newType = active.logType === "work" ? "break" : "work";

    const newLog = await TimeLog.create({
      user: userId,
      task: active.task,
      startTime: new Date(),
      logType: newType,
      isRunning: true,
      dateString: active.dateString
    });
    emitEvent(req, "timeLogChanged", { status: newType, log: newLog }, userId);
    emitDashboardUpdate(req);
    res.json({ status: newType, log: newLog });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.stopTimer = async (req, res) => {
  try {
    const log = await TimeLog.findOne({ user: req.user._id, isRunning: true });
    if (!log) return res.status(400).json({ message: "No active timer found." });

    const now = new Date();
    const rawSeconds = Math.max(0, Math.floor((now - new Date(log.startTime)) / 1000));

    const { adjustedSeconds } = await applyProficiency(req.user._id, rawSeconds);

    log.endTime = now;
    log.isRunning = false;
    log.rawDurationSeconds = rawSeconds;
    log.durationSeconds = adjustedSeconds;
    log.action = "Stop";

    await log.save();
    emitEvent(req, "taskChanged", { taskId: log.task });
    emitEvent(req, "timeLogChanged", log, req.user._id);
    emitDashboardUpdate(req);
    res.json({ message: "Session Terminated", log });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMyLogs = async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const logs = await TimeLog.find({
      user: req.user._id,
      dateString: today
    })
      .populate("task", "title projectNumber")
      .sort({ startTime: -1 });
    const activeLog = logs.find(l => l.isRunning);
    let totalSeconds = 0;
    logs.forEach(log => {
      if (log.logType !== "work") return;
      if (log.isRunning) {
        const runningSec = Math.floor(
          (Date.now() - new Date(log.startTime).getTime()) / 1000
        );
        totalSeconds += Math.max(0, runningSec);
      } else {
        totalSeconds += (log.durationSeconds || 0);
      }
    });
    const hoursWorkedToday = +(totalSeconds / 3600).toFixed(2);
    res.json({
      activeTaskId: activeLog?.task?._id || null,
      status: activeLog ? activeLog.logType : "idle",
      totalSecondsWorkedToday: totalSeconds,
      hoursWorkedToday, 
      logs
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.stopAllLiveSessions = async (req, res) => {
  try {
    const now = new Date();
    const activeLogs = await TimeLog.find({ isRunning: true });

    const updatePromises = activeLogs.map(async (log) => {
      const rawSeconds = Math.max(0, Math.floor((now - new Date(log.startTime)) / 1000));

      if (log.logType === "work") {
        const { adjustedSeconds } = await applyProficiency(log.user, rawSeconds);
        log.rawDurationSeconds = rawSeconds;
        log.durationSeconds = adjustedSeconds;
      } else {
        log.durationSeconds = rawSeconds;
      }

      log.endTime = now;
      log.isRunning = false;

      return log.save();
    });

    await Promise.all(updatePromises);

    emitEvent(req, "timeLogChanged");
    activeLogs.forEach(log => {
      emitEvent(req, "timeLogChanged", null, log.user);
    });
    emitEvent(req, "taskChanged");
    emitDashboardUpdate(req);
    res.json({
      message: `Global shutdown complete. ${activeLogs.length} sessions recorded.`,
      stoppedCount: activeLogs.length
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.clearLogs = async (req, res) => {
  try {
    const { date } = req.body;

    if (!date) {
      return res.status(400).json({ error: "Date is required." });
    }

    const result = await TimeLog.updateMany(
      {
        dateString: date,
        isRunning: false,
        clearedByAdmin: { $ne: true }
      },
      { $set: { clearedByAdmin: true } }
    );

    emitEvent(req, "timeLogChanged", { date });
    emitDashboardUpdate(req);
    res.json({
      message: `Logs for ${date} cleared.`,
      clearedCount: result.modifiedCount
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
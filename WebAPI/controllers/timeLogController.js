const TimeLog = require("../models/TimeLog");
const Task = require("../models/Task");
const Employee = require("../models/Employee");
const Project = require("../models/Project");
const mongoose = require("mongoose");

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

    // 1. Daily Limit Check
    const logs = await TimeLog.find({ user: userId, dateString: today, logType: "work" });
    const hoursToday = logs.reduce((sum, l) => sum + (l.durationSeconds / 3600 || 0), 0);
    if (hoursToday >= employee.dailyWorkLimit) {
      throw new Error(`Daily limit reached (${employee.dailyWorkLimit} hrs).`);
    }

    // 2. Stop existing timers (Auto-switch)
    const activeLog = await TimeLog.findOne({ user: userId, isRunning: true });
    if (activeLog) {
      const now = new Date();
      activeLog.endTime = now;
      activeLog.isRunning = false;
      activeLog.durationSeconds = Math.max(0, Math.floor((now - new Date(activeLog.startTime)) / 1000));
      // We don't mark auto-switches as "Stop" to keep the log clean
      await activeLog.save({ session });
    }

    // 3. Create Start Log
    const log = await TimeLog.create([{
      user: userId,
      task: taskId,
      startTime: new Date(),
      isRunning: true,
      logType: "work",
      action: "Start", // <--- Key for Admin Log
      dateString: today
    }], { session });

    if (task.liveStatus === "To be started") {
      task.liveStatus = "In progress";
      await task.save({ session });
    }

    await session.commitTransaction();
    res.status(201).json(log[0]);
  } catch (err) {
    await session.abortTransaction();
    console.error(err)
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
    active.endTime = now;
    active.isRunning = false;
    active.durationSeconds = Math.max(0, Math.floor((now - new Date(active.startTime)) / 1000));
    // Notice: We do NOT set an action here so it stays out of the Admin Activity Feed
    await active.save();

    const newType = active.logType === "work" ? "break" : "work";
    const newLog = await TimeLog.create({
      user: userId,
      task: active.task,
      startTime: new Date(),
      logType: newType,
      isRunning: true,
      dateString: active.dateString
      // action is undefined here intentionally
    });

    res.json({ status: newType, log: newLog });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.stopTimer = async (req, res) => {
  try {
    const log = await TimeLog.findOne({ user: req.user._id, isRunning: true });
    if (!log) return res.status(400).json({ message: "No active timer found." });

    const now = new Date();
    log.endTime = now;
    log.isRunning = false;
    log.durationSeconds = Math.max(0, Math.floor((now - new Date(log.startTime)) / 1000));
    log.action = "Stop"; // <--- Key for Admin Log
    await log.save();

    res.json({ message: "Session Terminated", log });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ... (Keep other methods as they were)

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

    const totalSeconds = logs
      .filter(l => l.logType === "work")
      .reduce((sum, l) => sum + (l.durationSeconds || 0), 0);

    const hoursWorkedToday = +(totalSeconds / 3600).toFixed(2);

    res.json({
      activeTaskId: activeLog?.task?._id || null,
      status: activeLog ? activeLog.logType : "idle",
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

    const updatePromises = activeLogs.map(log => {
      const duration = Math.floor((now - new Date(log.startTime)) / 1000);
      log.endTime = now;
      log.isRunning = false;
      log.durationSeconds = Math.max(0, duration);
      return log.save();
    });

    await Promise.all(updatePromises);

    res.json({
      message: `Global shutdown complete. ${activeLogs.length} sessions recorded.`,
      stoppedCount: activeLogs.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.clearAllLogs = async (req, res) => {
  try {
    // Admin operation to mark logs as "archived" from the dashboard view
    await TimeLog.updateMany(
      { isRunning: false, clearedByAdmin: { $ne: true } },
      { $set: { clearedByAdmin: true } }
    );
    res.json({ message: "Admin dashboard logs cleared." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
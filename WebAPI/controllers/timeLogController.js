const TimeLog = require("../models/TimeLog");
const Task = require("../models/Task");
const Employee = require("../models/Employee");
const Project = require("../models/Project");
const mongoose = require("mongoose");
const { applyProficiency } = require("../utils/userHelpers");

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
    // Replace the activeLog block in startTimer:
    if (activeLog) {
      const now = new Date();
      const rawSeconds = Math.max(0, Math.floor((now - new Date(activeLog.startTime)) / 1000));

      // ✅ Apply proficiency for work logs on auto-switch
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

    if (task.liveStatus === "To be started" || task.liveStatus === "Started") {
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
    const rawSeconds = Math.max(0, Math.floor((now - new Date(active.startTime)) / 1000));

    if (active.logType === "work") {
      const { adjustedSeconds } = await applyProficiency(userId, rawSeconds);
      active.rawDurationSeconds = rawSeconds;
      active.durationSeconds = adjustedSeconds;
    } else {
      active.durationSeconds = rawSeconds; // breaks are recorded as-is
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

    res.json({ status: newType, log: newLog });
  } catch (err) { res.status(500).json({ error: err.message }); }
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
    log.rawDurationSeconds = rawSeconds;       // actual clock time
    log.durationSeconds = adjustedSeconds;     // proficiency-adjusted
    log.action = "Stop";

    await log.save();
    res.json({ message: "Session Terminated", log });
  } catch (err) { res.status(500).json({ error: err.message }); }
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

    const updatePromises = activeLogs.map(async (log) => {
      const rawSeconds = Math.max(0, Math.floor((now - new Date(log.startTime)) / 1000));

      // ✅ Apply proficiency for work logs
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
    res.json({
      message: `Global shutdown complete. ${activeLogs.length} sessions recorded.`,
      stoppedCount: activeLogs.length
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.clearLogs = async (req, res) => {
  try {
    const { date } = req.body; // e.g., "2024-03-29"

    if (!date) {
      return res.status(400).json({ error: "Date is required to clear specific logs." });
    }

    // Update only logs that match the specific date string
    // and are not currently running.
    const result = await TimeLog.updateMany(
      {
        dateString: date,
        isRunning: false,
        clearedByAdmin: { $ne: true }
      },
      { $set: { clearedByAdmin: true } }
    );

    res.json({
      message: `Logs for ${date} have been cleared.`,
      clearedCount: result.modifiedCount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
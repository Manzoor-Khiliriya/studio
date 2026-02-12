const TimeLog = require("../models/TimeLog");
const Task = require("../models/Task");
const Employee = require("../models/Employee");
const mongoose = require("mongoose");

exports.startTimer = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // FIX 1: Robust taskId extraction
    const { taskId } = req.body;
    const userId = req.user._id;

    if (!taskId) throw new Error("Task ID is required.");

    // FIX 2: Find Employee profile (Tasks are assigned to Employee IDs, not User IDs)
    const employee = await Employee.findOne({ user: userId });
    if (!employee) throw new Error("Employee profile not found for this user.");

    // FIX 3: Check task assignment using employee._id
    const task = await Task.findOne({
      _id: taskId,
      assignedTo: employee._id
    });

    if (!task) throw new Error("Task not found or not assigned to your employee profile.");

    const today = new Date().toISOString().split("T")[0];

    // Check daily hour limit
    const logs = await TimeLog.find({ user: userId, dateString: today, logType: "work" });
    const hoursToday = logs.reduce((sum, l) => sum + (l.durationSeconds / 3600 || 0), 0);

    if (hoursToday >= employee.dailyWorkLimit) {
      throw new Error(`Daily limit reached (${employee.dailyWorkLimit} hrs).`);
    }

    // Stop any running logs for this user
    await TimeLog.updateMany(
      { user: userId, isRunning: true },
      { $set: { endTime: new Date(), isRunning: false } },
      { session }
    );


    // FIX: Explicitly pass dateString here
    const log = await TimeLog.create([{
      user: userId,
      task: taskId,
      startTime: new Date(),
      isRunning: true,
      logType: "work",
      dateString: today // <--- ADD THIS LINE
    }], { session });

    // Auto update task status
    if (task.status === "Pending") {
      task.status = "In Progress";
      await task.save({ session });
    }

    await session.commitTransaction();
    res.status(201).json(log[0]);

  } catch (err) {
    await session.abortTransaction();
    // Catch the "Cast to ObjectId" error specifically if it slips through
    const message = err.name === "CastError" ? "Invalid Task ID format" : err.message;
    res.status(400).json({ error: message });
  } finally {
    session.endSession();
  }
};

exports.togglePause = async (req, res) => {
  const userId = req.user._id;
  const today = new Date().toISOString().split("T")[0];

  const active = await TimeLog.findOne({ user: userId, isRunning: true });
  if (!active) return res.status(404).json({ message: "No active timer." });

  // 🔹 FIX: Calculate duration before closing the log
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - new Date(active.startTime).getTime()) / 1000);
  
  active.endTime = now;
  active.isRunning = false;
  active.durationSeconds = Math.max(0, diffInSeconds); // Store the time spent
  await active.save();

  // Create the new log (switching work -> break or break -> work)
  const newType = active.logType === "work" ? "break" : "work";

  const newLog = await TimeLog.create({
    user: userId,
    task: active.task,
    startTime: new Date(),
    logType: newType,
    isRunning: true,
    dateString: today 
  });

  res.json({ status: newType, log: newLog });
};

exports.stopTimer = async (req, res) => {
  const log = await TimeLog.findOne({ user: req.user._id, isRunning: true });
  if (!log) return res.status(400).json({ message: "No active timer." });

  log.endTime = new Date();
  log.isRunning = false;
  await log.save();

  res.json({ message: "Stopped", log });
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

    // 🔹 Calculate today's worked hours (only work logs)
    const totalSeconds = logs
      .filter(l => l.logType === "work")
      .reduce((sum, l) => sum + (l.durationSeconds || 0), 0);

    const hoursWorkedToday = +(totalSeconds / 3600).toFixed(2);

    res.json({
      activeTaskId: activeLog?.task?._id || null,
      status: activeLog ? activeLog.logType : "idle", // work | break | idle
      hoursWorkedToday,
      logs
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.getTaskPerformanceReport = async (req, res) => {
  const report = await Task.aggregate([
    { $lookup: { from: "timelogs", localField: "_id", foreignField: "task", as: "logs" } },
    {
      $project: {
        title: 1,
        projectNumber: 1,
        allocatedTime: 1,
        status: 1,
        totalWorkHours: {
          $round: [{
            $divide: [
              {
                $sum: {
                  $map: {
                    input: { $filter: { input: "$logs", as: "l", cond: { $eq: ["$$l.logType", "work"] } } },
                    as: "item",
                    in: "$$item.durationSeconds"
                  }
                }
              },
              3600
            ]
          }, 2]
        }
      }
    }
  ]);

  res.json(report);
};


exports.employeeWeeklyReport = async (req, res) => {
  try {
    const targetUserId = req.params.userId || req.user._id;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const stats = await TimeLog.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(targetUserId),
          logType: "work",
          startTime: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: "$dateString",
          totalSeconds: { $sum: "$durationSeconds" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const result = stats.map(day => ({
      date: day._id,
      hoursWorked: +(day.totalSeconds / 3600).toFixed(2),
      minutesWorked: Math.round(day.totalSeconds / 60)
    }));

    res.json({
      userId: targetUserId,
      totalDays: result.length,
      report: result
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add these to your timeLogController.js

// 1. Permanent Delete for Operational History
exports.clearAllLogs = async (req, res) => {
  try {
    // We "soft delete" by setting the flag to true
    // Only clear logs that are NOT currently running
    await TimeLog.updateMany(
      { isRunning: false, clearedByAdmin: false },
      { $set: { clearedByAdmin: true } }
    );

    res.json({ message: "Admin operational log cleared (records preserved)." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 2. Global Stop for Live Sessions
exports.stopAllLiveSessions = async (req, res) => {
  try {
    const now = new Date();
    
    // 1. We need to find the logs first to calculate their durations
    const activeLogs = await TimeLog.find({ isRunning: true });

    const updatePromises = activeLogs.map(log => {
      // Calculate duration in seconds: (End - Start) / 1000
      const duration = Math.floor((now - new Date(log.startTime)) / 1000);
      
      log.endTime = now;
      log.isRunning = false;
      log.durationSeconds = duration; // <--- THIS PREVENTS THE ZERO PROBLEM
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
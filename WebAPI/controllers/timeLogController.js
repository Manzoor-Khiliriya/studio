const TimeLog = require("../models/TimeLog");
const Task = require("../models/Task");
const Employee = require("../models/Employee");
const mongoose = require("mongoose");

exports.startTimer = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { taskId } = req.body;
    const userId = req.user._id;

    if (!taskId) throw new Error("Task ID is required.");

    const employee = await Employee.findOne({ user: userId });
    if (!employee) throw new Error("Employee profile not found for this user.");

    const task = await Task.findOne({
      _id: taskId,
      assignedTo: employee._id
    });

    if (!task) throw new Error("Task not found or not assigned to your employee profile.");

    const today = new Date().toISOString().split("T")[0];

    const logs = await TimeLog.find({ user: userId, dateString: today, logType: "work" });
    const hoursToday = logs.reduce((sum, l) => sum + (l.durationSeconds / 3600 || 0), 0);

    if (hoursToday >= employee.dailyWorkLimit) {
      throw new Error(`Daily limit reached (${employee.dailyWorkLimit} hrs).`);
    }

    await TimeLog.updateMany(
      { user: userId, isRunning: true },
      { $set: { endTime: new Date(), isRunning: false } },
      { session }
    );


    const log = await TimeLog.create([{
      user: userId,
      task: taskId,
      startTime: new Date(),
      isRunning: true,
      logType: "work",
      dateString: today
    }], { session });

    if (task.status === "Pending") {
      task.status = "In Progress";
      await task.save({ session });
    }

    await session.commitTransaction();
    res.status(201).json(log[0]);

  } catch (err) {
    await session.abortTransaction();
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

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - new Date(active.startTime).getTime()) / 1000);

  active.endTime = now;
  active.isRunning = false;
  active.durationSeconds = Math.max(0, diffInSeconds);
  await active.save();

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


exports.getTaskPerformanceReport = async (req, res) => {
  try {
    const report = await Task.aggregate([
      {
        $match: {
          status: { $ne: "Completed" }
        }
      },
      {
        $lookup: {
          from: "timelogs",
          localField: "_id",
          foreignField: "task",
          as: "logs"
        }
      },
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
                      input: {
                        $filter: {
                          input: "$logs",
                          as: "l",
                          cond: { $eq: ["$$l.logType", "work"] }
                        }
                      },
                      as: "item",
                      in: { $ifNull: ["$$item.durationSeconds", 0] }
                    }
                  }
                },
                3600
              ]
            }, 2]
          }
        }
      },
      {
        $addFields: {
          completionPercentage: {
            $cond: [
              { $gt: ["$allocatedTime", 0] },
              { $round: [{ $multiply: [{ $divide: ["$totalWorkHours", "$allocatedTime"] }, 100] }, 1] },
              0
            ]
          }
        }
      },
      { $sort: { completionPercentage: -1 } }
    ]);

    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.clearAllLogs = async (req, res) => {
  try {
    await TimeLog.updateMany(
      { isRunning: false, clearedByAdmin: false },
      { $set: { clearedByAdmin: true } }
    );

    res.json({ message: "Admin operational log cleared (records preserved)." });
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
      log.durationSeconds = duration;
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
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

    // 1. Check Daily Limit
    const logs = await TimeLog.find({ user: userId, dateString: today, logType: "work" });
    const hoursToday = logs.reduce((sum, l) => sum + (l.durationSeconds / 3600 || 0), 0);

    if (hoursToday >= employee.dailyWorkLimit) {
      throw new Error(`Daily limit reached (${employee.dailyWorkLimit} hrs). Please contact admin.`);
    }

    // 2. Stop any existing running timers (Auto-switch)
    const activeLog = await TimeLog.findOne({ user: userId, isRunning: true });
    if (activeLog) {
        const now = new Date();
        const duration = Math.floor((now.getTime() - new Date(activeLog.startTime).getTime()) / 1000);
        activeLog.endTime = now;
        activeLog.isRunning = false;
        activeLog.durationSeconds = Math.max(0, duration);
        await activeLog.save({ session });
    }

    // 3. Create new Work Log
    const log = await TimeLog.create([{
      user: userId,
      task: taskId,
      startTime: new Date(),
      isRunning: true,
      logType: "work",
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
    const message = err.name === "CastError" ? "Invalid Task ID format" : err.message;
    res.status(400).json({ error: message });
  } finally {
    session.endSession();
  }
};

exports.togglePause = async (req, res) => {
  try {
    const userId = req.user._id;
    const today = new Date().toISOString().split("T")[0];

    const active = await TimeLog.findOne({ user: userId, isRunning: true });
    if (!active) return res.status(404).json({ message: "No active timer found." });

    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - new Date(active.startTime).getTime()) / 1000);

    // Close Current Log
    active.endTime = now;
    active.isRunning = false;
    active.durationSeconds = Math.max(0, diffInSeconds);
    await active.save();

    // Switch types: if was "work" -> "break", if was "break" -> "work"
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
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.stopTimer = async (req, res) => {
  try {
    const log = await TimeLog.findOne({ user: req.user._id, isRunning: true });
    if (!log) return res.status(400).json({ message: "No active timer found." });

    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - new Date(log.startTime).getTime()) / 1000);

    log.endTime = now;
    log.isRunning = false;
    log.durationSeconds = Math.max(0, diffInSeconds);
    await log.save();

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
      // 1. Filter out completed tasks to focus on active work
      { $match: { status: { $ne: "Completed" } } },

      // 2. Join with Project collection to get the projectNumber
      {
        $lookup: {
          from: "projects", // collection name in MongoDB
          localField: "project",
          foreignField: "_id",
          as: "projectData"
        }
      },
      { $unwind: "$projectData" },

      // 3. Join with TimeLog collection to get durations
      {
        $lookup: {
          from: "timelogs", // collection name in MongoDB
          localField: "_id",
          foreignField: "task",
          as: "logs"
        }
      },

      // 4. Calculate totalWorkHours (converting seconds to hours)
      {
        $project: {
          title: 1,
          allocatedTime: 1,
          status: 1,
          // Extract projectNumber from the joined projectData
          projectNumber: "$projectData.projectNumber",
          totalWorkHours: {
            $round: [
              {
                $divide: [
                  {
                    $reduce: {
                      input: "$logs",
                      initialValue: 0,
                      in: {
                        $cond: [
                          { $eq: ["$$this.logType", "work"] },
                          { $add: ["$$value", { $ifNull: ["$$this.durationSeconds", 0] }] },
                          "$$value"
                        ]
                      }
                    }
                  },
                  3600
                ]
              },
              2
            ]
          }
        }
      },

      // 5. Calculate percentage with safety check for 0 allocatedTime
      {
        $addFields: {
          completionPercentage: {
            $cond: {
              if: { $gt: ["$allocatedTime", 0] },
              then: { $round: [{ $multiply: [{ $divide: ["$totalWorkHours", "$allocatedTime"] }, 100] }, 1] },
              else: 0
            }
          }
        }
      },

      // 6. Sort by highest usage first (highest risk)
      { $sort: { completionPercentage: -1 } }
    ]);

    res.json(report);
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
const TimeLog = require("../models/TimeLog");
const Task = require("../models/Task");
const Employee = require("../models/Employee");
const mongoose = require("mongoose");

/* =========================================================
   START TIMER
   ========================================================= */
exports.startTimer = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { taskId } = req.body;
    const userId = req.user._id;

    const task = await Task.findOne({ _id: taskId, assignedTo: userId });
    if (!task) throw new Error("Task not found or not assigned.");

    const today = new Date().toISOString().split("T")[0];
    const employee = await Employee.findOne({ user: userId });

    // 🔹 Check daily hour limit
    if (employee) {
      const logs = await TimeLog.find({ user: userId, dateString: today, logType: "work" });
      const hoursToday = logs.reduce((a, l) => a + (l.durationSeconds / 3600 || 0), 0);

      if (hoursToday >= employee.dailyWorkLimit) {
        throw new Error(`Daily limit reached (${employee.dailyWorkLimit} hrs).`);
      }
    }

    // 🔹 Stop any running logs
    await TimeLog.updateMany(
      { user: userId, isRunning: true },
      { $set: { endTime: new Date(), isRunning: false } },
      { session }
    );

    // 🔹 Start new log
    const log = await TimeLog.create([{
      user: userId,
      task: taskId,
      startTime: new Date(),
      isRunning: true,
      logType: "work"
    }], { session });

    // Auto move task status
    if (task.status === "Pending") {
      task.status = "In Progress";
      await task.save({ session });
    }

    await session.commitTransaction();
    res.status(201).json(log[0]);

  } catch (err) {
    await session.abortTransaction();
    res.status(400).json({ error: err.message });
  } finally {
    session.endSession();
  }
};


exports.togglePause = async (req, res) => {
  const userId = req.user._id;

  const active = await TimeLog.findOne({ user: userId, isRunning: true });
  if (!active) return res.status(404).json({ message: "No active timer." });

  active.endTime = new Date();
  active.isRunning = false;
  await active.save();

  const newType = active.logType === "work" ? "break" : "work";

  const newLog = await TimeLog.create({
    user: userId,
    task: active.task,
    startTime: new Date(),
    logType: newType,
    isRunning: true
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
    { $lookup: { from: "timelogs", localField: "_id", foreignField: "task", as: "logs" }},
    {
      $project: {
        title: 1,
        projectNumber: 1,
        allocatedTime: 1,
        status: 1,
        totalWorkHours: {
          $round: [{
            $divide: [
              { $sum: { $map: {
                input: { $filter: { input: "$logs", as: "l", cond: { $eq: ["$$l.logType", "work"] }}},
                as: "item",
                in: "$$item.durationSeconds"
              }}},
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

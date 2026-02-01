const TimeLog = require("../models/TimeLog");
const Task = require("../models/Task");
const { isActiveAdmin } = require("../utils/userHelpers");

/**
 * 👨‍💻 START TIMER
 */
exports.startTimer = async (req, res) => {
  try {
    const { taskId } = req.body;
    
    // 1. Stop any current running logs for this user
    const activeLogs = await TimeLog.find({ user: req.user.id, isRunning: true });
    for (const oldLog of activeLogs) {
      oldLog.endTime = new Date();
      oldLog.isRunning = false;
      await oldLog.save(); // Triggers the duration calculation in model
    }

    // 2. Create the new work log
    const log = await TimeLog.create({
      user: req.user.id,
      task: taskId,
      startTime: new Date(),
      isRunning: true,
      logType: "work"
    });

    // 3. Mark the task as In Progress
    await Task.findByIdAndUpdate(taskId, { status: "In Progress" });

    res.status(201).json(log);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * 🔄 TOGGLE PAUSE
 */
exports.togglePause = async (req, res) => {
  try {
    const log = await TimeLog.findOne({ user: req.user.id, isRunning: true });
    if (!log) return res.status(404).json({ message: "No active timer" });

    const now = new Date();

    if (log.logType === "work") {
      // --- STARTING A BREAK ---
      // 1. Calculate how many seconds were worked in this specific session
      const sessionSeconds = Math.floor((now - new Date(log.startTime)) / 1000);
      
      // 2. Add those seconds to the permanent duration storage
      log.durationSeconds = (log.durationSeconds || 0) + sessionSeconds;
      
      // 3. Switch to break mode
      log.logType = "break";
    } else {
      // --- RETURNING TO WORK ---
      // 1. Reset startTime to NOW. This "deletes" the break time from the math.
      log.startTime = now;
      log.logType = "work";
    }

    await log.save();
    res.json(log);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * ⏹️ STOP TIMER
 */
exports.stopTimer = async (req, res) => {
  try {
    const log = await TimeLog.findOne({ user: req.user.id, isRunning: true });
    if (!log) return res.status(400).json({ message: "No active timer found" });

    log.endTime = new Date();
    log.isRunning = false;
    await log.save(); 

    // Update the task's total consumed minutes (only for work logs)
    if (log.logType === "work") {
      const minutesEarned = Math.round(log.durationSeconds / 60);
      await Task.updateOne(
        { _id: log.task, "assignedTo.employee": req.user.id },
        { $inc: { "assignedTo.$.totalMinutesConsumed": minutesEarned } }
      );
    }

    res.json(log);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * 🧑‍💼 ADMIN — PERFORMANCE REPORT
 */
exports.getTaskPerformanceReport = async (req, res) => {
  try {
    // Calling your updated boolean helper
    if (!isActiveAdmin(req.user)) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const report = await Task.aggregate([
      {
        $lookup: {
          from: "timelogs",
          localField: "_id",
          foreignField: "task",
          as: "workLogs"
        }
      },
      {
        $project: {
          title: 1,
          projectNumber: 1,
          estimatedTime: 1,
          status: 1,
          actualMinutesConsumed: { 
            $divide: [{ 
              $sum: {
                $map: {
                  input: { $filter: { input: "$workLogs", as: "l", cond: { $eq: ["$$l.logType", "work"] } } },
                  as: "log",
                  in: { $ifNull: ["$$log.durationSeconds", 0] }
                }
              }
            }, 60] 
          }
        }
      }
    ]);

    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * 👨‍💻 GET MY LOGS (For Employee Dashboard Today's Shift)
 */
exports.getMyLogs = async (req, res) => {
  try {
    // 1. Fetch logs from last 24 hours to handle timezone shifts
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const logs = await TimeLog.find({ 
      user: req.user.id,
      startTime: { $gte: twentyFourHoursAgo }
    })
      .populate("task", "title projectNumber")
      .sort({ startTime: -1 });

    const activeLog = logs.find(log => log.isRunning === true);

    res.json({
      isCurrentlyWorking: activeLog?.logType === "work",
      isCurrentlyOnBreak: activeLog?.logType === "break",
      activeTaskId: activeLog?.task?._id || null,
      logs: logs
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * 👨‍💻 EMPLOYEE — WEEKLY STATS
 * Aggregates work time for the last 7 days
 */
exports.employeeWeeklyReport = async (req, res) => {
  try {
    const targetUserId = req.params.id || req.user.id;
    
    // Authorization: Only allow the Admin or the User themselves to see this
    if (!isActiveAdmin(req.user) && req.user.id !== targetUserId) {
      return res.status(403).json({ message: "Unauthorized access to report" });
    }

    // 1. Get logs for the last 7 days (Only "work" type)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const logs = await TimeLog.find({ 
      user: targetUserId, 
      logType: "work",
      startTime: { $gte: sevenDaysAgo }
    });

    // 2. Group by dateString
    const grouped = {};
    logs.forEach(l => {
      const date = l.dateString; // YYYY-MM-DD
      if (!grouped[date]) grouped[date] = 0;
      grouped[date] += (l.durationSeconds || 0);
    });

    // 3. Format for the frontend chart/list
    const result = Object.entries(grouped).map(([date, totalSec]) => {
      const mins = Math.round(totalSec / 60);
      return {
        date,
        minutes: mins,
        hours: (mins / 60).toFixed(2),
        label: new Date(date).toLocaleDateString('en-US', { weekday: 'short' })
      };
    }).sort((a, b) => a.date.localeCompare(b.date)); // Sort by date ascending

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
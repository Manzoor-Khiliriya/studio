const TimeLog = require("../models/TimeLog");

/**
 * 🏆 ADMIN: Employee Performance Leaderboard
 * Calculates: (Estimated Time / Actual Time) * 100
 */
exports.getPerformanceLeaderboard = async (req, res) => {
  try {
    const report = await TimeLog.aggregate([
      // 1. Only look at "work" logs that are finished (have a duration)
      { $match: { duration: { $gt: 0 } } },

      // 2. Join with Task to get the estimatedTime
      {
        $lookup: {
          from: "tasks",
          localField: "task",
          foreignField: "_id",
          as: "taskDetails"
        }
      },
      { $unwind: "$taskDetails" },

      // 3. Group by User
      {
        $group: {
          _id: "$user",
          totalActualMinutes: { $sum: "$duration" },
          totalEstimatedMinutes: { $sum: "$taskDetails.estimatedTime" },
          taskCount: { $sum: 1 }
        }
      },

      // 4. Join with User to get names
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      { $unwind: "$userDetails" },

      // 5. Calculate Efficiency Percentage
      {
        $project: {
          _id: 0,
          employeeName: "$userDetails.name",
          designation: "$userDetails.designation",
          tasksCompleted: "$taskCount",
          totalActualMinutes: 1,
          efficiencyScore: {
            $multiply: [
              { $divide: ["$totalEstimatedMinutes", "$totalActualMinutes"] },
              100
            ]
          }
        }
      },

      // 6. Sort by highest efficiency
      { $sort: { efficiencyScore: -1 } }
    ]);

    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * 📊 ADMIN: Daily Capacity Tracker
 * Compares "Total Minutes Worked" vs "User's dailyWorkLimit"
 */
exports.getDailyUtilization = async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const stats = await TimeLog.aggregate([
      { $match: { date: today } },
      {
        $group: {
          _id: "$user",
          minutesWorked: { $sum: "$duration" }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },
      {
        $project: {
          name: "$user.name",
          worked: "$minutesWorked",
          limit: "$user.dailyWorkLimit",
          utilizationPercentage: {
            $multiply: [{ $divide: ["$minutesWorked", "$user.dailyWorkLimit"] }, 100]
          }
        }
      }
    ]);

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAdminSummary = async (req, res) => {
  try {
    const totalEmployees = await User.countDocuments({ role: "employee" });
    const activeTimers = await TimeLog.countDocuments({ isRunning: true });
    const totalTasks = await Task.countDocuments();
    const pendingTasks = await Task.countDocuments({ status: "Pending" });

    // Calculate total hours worked today
    const today = new Date().toISOString().split("T")[0];
    const todayLogs = await TimeLog.find({ date: today });
    const totalMinutesToday = todayLogs.reduce((acc, log) => acc + (log.duration || 0), 0);

    res.json({
      totalEmployees,
      activeTimers,
      totalTasks,
      pendingTasks,
      hoursWorkedToday: (totalMinutesToday / 60).toFixed(1)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
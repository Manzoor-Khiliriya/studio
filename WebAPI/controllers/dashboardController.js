const Task = require("../models/Task");
const TimeLog = require("../models/TimeLog");
const Leave = require("../models/Leave");
const { isActiveAdmin } = require("../utils/userHelpers");

exports.getSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    if (isActiveAdmin(req.user)) {
      /* =============================================================
          ADMIN DASHBOARD: GLOBAL FLEET OVERVIEW
         ============================================================= */
      const [totalTasks, activeTimers, pendingLeaves, recentActivity, taskStats] = await Promise.all([
        Task.countDocuments(),
        TimeLog.find({ isRunning: true })
          .populate("user", "name photo")
          .populate("task", "title projectNumber"),
        Leave.countDocuments({ status: "Pending" }),
        TimeLog.find()
          .sort({ createdAt: -1 })
          .limit(8)
          .populate("user", "name")
          .populate("task", "title"),
        // Aggregation for Status breakdown
        Task.aggregate([
          { $group: { _id: "$status", count: { $sum: 1 } } }
        ])
      ]);

      return res.json({
        role: "Admin",
        stats: {
          totalProjects: totalTasks,
          currentlyWorking: activeTimers.length,
          pendingApprovals: pendingLeaves,
          statusBreakdown: taskStats.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
          }, {})
        },
        liveTracking: activeTimers.map(t => ({
          id: t._id,
          employee: t.user?.name,
          photo: t.user?.photo,
          task: t.task?.title,
          projectCode: t.task?.projectNumber,
          since: t.startTime,
          logType: t.logType
        })),
        recentActivity: recentActivity.map(log => ({
          id: log._id,
          userName: log.user?.name,
          taskTitle: log.task?.title,
          duration: (log.durationSeconds / 3600).toFixed(2), // Convert to hours
          type: log.logType,
          createdAt: log.createdAt
        }))
      });

    } else {
      /* =============================================================
          EMPLOYEE DASHBOARD: PERSONAL MISSION HUB
         ============================================================= */
      
      // Calculate start of current week (Monday 00:00:00)
      const now = new Date();
      const startOfWeek = new Date(now.setDate(now.getDate() - (now.getDay() || 7) + 1));
      startOfWeek.setHours(0, 0, 0, 0);

      const [assignedTasks, weeklyLogs, myLeaves, runningTimer] = await Promise.all([
        // Fetch only incomplete tasks assigned to them
        Task.find({ 
          "assignedTo.employee": userId, 
          status: { $in: ["Pending", "In Progress"] } 
        }).sort({ priority: -1, endDate: 1 }),
        
        // Logs for the current week
        TimeLog.find({ 
          user: userId, 
          startTime: { $gte: startOfWeek } 
        }),
        
        Leave.find({ user: userId }).sort({ startDate: -1 }).limit(5),
        
        TimeLog.findOne({ user: userId, isRunning: true })
          .populate("task", "title projectNumber")
      ]);

      // Sum up duration across all weekly logs
      const totalWeeklySeconds = weeklyLogs.reduce((acc, log) => acc + (log.durationSeconds || 0), 0);

      return res.json({
        role: "Employee",
        activeTimer: runningTimer ? {
          logId: runningTimer._id,
          task: runningTimer.task?.title,
          projectCode: runningTimer.task?.projectNumber,
          startedAt: runningTimer.startTime,
          type: runningTimer.logType
        } : null,
        stats: {
          activeTasks: assignedTasks.length,
          weeklyHours: (totalWeeklySeconds / 3600).toFixed(1),
          // You can expand the user model later to include actual leave balance
          leaveAllowance: 20 
        },
        taskSnapshot: assignedTasks.map(t => ({
          id: t._id,
          title: t.title,
          projectNumber: t.projectNumber,
          deadline: t.endDate,
          priority: t.priority,
          status: t.status
        })),
        upcomingLeaves: myLeaves.map(l => ({
          id: l._id,
          type: l.type,
          status: l.status,
          startDate: l.startDate,
          endDate: l.endDate
        }))
      });
    }
  } catch (err) {
    console.error("Dashboard Error:", err);
    res.status(500).json({ error: "Mission Control sync failed." });
  }
};
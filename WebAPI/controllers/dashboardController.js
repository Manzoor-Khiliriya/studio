const Task = require("../models/Task");
const TimeLog = require("../models/TimeLog");
const Leave = require("../models/Leave");
const Employee = require("../models/Employee");
const { isActiveAdmin } = require("../utils/userHelpers");

exports.getSummary = async (req, res) => {
  try {
    const userId = req.user._id;

    /* =============================================================
        ADMIN DASHBOARD
       ============================================================= */
    if (isActiveAdmin(req.user)) {
      const [totalTasks, activeTimers, pendingLeaves, recentActivity, taskStats, liveStats] = await Promise.all([
        Task.countDocuments(),

        TimeLog.find({ isRunning: true, logType: "work" })
          .populate({ path: "user", select: "name", populate: { path: "employee", select: "photo" } })
          .populate("task", "title projectNumber")
          .lean(),

        Leave.countDocuments({ status: "Pending" }),

        TimeLog.find({ logType: "work", clearedByAdmin: false }) 
          .sort({ createdAt: -1 })
          .limit(50) 
          .populate("user", "name")
          .populate("task", "title projectNumber")
          .lean(),

        Task.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
        Task.aggregate([{ $group: { _id: "$liveStatus", count: { $sum: 1 } } }])
      ]);

      return res.json({
        role: "Admin",
        stats: {
          totalProjects: totalTasks,
          currentlyWorking: activeTimers.length,
          pendingApprovals: pendingLeaves,
          statusBreakdown: {
            ...taskStats.reduce((a, c) => ({ ...a, [c._id]: c.count }), {}),
            ...liveStats.reduce((a, c) => ({ ...a, [c._id]: c.count }), {})
          }
        },
        liveTracking: activeTimers.map(t => ({
          id: t._id,
          employee: t.user?.name,
          task: t.task?.title,
          projectCode: t.task?.projectNumber,
          since: t.startTime,
          logType: t.logType
        })),
        recentActivity: recentActivity.map(log => ({
          id: log._id,
          userName: log.user?.name,
          taskTitle: log.task?.title,
          projectCode: log.task?.projectNumber,
          createdAt: log.createdAt
        }))
      });
    }

    /* =============================================================
        EMPLOYEE DASHBOARD
       ============================================================= */
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - ((today.getDay() || 7) - 1));
    startOfWeek.setHours(0, 0, 0, 0);

    const employeeProfile = await Employee.findOne({ user: userId }).lean();

    const [assignedTasks, weeklyLogs, myLeaves, runningTimer] = await Promise.all([
      Task.find({ assignedTo: userId, liveStatus: { $in: ["In progress"] } })
        .sort({ priority: -1, endDate: 1 })
        .lean(),

      TimeLog.find({ user: userId, startTime: { $gte: startOfWeek }, logType: "work" }),

      Leave.find({ user: userId }).sort({ startDate: -1 }).limit(5).lean(),

      TimeLog.findOne({ user: userId, isRunning: true })
        .populate("task", "title projectNumber")
        .lean()
    ]);

    const totalWeeklySeconds = weeklyLogs.reduce((a, l) => a + (l.durationSeconds || 0), 0);

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
        weeklyHours: +(totalWeeklySeconds / 3600).toFixed(1),
        dailyLimit: employeeProfile?.dailyWorkLimit || 0,
        efficiency: employeeProfile?.efficiency || 100
      },
      taskSnapshot: assignedTasks.map(t => ({
        id: t._id,
        title: t.title,
        projectNumber: t.projectNumber,
        deadline: t.endDate,
        priority: t.priority,
        status: t.liveStatus
      })),
      upcomingLeaves: myLeaves.map(l => ({
        id: l._id,
        type: l.type,
        status: l.status,
        startDate: l.startDate,
        endDate: l.endDate
      }))
    });

  } catch (err) {
    res.status(500).json({ error: "Mission Control sync failed." });
  }
};
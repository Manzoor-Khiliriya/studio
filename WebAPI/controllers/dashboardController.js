const Task = require("../models/Task");
const TimeLog = require("../models/TimeLog");
const Leave = require("../models/Leave");
const Employee = require("../models/Employee");
const { isActiveAdmin } = require("../utils/userHelpers");
const Attendance = require("../models/Attendance");
const moment = require("moment");
const User = require("../models/User");
const Project = require("../models/Project");



exports.getSummary = async (req, res) => {
  try {
    const userId = req.user._id;

    /* =============================================================
        ADMIN DASHBOARD
       ============================================================= */

    if (isActiveAdmin(req.user)) {
      const todayStr = moment().format("YYYY-MM-DD");

      const [
        totalActiveEmployees,
        clockedInNow,
        pendingLeaves,
        inProgressTasks,
        uniqueProjects,
        activeTimers,
        recentActivity
      ] = await Promise.all([
        // 1. Total Employees with Status 'active'
        User.countDocuments({ status: "Enable", role: "Employee" }),

        // 2. Currently Clocked In (Attendance record exists for today with no clockOut)
        Attendance.countDocuments({ date: todayStr, clockOut: null }),

        // 3. Total Leave Requests Pending
        Leave.countDocuments({ status: "Pending" }),

        // 4. Tasks with status "In progress"
        Task.countDocuments({ liveStatus: "In progress" }),

        // 5. Total Unique Project Numbers
        Project.countDocuments({ status: "Active" }),
        // Live Timers (For the list)
        TimeLog.find({ isRunning: true, logType: "work" })
          .populate({ path: "user", select: "name", populate: { path: "employee", select: "photo" } })
          .populate("task", "title projectNumber")
          .lean(),

        // Recent Activity Feed
        TimeLog.find({ logType: "work", clearedByAdmin: false })
          .sort({ createdAt: -1 })
          .limit(10)
          .populate("user", "name")
          .populate("task", "title projectNumber")
          .lean(),
      ]);

      return res.json({
        role: "Admin",
        stats: {
          totalActiveEmployees,    // Status: Active
          attendanceLive: clockedInNow, // Currently Clocked In
          pendingApprovals: pendingLeaves,
          tasksInProgress: inProgressTasks,
          totalProjects: uniqueProjects,
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
    console.error(err);

    res.status(500).json({ error: "Mission Control sync failed." });
  }
};
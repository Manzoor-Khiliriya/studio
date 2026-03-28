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

    if (isActiveAdmin(req.user)) {
      const todayStr = moment().format("YYYY-MM-DD");

      const [
        totalActiveEmployees,
        clockedInNow,
        pendingLeaves,
        inProgressTasks,
        uniqueProjects,
        activeTimers,
        rawActivity
      ] = await Promise.all([
        User.countDocuments({ status: "Enable", role: "Employee" }),
        Attendance.countDocuments({ date: todayStr, clockOut: null }),
        Leave.countDocuments({ status: "Pending" }),
        Task.countDocuments({ liveStatus: "In progress" }),
        Project.countDocuments({ status: "Active" }),
        TimeLog.find({ isRunning: true, logType: "work" })
          .populate({ path: "user", select: "name", populate: { path: "employee", select: "photo" } })
          .populate({
            path: "task",
            select: "title project",
            populate: {
              path: "project",
              select: "project_code"
            }
          }).lean(),

        // Fetch only Start/Stop actions for the log
        TimeLog.find({
          action: { $in: ["Start", "Stop"] },
          clearedByAdmin: false
        })
          .sort({ createdAt: -1 })
          .limit(15)
          .populate("user", "name")
          .populate({
            path: "task",
            select: "title project",
            populate: {
              path: "project",
              select: "project_code"
            }
          }).lean()
      ]);

      // Calculate aggregated duration for Stop logs
      const recentActivity = await Promise.all(rawActivity.map(async (log) => {
        let duration = null;

        if (log.action === "Stop") {
          // Sum only "work" logs for this specific task/user session today
          const workSegments = await TimeLog.find({
            user: log.user?._id,
            task: log.task?._id,
            dateString: log.dateString,
            logType: "work"
          });
          const totalSeconds = workSegments.reduce((s, l) => s + (l.durationSeconds || 0), 0);
          duration = Math.round(totalSeconds / 60); // Convert to minutes
        }

        return {
          id: log._id,
          userName: log.user?.name,
          taskTitle: log.task?.title,
          projectCode: log.task?.project?.project_code,
          action: log.action,
          duration: duration,
          createdAt: log.createdAt
        };
      }));

      return res.json({
        role: "Admin",
        stats: {
          totalActiveEmployees,
          attendanceLive: clockedInNow,
          pendingApprovals: pendingLeaves,
          tasksInProgress: inProgressTasks,
          totalProjects: uniqueProjects,
        },
        liveTracking: activeTimers.map(t => ({
          id: t._id,
          userId: t.user?._id,
          employee: t.user?.name,
          photo: t.user?.employee?.photo,
          task: t.task?.title,
          projectCode: t.task?.projectNumber,
          since: t.startTime
        })),
        recentActivity
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
        .populate({
          path: "task",
          select: "title project",
          populate: {
            path: "project",
            select: "project_code"
          }
        }).lean()
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
        proficiency: employeeProfile?.proficiency || 100
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
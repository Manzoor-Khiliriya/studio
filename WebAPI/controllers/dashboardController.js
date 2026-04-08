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
    const todayStr = moment().format("YYYY-MM-DD");

    /* =============================================================
        ADMIN DASHBOARD
    ============================================================= */
    if (isActiveAdmin(req.user)) {

      const [
        totalActiveEmployees,
        clockedInNow,
        pendingLeaves,
        allTasks,
        uniqueProjects,
        activeTimers,
      ] = await Promise.all([
        User.countDocuments({ status: "Enable", role: "Employee" }),
        Attendance.countDocuments({ date: todayStr, clockOut: null }),
        Leave.countDocuments({ status: "Pending" }),
        Task.find().populate("timeLogs"),
        Project.countDocuments({ deleteStatus: "Disable" }),
        TimeLog.find({ isRunning: true, logType: "work" })
          .populate({ path: "user", select: "name", populate: { path: "employee", select: "employeeCode" } })
          .populate({
            path: "task",
            select: "title project",
            populate: { path: "project", select: "projectCode" }
          }).lean(),
      ]);

      const tasksWithVirtuals = allTasks.map(task => ({
        ...task.toObject(),
        liveStatus: task.liveStatus
      }));

      const inProgressTasks = tasksWithVirtuals.filter(
        t => t.liveStatus === "In progress"
      ).length;

      const rawActivity = await TimeLog.find({
        clearedByAdmin: false
      })
        .sort({ createdAt: -1 })
        .populate({
          path: "user",
          select: "name",
          populate: { path: "employee", select: "employeeCode" }
        })
        .populate("task", "title")
        .lean();

      const groupedActivity = {};

      for (const log of rawActivity) {
        const groupKey = `${log.user?._id}_${log.dateString}`;

        if (!groupedActivity[groupKey]) {

          const allDayLogs = await TimeLog.find({
            user: log.user?._id,
            dateString: log.dateString,
            logType: "work",
            isRunning: false
          });

          const totalSeconds = allDayLogs.reduce((acc, curr) => acc + (curr.durationSeconds || 0), 0);

          const h = Math.floor(totalSeconds / 3600);
          const m = Math.floor((totalSeconds % 3600) / 60);
          const s = totalSeconds % 60;

          groupedActivity[groupKey] = {
            id: log._id,
            userName: log.user?.name,
            employeeCode: log.user?.employee?.employeeCode,
            totalDailyTime: `${h}h ${m}m ${s}s`,
            dateString: log.dateString,
            lastActionAt: log.createdAt
          };
        }
      }

      const recentActivity = Object.values(groupedActivity).slice(0, 15);

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
          employeeCode: t.user?.employee?.employeeCode,
          task: t.task?.title,
          projectCode: t.task?.project?.projectCode || "N/A",
          since: t.startTime
        })),
        recentActivity
      });
    }

    /* =============================================================
        EMPLOYEE DASHBOARD
    ============================================================= */

    const employeeProfile = await Employee.findOne({ user: userId }).lean();

    const [assignedTasks, approvedLeavesCount, runningTimer] = await Promise.all([
      Task.find({ assignedTo: employeeProfile._id, status: { $ne: "Completed" } })
        .sort({ priority: -1, endDate: 1 })
        .populate("project", "projectCode")
        .populate("timeLogs"),

      Leave.countDocuments({ user: userId, status: "Approved" }),

      TimeLog.findOne({ user: userId, isRunning: true })
        .populate({
          path: "task",
          select: "title project",
          populate: { path: "project", select: "projectCode" }
        }).lean()
    ]);

    return res.json({
      role: "Employee",
      activeTimer: runningTimer ? {
        logId: runningTimer._id,
        task: runningTimer.task?.title,
        projectCode: runningTimer.task?.project?.projectCode || "N/A",
        startedAt: runningTimer.startTime,
        type: runningTimer.logType
      } : null,

      taskSnapshot: assignedTasks.map(t => {
        const task = t.toObject();

        return {
          id: task._id,
          title: task.title,
          projectCode: task?.project?.projectCode || "N/A",
          deadline: task.endDate,
          priority: task.priority,
          status: task.liveStatus,
          description: task.description,
          updatedAt: task.updatedAt
        };
      }),

      approvedLeavesCount
    });

  } catch (err) {
    console.error("Error in getSummary:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
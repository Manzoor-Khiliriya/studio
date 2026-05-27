const Task = require("../models/Task");
const TimeLog = require("../models/TimeLog");
const Leave = require("../models/Leave");
const Employee = require("../models/Employee");
const { isActiveAdmin } = require("../utils/userHelpers");
const Attendance = require("../models/Attendance");
const moment = require("moment");
const User = require("../models/User");
const Project = require("../models/Project");
const TaskAllocation = require("../models/TaskAllocation");
const { getToday } = require("../utils/dateHelper");

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
        attendanceToday,
      ] = await Promise.all([
        User.countDocuments({ status: "Enable", role: "Employee" }),
        Attendance.countDocuments({ date: todayStr, clockOut: null }),
        Leave.countDocuments({ status: "Pending" }),
        Task.find().populate("timeLogs"),
        Project.countDocuments({ deleteStatus: "Disable" }),
        TimeLog.find({ isRunning: true, logType: "work" })
          .populate({
            path: "user",
            select: "name",
            populate: { path: "employee", select: "employeeCode" },
          })
          .populate({
            path: "task",
            select: "title project",
            populate: { path: "project", select: "projectCode" },
          })
          .lean(),
        Attendance.find()
          .populate({
            path: "user",
            select: "name",
            populate: {
              path: "employee",
              select: "employeeCode",
            },
          })
          .lean(),
      ]);

      const tasksWithVirtuals = allTasks.map((task) => ({
        ...task.toObject(),
        liveStatus: task.liveStatus,
      }));

      const inProgressTasks = tasksWithVirtuals.filter(
        (t) => t.liveStatus === "In progress",
      ).length;

      const rawActivity = await TimeLog.find({
        clearedByAdmin: false,
      })
        .sort({ createdAt: -1 })
        .populate({
          path: "user",
          select: "name",
          populate: { path: "employee", select: "employeeCode" },
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
            isRunning: false,
          });

          const totalSeconds = allDayLogs.reduce(
            (acc, curr) => acc + (curr.rawDurationSeconds || 0),
            0,
          );

          const h = Math.floor(totalSeconds / 3600);
          const m = Math.floor((totalSeconds % 3600) / 60);
          const s = totalSeconds % 60;
          const attendanceRecord = attendanceToday.find(
            (a) =>
              a.user?._id?.toString() === log.user?._id?.toString() &&
              a.date === log.dateString,
          );

          const attendanceSeconds = attendanceRecord?.totalSecondsWorked || 0;
          const attendanceHours = Math.floor(attendanceSeconds / 3600);
          const attendanceMinutes = Math.floor((attendanceSeconds % 3600) / 60);
          const as = attendanceSeconds % 60;
          const attendanceWorked = `${attendanceHours} Hrs ${attendanceMinutes} Mins ${as} Secs`;
          const productivity =
            attendanceSeconds > 0
              ? Math.round((totalSeconds / attendanceSeconds) * 100)
              : 0;
          const idleSeconds = Math.max(attendanceSeconds - totalSeconds, 0);
          const idleHours = Math.floor(idleSeconds / 3600);
          const idleMinutes = Math.floor((idleSeconds % 3600) / 60);
          const idleSecs = idleSeconds % 60;
          const idleFormatted = `${idleHours} Hrs ${idleMinutes} Mins ${idleSecs} Secs`;

          groupedActivity[groupKey] = {
            id: log._id,
            userName: log.user?.name,
            employeeCode: log.user?.employee?.employeeCode,
            totalDailyTime: `${h} Hrs ${m} Mins ${s} Secs`,
            attendanceWorked,
            productivity,
            idleFormatted,
            dateString: log.dateString,
            lastActionAt: log.createdAt,
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
        liveTracking: activeTimers.map((t) => ({
          id: t._id,
          userId: t.user?._id,
          employee: t.user?.name,
          employeeCode: t.user?.employee?.employeeCode,
          task: t.task?.title,
          projectCode: t.task?.project?.projectCode || "N/A",
          since: t.startTime,
        })),
        attendanceToday,
        recentActivity,
      });
    }

    /* =============================================================
        EMPLOYEE DASHBOARD
    ============================================================= */

    const employeeProfile = await Employee.findOne({ user: userId }).lean();

    const [assignedTasks, approvedLeavesCount, runningTimer] =
      await Promise.all([
        Task.find({
          assignedTo: employeeProfile._id,
          status: { $ne: "Completed" },
        })
          .populate("project", "title projectCode")
          .populate("timeLogs"),

        Leave.countDocuments({ user: userId, status: "Approved" }),

        TimeLog.findOne({ user: userId, isRunning: true })
          .populate({
            path: "task",
            select: "title project",
            populate: { path: "project", select: "projectCode" },
          })
          .lean(),
      ]);

    const allocations = await TaskAllocation.find({
      employee: employeeProfile._id,
    });

    const allocationMap = {};
    allocations.forEach((a) => {
      allocationMap[a.task.toString()] = a;
    });

    const today = getToday();

    return res.json({
      role: "Employee",
      activeTimer: runningTimer
        ? {
            logId: runningTimer._id,
            task: runningTimer.task?.title,
            projectCode: runningTimer.task?.project?.projectCode || "N/A",
            startedAt: runningTimer.startTime,
            type: runningTimer.logType,
          }
        : null,

      taskSnapshot: assignedTasks
        .map((t) => {
          const task = t.toObject();
          const allocation = allocationMap[task._id.toString()];

          const todayAllocation = allocation?.dailyAllocations?.find(
            (d) => d.date === today,
          );
          const todayAllocatedSeconds = todayAllocation?.allocatedSeconds ?? 0;
          const ah = Math.floor(todayAllocatedSeconds / 3600);
          const am = Math.floor((todayAllocatedSeconds % 3600) / 60);
          const as_ = todayAllocatedSeconds % 60;

          return {
            id: task._id,
            projectTitle: task?.project?.title,
            projectCode: task?.project?.projectCode || "N/A",
            title: task?.title,
            deadline: task.endDate,
            priority: task.priority,
            status: task.liveStatus,
            description: task.description,
            updatedAt: task.updatedAt,
            allocation: allocation
              ? {
                  role: allocation.role,
                  priorityOrder: allocation.priorityOrder,
                  todayAllocatedSeconds,
                  todayAllocatedFormatted: `${ah} Hrs ${am} Mins ${as_} Secs`,
                }
              : null,
          };
        })
        .sort((a, b) => {
          const aPriority = a.allocation?.priorityOrder || 9999;
          const bPriority = b.allocation?.priorityOrder || 9999;
          return aPriority - bPriority;
        }),
      approvedLeavesCount,
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

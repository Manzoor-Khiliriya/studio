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
const { getToday, now } = require("../utils/dateHelper");

exports.getSummary = async (req, res) => {
  try {
    const userId = req.user._id;
    const today = getToday();

    if (isActiveAdmin(req.user)) {
      const managedEmployees = await Employee.find({
        admin: req.user._id,
      }).select("user");

      const employeeUserIds = managedEmployees.map((e) => e.user);

      const [
        totalActiveEmployees,
        clockedInNow,
        allTasks,
        uniqueProjects,
        activeTimers,
        attendanceToday,
        adminUsers,
      ] = await Promise.all([
        User.countDocuments({
          status: "Enable",
          role: { $in: ["Employee", "Manager"] },
        }),
        Attendance.countDocuments({ date: today, clockOut: null }),
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

        User.find({ role: "Admin" }).select("_id"),
      ]);

      const tasksWithVirtuals = allTasks.map((task) => ({
        ...task.toObject(),
        liveStatus: task.liveStatus,
      }));

      const inProgressTasks = tasksWithVirtuals.filter(
        (t) => t.liveStatus === "In progress",
      ).length;

      const pendingLeaves = await Leave.countDocuments({
        user: { $in: employeeUserIds },
        status: "Pending",
      });

      const adminIds = adminUsers.map((a) => a._id);
      const rawActivity = await TimeLog.find({
        clearedByAdmin: false,
        user: { $nin: adminIds },
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

    if (["Employee", "Manager"].includes(req.user.role)) {
      const employeeProfile = await Employee.findOne({ user: userId }).lean();

      const [assignedTasks, approvedLeavesCount, runningTimer] =
        await Promise.all([
          Task.find({
            assignedTo: employeeProfile._id,
            // status: { $ne: "Completed" },
          })
            .populate("project", "title projectCode")
            .populate("timeLogs"),

          Leave.countDocuments({
            user: userId,
            status: "Approved",
            startDate: { $gte: today },
          }),

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
            const todayAllocatedSeconds =
              todayAllocation?.allocatedSeconds ?? 0;
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
    }

    if (["GAD Employee", "Hr Employee"].includes(req.user.role)) {
      const upcomingLeavesCount = await Leave.countDocuments({
        user: userId,
        startDate: { $gte: now() },
        status: "Approved",
      });

      return res.json({
        role: req.user.role,
        upcomingLeavesCount,
      });
    }

    if (req.user.role === "GAD Manager") {
      const managedEmployees = await Employee.find({
        manager: req.user._id,
      }).select("user");

      const employeeUserIds = managedEmployees.map((e) => e.user);

      const upcomingLeavesCount = await Leave.countDocuments({
        user: userId,
        startDate: { $gte: now() },
        status: "Approved",
      });

      const pendingLeaveRequests = await Leave.countDocuments({
        user: { $in: employeeUserIds },
        status: "Pending",
        approvalFlow: {
          $elemMatch: {
            approver: req.user._id,
            status: "Pending",
          },
        },
      });

      return res.json({
        role: req.user.role,
        upcomingLeavesCount,
        pendingLeaveRequests,
      });
    }

    if (req.user.role === "Hr Manager") {
      const upcomingLeavesCount = await Leave.countDocuments({
        user: userId,
        startDate: { $gte: now() },
        status: "Approved",
      });

      const pendingLeaveRequests = await Leave.countDocuments({
        status: "Pending",
        approvalFlow: {
          $elemMatch: {
            role: "Hr Manager",
            status: "Pending",
          },
        },
      });

      return res.json({
        role: req.user.role,
        upcomingLeavesCount,
        pendingLeaveRequests,
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getManagerDashboard = async (req, res) => {
  try {
    const today = getToday();

    const managedEmployees = await Employee.find({
      manager: req.user._id,
    }).select("user");

    const employeeUserIds = managedEmployees.map((e) => e.user);

    const [
      totalActiveEmployees,
      clockedInNow,
      allTasks,
      uniqueProjects,
      activeTimers,
      attendanceToday,
    ] = await Promise.all([
      User.countDocuments({
        status: "Enable",
        role: "Employee",
      }),

      Attendance.countDocuments({
        date: today,
        clockOut: null,
      }),

      Task.find().populate("timeLogs"),

      Project.countDocuments({
        deleteStatus: "Disable",
      }),

      TimeLog.find({
        isRunning: true,
        logType: "work",
      })
        .populate({
          path: "user",
          select: "name",
          populate: {
            path: "employee",
            select: "employeeCode",
          },
        })
        .populate({
          path: "task",
          select: "title project",
          populate: {
            path: "project",
            select: "projectCode",
          },
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

    const pendingLeaves = await Leave.countDocuments({
      user: { $in: employeeUserIds },
      status: "Pending",
      approvalFlow: {
        $elemMatch: {
          approver: req.user._id,
          status: "Pending",
        },
      },
    });

    return res.json({
      role: "Manager",

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
    });
  } catch (err) {
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

exports.getAdminOverview = async (req, res) => {
  try {
    const employeeProfile = await Employee.findOne({
      user: req.user._id,
    }).lean();

    const today = getToday();

    const [assignedTasks, runningTimer, todayLogs] = await Promise.all([
      Task.find({
        assignedTo: employeeProfile?._id,
        // status: { $ne: "Completed" },
      })
        .populate("project", "title projectCode")
        .populate("timeLogs"),

      TimeLog.findOne({
        user: req.user._id,
        isRunning: true,
      })
        .populate({
          path: "task",
          select: "title project",
          populate: {
            path: "project",
            select: "projectCode",
          },
        })
        .lean(),

      TimeLog.find({
        user: req.user._id,
        dateString: today,
        logType: "work",
      }),
    ]);

    let todaySeconds = 0;
    const currentTime = now();

    todayLogs.forEach((log) => {
      if (log.isRunning) {
        todaySeconds += Math.floor(
          (currentTime - new Date(log.startTime)) / 1000,
        );
      } else {
        todaySeconds += log.rawDurationSeconds || 0;
      }
    });

    return res.json({
      role: "Admin",
      todaySeconds,
      activeTimer: runningTimer
        ? {
            logId: runningTimer._id,
            taskId: runningTimer.task?._id,
            task: runningTimer.task?.title,
            projectCode: runningTimer.task?.project?.projectCode,
            startedAt: runningTimer.startTime,
            type: runningTimer.logType,
          }
        : null,

      assignedTasksCount: assignedTasks.length,

      taskSnapshot: assignedTasks.map((task) => ({
        id: task._id,
        title: task.title,
        projectTitle: task.project?.title,
        projectCode: task.project?.projectCode,
        priority: task.priority,
        status: task.liveStatus,
        deadline: task.endDate,
        description: task.description,
      })),
    });
  } catch (err) {
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

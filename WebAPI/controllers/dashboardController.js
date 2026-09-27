const Task = require("../models/Task");
const TimeLog = require("../models/TimeLog");
const Leave = require("../models/Leave");
const Employee = require("../models/Employee");
const { isActiveAdmin } = require("../utils/userHelpers");
const Attendance = require("../models/Attendance");
const User = require("../models/User");
const Project = require("../models/Project");
const TaskAllocation = require("../models/TaskAllocation");
const { getToday, now } = require("../utils/dateHelper");

const moment = require("moment-timezone");
const TIMEZONE = "Asia/Kolkata";

exports.getSummary = async (req, res) => {
  try {
    const userId = req.user._id;
    const today = getToday();

    if (isActiveAdmin(req.user)) {
      const managedEmployees = await Employee.find({
        admin: req.user._id,
      }).select("user");

      const employeeUserIds = managedEmployees.map((e) => e.user);
      const adminUsers = await User.find({ role: "Admin" }).select("_id");
      const adminIds = adminUsers.map((a) => a._id);

      const NON_ADMIN_ROLES = [
        "Employee",
        "Manager",
        "Hr Employee",
        "Hr Manager",
        "GAD Employee",
        "GAD Manager",
      ];

      const activityWindowStart = moment()
        .tz(TIMEZONE)
        .subtract(30, "days")
        .format("YYYY-MM-DD");

      const [
        totalActiveEmployees,
        clockedInNow,
        inProgressTaskIds, // 🔥 CHANGED: was `allTasks` from Task.find().populate("timeLogs")
        uniqueProjects,
        activeTimers,
        attendanceToday,
        allNonAdminUsers,
      ] = await Promise.all([
        User.countDocuments({
          status: "Enable",
          role: { $in: ["Employee", "Manager"] },
        }),
        Attendance.countDocuments({ date: today, clockOut: null }),
        TimeLog.distinct("task", { isRunning: true, logType: "work" }),
        Project.countDocuments({ deleteStatus: "Disable" }),
        TimeLog.find({
          isRunning: true,
          logType: { $in: ["work", "break"] },
          user: { $nin: adminIds },
        })
          .populate({
            path: "user",
            select: "name role",
            populate: { path: "employee", select: "employeeCode" },
          })
          .populate({
            path: "task",
            select: "title project",
            populate: { path: "project", select: "projectCode title" },
          })
          .lean(),
        Attendance.find({ date: { $gte: activityWindowStart } })
          .populate({
            path: "user",
            select: "name role",
            populate: {
              path: "employee",
              select: "employeeCode",
            },
          })
          .lean(),
        User.find({
          status: "Enable",
          role: { $in: NON_ADMIN_ROLES },
        })
          .select("name role")
          .populate({
            path: "employee",
            select: "employeeCode",
          })
          .lean(),
      ]);

      const allEmployeesCount = allNonAdminUsers.length;

      const inProgressTasks = inProgressTaskIds.length;

      const pendingLeaves = await Leave.countDocuments({
        user: { $in: employeeUserIds },
        status: "Pending",
      });

      const activeTimerUserIds = new Set(
        activeTimers.map((t) => t.user?._id?.toString()).filter(Boolean),
      );

      const clockedInEmployeesCount = attendanceToday.filter(
        (attendance) =>
          attendance.user &&
          attendance.date === today &&
          !attendance.clockOut &&
          ["Employee", "Manager"].includes(attendance.user.role),
      ).length;

      const nonWorkingEmployees = allNonAdminUsers
        .filter(
          (u) =>
            ["Employee", "Manager"].includes(u.role) &&
            !activeTimerUserIds.has(u._id.toString()),
        )
        .map((u) => ({
          id: u._id,
          name: u.name,
          role: u.role,
          employeeCode: u.employee?.employeeCode || "N/A",
        }));

      const rawActivity = await TimeLog.find({
        clearedByAdmin: false,
        user: { $nin: adminIds },
        dateString: { $gte: activityWindowStart },
      })
        .sort({ createdAt: -1 })
        .populate({
          path: "user",
          select: "name role",
          populate: { path: "employee", select: "employeeCode" },
        })
        .populate("task", "title")
        .lean();

      const groupedActivity = {};

      for (const log of rawActivity) {
        const groupKey = `${log.user?._id}_${log.dateString}`;

        if (!groupedActivity[groupKey]) {
          const allDayLogs = rawActivity.filter(
            (l) =>
              l.user?._id?.toString() === log.user?._id?.toString() &&
              l.dateString === log.dateString &&
              l.logType === "work" &&
              !l.isRunning,
          );

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

      const activeTimerMap = new Map(
        activeTimers.map((timer) => [timer.user?._id?.toString(), timer]),
      );

      const attendanceMap = new Map(
        attendanceToday.map((attendance) => [
          attendance.user?._id?.toString(),
          attendance,
        ]),
      );

      const liveTracking = allNonAdminUsers
        .filter((u) => ["Employee", "Manager"].includes(u.role))
        .map((user) => {
          const uid = user._id.toString();

          const timer = activeTimerMap.get(uid);
          const attendance = attendanceMap.get(uid);

          const isAttendanceClockedIn =
            attendance && attendance.date === today && !attendance.clockOut;

          let displayStatus;

          if (!isAttendanceClockedIn) {
            displayStatus = "not-clocked-in";
          } else if (timer?.logType === "work") {
            displayStatus = "work";
          } else if (timer?.logType === "break") {
            displayStatus = "break";
          } else {
            displayStatus = "non-working";
          }

          return {
            id: timer?._id || user._id,
            userId: user._id,

            employee: user.name,
            employeeCode: user.employee?.employeeCode || "N/A",
            role: user.role,

            attendanceStatus: isAttendanceClockedIn
              ? "Clocked In"
              : "Not Clocked In",

            taskId: timer?.task?._id || null,
            task: timer?.task?.title || null,
            projectTitle: timer?.task?.project?.title || null,
            projectCode: timer?.task?.project?.projectCode || "N/A",

            since: timer?.startTime || null,
            status: timer?.logType || null,

            displayStatus,

            isTaskRunning: !!timer,
          };
        });

      return res.json({
        role: "Admin",
        stats: {
          totalActiveEmployees,
          attendanceLive: clockedInNow,
          pendingApprovals: pendingLeaves,
          tasksInProgress: inProgressTasks,
          totalProjects: uniqueProjects,
        },
        liveTracking,
        nonWorkingEmployees,
        allEmployeesCount,
        clockedInEmployeesCount,
        attendanceToday,
        recentActivity,
      });
    }

    /* =============================================================
          EMPLOYEE DASHBOARD
      ============================================================= */

    if (["Employee", "Manager"].includes(req.user.role)) {
      const employeeProfile = await Employee.findOne({ user: userId }).lean();

      const [approvedLeavesCount, runningTimer] = await Promise.all([
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

      const assignedTasks = (
        await Task.find({
          assignedTo: employeeProfile?._id,
        })
          .populate({
            path: "project",
            match: { status: "Active", deleteStatus: "Disable" },
            select: "title projectCode",
          })
          .populate("timeLogs")
      ).filter((task) => task.project);

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
      inProgressTaskIds, // 🔥 CHANGED: was `allTasks` from Task.find().populate("timeLogs")
      uniqueProjects,
      activeTimers,
      allActiveUsers,
    ] = await Promise.all([
      User.countDocuments({
        _id: { $in: employeeUserIds },
        status: "Enable",
        role: "Employee",
      }),

      Attendance.countDocuments({
        user: { $in: employeeUserIds },
        date: today,
        clockOut: null,
      }),

      // 🔥 CHANGED: replaces Task.find().populate("timeLogs") entirely.
      // liveStatus === "In progress" is exactly "has a currently running work TimeLog",
      // so this one distinct() query gives the same answer with none of the overhead.
      TimeLog.distinct("task", { isRunning: true, logType: "work" }),

      Project.countDocuments({
        deleteStatus: "Disable",
      }),

      TimeLog.find({
        user: { $in: employeeUserIds },
        isRunning: true,
        logType: { $in: ["work", "break"] },
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
            select: "title projectCode",
          },
        })
        .lean(),

      User.find({
        _id: { $in: employeeUserIds },
        status: "Enable",
        role: "Employee",
      })
        .select("name")
        .populate({
          path: "employee",
          select: "employeeCode",
        })
        .lean(),
    ]);

    // 🔥 CHANGED: was tasksWithVirtuals.filter(...).length — now just the array length
    const inProgressTasks = inProgressTaskIds.length;

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

    const activeTimerUserIds = new Set(
      activeTimers.map((t) => t.user?._id?.toString()).filter(Boolean),
    );

    const nonWorkingEmployees = allActiveUsers
      .filter((u) => !activeTimerUserIds.has(u._id.toString()))
      .map((u) => ({
        id: u._id,
        name: u.name,
        employeeCode: u.employee?.employeeCode || "N/A",
      }));

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
        projectTitle: t.task?.project?.title,
        projectCode: t.task?.project?.projectCode || "N/A",
        since: t.startTime,
        status: t.logType,
      })),
      nonWorkingEmployees,
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

    if (!employeeProfile) {
      return res.json({
        role: "Admin",
        todaySeconds: 0,
        activeTimer: null,
        assignedTasksCount: 0,
        taskSnapshot: [],
      });
    }

    const today = getToday();

    const [runningTimer, todayLogs] = await Promise.all([
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

    const assignedTasks = (
      await Task.find({
        assignedTo: employeeProfile?._id,
      })
        .populate({
          path: "project",
          match: { status: "Active" },
          select: "title projectCode",
        })
        .populate("timeLogs")
    ).filter((task) => task.project);

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

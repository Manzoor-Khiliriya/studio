const Attendance = require("../models/Attendance");
const User = require("../models/User");
const { emitDashboardUpdate } = require("../utils/socket");
const { getToday, now, getMonthRange } = require("../utils/dateHelper");
const moment = require("moment-timezone");
const TimeLog = require("../models/TimeLog");
const { applyProficiency } = require("../utils/userHelpers");

const emitEvent = (req, event, data, userId = null) => {
  const io = req.app.get("socketio");
  if (!io) return;

  if (userId) {
    io.to(userId.toString()).emit(event, data);
  } else {
    io.emit(event, data);
  }
};

const matchesStatus = (record, status) => {
  if (!status || status === "all") return true;
  const onLunch = record.status === "Clocked In" && !!record.isOnLunch;

  switch (status) {
    case "on_lunch":
      return onLunch;
    case "clocked_in":
      return record.status === "Clocked In" && !onLunch;
    case "clocked_out":
      return record.status === "Clocked Out";
    case "not_clocked_in":
      return record.status === "Not Clocked In";
    default:
      return true;
  }
};

const getLunchSeconds = (a) => {
  if (!a) return 0;
  let s = a.totalLunchSeconds || 0;
  if (a.isOnLunch && a.lunchStartTime) {
    s += Math.max(0, Math.floor((now() - new Date(a.lunchStartTime)) / 1000));
  }
  return s;
};

const closeLog = async (log, currentTime) => {
  const rawSeconds = Math.max(
    0,
    Math.floor((currentTime - new Date(log.startTime)) / 1000),
  );
  if (log.logType === "work") {
    const { adjustedSeconds } = await applyProficiency(log.user, rawSeconds);
    log.rawDurationSeconds = rawSeconds;
    log.durationSeconds = adjustedSeconds;
  } else {
    log.durationSeconds = rawSeconds;
  }
  log.endTime = currentTime;
  log.isRunning = false;
  await log.save();
};

const formatLunchSeconds = (seconds = 0) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
};

exports.clockIn = async (req, res) => {
  try {
    const today = getToday();
    let attendance = await Attendance.findOne({
      user: req.user.id,
      date: today,
    });

    const currentTime = now();
    if (attendance) {
      if (attendance.clockOut === null) {
        return res.status(400).json({ message: "Already clocked in." });
      }

      attendance.clockOut = null;
      attendance.lastResumeTime = currentTime;
      attendance.isOnLunch = false;
      attendance.lunchStartTime = null;
      await attendance.save();
      emitEvent(req, "attendanceChanged");
      emitDashboardUpdate(req);
      return res.status(200).json(attendance);
    }

    attendance = await Attendance.create({
      user: req.user.id,
      date: today,
      clockIn: currentTime,
      lastResumeTime: currentTime,
      totalSecondsWorked: 0,
    });

    emitEvent(req, "attendanceChanged");
    emitDashboardUpdate(req);
    res.status(201).json(attendance);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.clockOut = async (req, res) => {
  try {
    const today = getToday();
    const record = await Attendance.findOne({
      user: req.user.id,
      date: today,
      clockOut: null,
    });
    if (!record) return res.status(404).json({ message: "No active session." });

    const currentTime = now();

    if (record.isOnLunch) {
      // finalize lunch, no work seconds to add (timer was paused)
      record.totalLunchSeconds = getLunchSeconds(record);
      record.isOnLunch = false;
      record.lunchStartTime = null;

      const lunchBreak = await TimeLog.findOne({
        user: req.user._id,
        isRunning: true,
        fromLunch: true,
      });
      if (lunchBreak) {
        lunchBreak.action = "Stop";
        await closeLog(lunchBreak, currentTime);
      }
    } else {
      record.totalSecondsWorked += Math.max(
        0,
        Math.floor((currentTime - record.lastResumeTime) / 1000),
      );
    }

    record.clockOut = currentTime;
    record.lastResumeTime = null;
    await record.save();

    emitEvent(req, "attendanceChanged");
    emitEvent(req, "timeLogChanged", null, req.user._id);
    emitDashboardUpdate(req);
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.startLunch = async (req, res) => {
  try {
    const record = await Attendance.findOne({
      user: req.user.id,
      date: getToday(),
      clockOut: null,
    });
    if (!record) return res.status(400).json({ message: "Clock in first." });
    if (record.isOnLunch)
      return res.status(400).json({ message: "Already on lunch." });

    const t = now();

    // pause attendance timer
    if (record.lastResumeTime) {
      record.totalSecondsWorked += Math.max(
        0,
        Math.floor((t - record.lastResumeTime) / 1000),
      );
    }
    record.lastResumeTime = null; // pause
    record.isOnLunch = true;
    record.lunchStartTime = t;
    await record.save();

    // running task -> becomes a break
    const active = await TimeLog.findOne({
      user: req.user._id,
      isRunning: true,
      logType: "work",
    });
    if (active) {
      await closeLog(active, t);
      await TimeLog.create({
        user: req.user._id,
        task: active.task,
        startTime: now(),
        logType: "break",
        isRunning: true,
        dateString: active.dateString,
        fromLunch: true,
      });
    }

    emitEvent(req, "attendanceChanged");
    emitEvent(req, "timeLogChanged", null, req.user._id);
    emitEvent(req, "taskChanged");
    emitDashboardUpdate(req);
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.endLunch = async (req, res) => {
  try {
    const record = await Attendance.findOne({
      user: req.user.id,
      date: getToday(),
      clockOut: null,
    });
    if (!record || !record.isOnLunch) {
      return res.status(400).json({ message: "You are not on lunch." });
    }

    const t = now();
    record.totalLunchSeconds = getLunchSeconds(record);
    record.isOnLunch = false;
    record.lunchStartTime = null;
    record.lastResumeTime = t; // resume
    await record.save();

    // resume task only if the break came from lunch
    const lunchBreak = await TimeLog.findOne({
      user: req.user._id,
      isRunning: true,
      logType: "break",
      fromLunch: true,
    });
    if (lunchBreak) {
      await closeLog(lunchBreak, t);
      await TimeLog.create({
        user: req.user._id,
        task: lunchBreak.task,
        startTime: now(),
        logType: "work",
        action: "Start",
        isRunning: true,
        dateString: lunchBreak.dateString,
      });
    }

    emitEvent(req, "attendanceChanged");
    emitEvent(req, "timeLogChanged", null, req.user._id);
    emitEvent(req, "taskChanged");
    emitDashboardUpdate(req);
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTodayStatus = async (req, res) => {
  try {
    const today = getToday();
    const record = await Attendance.findOne({ user: req.user.id, date: today });
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllAttendance = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      userId,
      search,
      page = 1,
      limit = 10,
      status: statusFilter,
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const today = getToday();

    const isToday =
      (!startDate && !endDate) || (startDate === today && endDate === today);

    const users = await User.find({
      status: "Enable",
      role: { $ne: "Admin" },
      ...(userId ? { _id: userId } : {}),
    })
      .select("name email role")
      .populate({
        path: "employee",
        select: "employeeCode",
      })
      .lean();

    if (isToday) {
      const attendanceRecords = await Attendance.find({
        date: today,
        ...(userId ? { user: userId } : {}),
      })
        .sort({ clockIn: -1 })
        .lean();

      const attendanceMap = new Map();

      for (const record of attendanceRecords) {
        const recordUserId = record.user?.toString();

        if (!recordUserId) continue;

        const existing = attendanceMap.get(recordUserId);

        const currentIsClockedIn = !record.clockOut;

        const existingIsClockedIn = existing && !existing.clockOut;

        if (
          !existing ||
          (currentIsClockedIn && !existingIsClockedIn) ||
          (currentIsClockedIn === existingIsClockedIn &&
            new Date(record.clockIn || 0) > new Date(existing.clockIn || 0))
        ) {
          attendanceMap.set(recordUserId, record);
        }
      }

      const records = users.map((user) => {
        const attendance = attendanceMap.get(user._id.toString());

        let status;

        if (!attendance) {
          status = "Not Clocked In";
        } else if (!attendance.clockOut) {
          status = "Clocked In";
        } else {
          status = "Clocked Out";
        }

        const isClockedIn = status === "Clocked In";

        let totalSecondsWorked = attendance?.totalSecondsWorked || 0;

        if (isClockedIn && attendance?.lastResumeTime) {
          const currentTime = now();

          const currentSessionSeconds = Math.floor(
            (currentTime - new Date(attendance.lastResumeTime)) / 1000,
          );

          totalSecondsWorked += Math.max(currentSessionSeconds, 0);
        }

        const totalLunchSeconds = getLunchSeconds(attendance);

        return {
          _id: attendance?._id || user._id,

          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,

            employee: {
              employeeCode: user.employee?.employeeCode || "N/A",
            },
          },

          date: today,
          clockIn: attendance?.clockIn || null,
          clockOut: attendance?.clockOut || null,
          lastResumeTime: attendance?.lastResumeTime || null,
          totalSecondsWorked,
          totalLunchSeconds,
          totalLunchFormatted: formatLunchSeconds(totalLunchSeconds),
          status,
          isClockedIn,
          isOnLunch: !!attendance?.isOnLunch,
        };
      });

      const totalEmployees = records.length;

      let filteredRecords = records;

      if (search) {
        const searchLower = search.trim().toLowerCase();

        filteredRecords = filteredRecords.filter(
          (record) =>
            record.user?.name?.toLowerCase().includes(searchLower) ||
            record.user?.employee?.employeeCode
              ?.toLowerCase()
              .includes(searchLower),
        );
      }

      filteredRecords = filteredRecords.filter((r) =>
        matchesStatus(r, statusFilter),
      );

      const onLunchCount = records.filter(
        (record) => record.status === "Clocked In" && record.isOnLunch,
      ).length;

      const clockedInCount = records.filter(
        (record) => record.status === "Clocked In",
      ).length;

      const clockedOutCount = records.filter(
        (record) => record.status === "Clocked Out",
      ).length;

      const notClockedInCount = records.filter(
        (record) => record.status === "Not Clocked In",
      ).length;

      const totalRecords = filteredRecords.length;

      const skip = (pageNum - 1) * limitNum;
      const paginatedRecords = filteredRecords.slice(skip, skip + limitNum);

      return res.json({
        records: paginatedRecords,

        summary: {
          totalEmployees,
          clockedInCount,
          notClockedInCount,
          clockedOutCount,
          onLunchCount,
        },

        pagination: {
          total: totalRecords,
          page: pageNum,
          pages: Math.ceil(totalRecords / limitNum),
          limit: limitNum,
        },
      });
    }

    const attendanceQuery = {};

    if (userId) {
      attendanceQuery.user = userId;
    }

    if (startDate && endDate) {
      attendanceQuery.date = {
        $gte: startDate,
        $lte: endDate,
      };
    }

    const attendanceRecords = await Attendance.find(attendanceQuery)
      .populate({
        path: "user",
        select: "name email role",
        populate: {
          path: "employee",
          select: "employeeCode",
        },
      })
      .sort({
        date: -1,
        clockIn: -1,
      })
      .lean();

    const attendanceMap = new Map();

    for (const record of attendanceRecords) {
      const recordUserId = record.user?._id?.toString();

      if (!recordUserId) continue;

      const key = `${recordUserId}_${record.date}`;

      if (!attendanceMap.has(key)) {
        attendanceMap.set(key, record);
      }
    }

    const dates = [];

    if (startDate && endDate) {
      let current = moment(startDate);

      const end = moment(endDate);

      while (current.isSameOrBefore(end, "day")) {
        dates.push(current.format("YYYY-MM-DD"));

        current.add(1, "day");
      }
    }

    let records = [];

    for (const date of dates) {
      for (const user of users) {
        const key = `${user._id.toString()}_${date}`;

        const attendance = attendanceMap.get(key);

        const totalLunchSeconds = getLunchSeconds(attendance);
        const totalLunchFormatted = formatLunchSeconds(totalLunchSeconds);

        if (attendance) {
          const isClockedIn = !attendance.clockOut;

          let status;

          if (!attendance.clockOut) {
            status = "Clocked In";
          } else {
            status = "Clocked Out";
          }

          records.push({
            ...attendance,
            status,
            isClockedIn,
            totalLunchSeconds,
            totalLunchFormatted,
          });

          continue;
        }

        records.push({
          _id: `${user._id}_${date}`,

          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            employee: {
              employeeCode: user.employee?.employeeCode || "N/A",
            },
          },

          date,
          clockIn: null,
          clockOut: null,
          lastResumeTime: null,
          totalSecondsWorked: 0,
          totalLunchSeconds,
          totalLunchFormatted,
          status: "Not Clocked In",
          isClockedIn: false,
        });
      }
    }

    if (search) {
      const searchLower = search.trim().toLowerCase();

      records = records.filter(
        (record) =>
          record.user?.name?.toLowerCase().includes(searchLower) ||
          record.user?.employee?.employeeCode
            ?.toLowerCase()
            .includes(searchLower),
      );
    }

    records.sort((a, b) => {
      if (a.date !== b.date) {
        return b.date.localeCompare(a.date);
      }

      return (a.user?.name || "").localeCompare(b.user?.name || "");
    });

    const onLunchCount = records.filter(
      (record) => record.status === "Clocked In" && record.isOnLunch,
    ).length;

    const clockedInCount = records.filter(
      (record) => record.status === "Clocked In",
    ).length;

    const clockedOutCount = records.filter(
      (record) => record.status === "Clocked Out",
    ).length;

    const notClockedInCount = records.filter(
      (record) => record.status === "Not Clocked In",
    ).length;

    const visibleRecords = records.filter((r) =>
      matchesStatus(r, statusFilter),
    );
    const totalRecords = visibleRecords.length;

    const skip = (pageNum - 1) * limitNum;
    const paginatedRecords = visibleRecords.slice(skip, skip + limitNum);

    return res.json({
      records: paginatedRecords,

      summary: {
        totalEmployees: records.length,
        clockedInCount,
        clockedOutCount,
        notClockedInCount,
        onLunchCount,
      },

      pagination: {
        total: totalRecords,
        page: pageNum,
        pages: Math.ceil(totalRecords / limitNum),
        limit: limitNum,
      },
    });
  } catch (err) {
    console.error("getAllAttendance error:", err);

    return res.status(500).json({
      error: err.message,
    });
  }
};

exports.getEmployeeCalendar = async (req, res) => {
  try {
    const { userId, month, year } = req.query;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const { startOfMonth, endOfMonth } = getMonthRange(year, month);

    const records = await Attendance.find({
      user: userId,
      date: { $gte: startOfMonth, $lte: endOfMonth },
    }).sort({ date: 1 });

    const calendarMap = records.reduce((acc, record) => {
      acc[record.date] = record;
      return acc;
    }, {});

    res.json({
      userId,
      month,
      year,
      records: calendarMap,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

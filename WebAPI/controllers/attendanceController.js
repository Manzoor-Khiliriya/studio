const Attendance = require("../models/Attendance");
const User = require("../models/User");
const { emitDashboardUpdate } = require("../utils/socket");
const { getToday, now, getMonthRange } = require("../utils/dateHelper");
const moment = require("moment-timezone");

const emitEvent = (req, event, data, userId = null) => {
  const io = req.app.get("socketio");
  if (!io) return;

  if (userId) {
    io.to(userId.toString()).emit(event, data);
  } else {
    io.emit(event, data);
  }
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

    if (!record) {
      return res.status(404).json({ message: "No active session." });
    }

    const currentTime = now();
    const sessionSeconds = Math.floor(
      (currentTime - record.lastResumeTime) / 1000,
    );

    record.clockOut = currentTime;
    record.totalSecondsWorked += sessionSeconds;

    await record.save();

    emitEvent(req, "attendanceChanged");
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
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const today = getToday();

    const isToday =
      (!startDate && !endDate) || (startDate === today && endDate === today);

    // ============================================================
    // GET ACTIVE EMPLOYEES + MANAGERS
    // ============================================================

    const users = await User.find({
      status: "Enable",
      role: { $in: ["Employee", "Manager"] },
      ...(userId ? { _id: userId } : {}),
    })
      .select("name email role")
      .populate({
        path: "employee",
        select: "employeeCode",
      })
      .lean();

    // ============================================================
    // TODAY
    // ============================================================

    if (isToday) {
      const attendanceRecords = await Attendance.find({
        date: today,
        ...(userId ? { user: userId } : {}),
      })
        .sort({ clockIn: -1 })
        .lean();

      // ----------------------------------------------------------
      // Attendance Map
      // ----------------------------------------------------------

      const attendanceMap = new Map();

      for (const record of attendanceRecords) {
        const recordUserId = record.user?.toString();

        if (!recordUserId) continue;

        const existing = attendanceMap.get(recordUserId);

        const currentIsClockedIn = !record.clockOut;

        const existingIsClockedIn = existing && !existing.clockOut;

        /*
         * If duplicate attendance records exist:
         *
         * 1. Prefer the currently active record.
         * 2. Otherwise use the latest record.
         */

        if (
          !existing ||
          (currentIsClockedIn && !existingIsClockedIn) ||
          (currentIsClockedIn === existingIsClockedIn &&
            new Date(record.clockIn || 0) > new Date(existing.clockIn || 0))
        ) {
          attendanceMap.set(recordUserId, record);
        }
      }

      // ----------------------------------------------------------
      // Build today's records
      // ----------------------------------------------------------

      const records = users.map((user) => {
        const attendance = attendanceMap.get(user._id.toString());

        // --------------------------------------------------------
        // STATUS
        // --------------------------------------------------------

        let status;

        if (!attendance) {
          // No attendance record today
          status = "Not Clocked In";
        } else if (!attendance.clockOut) {
          // Attendance record exists and employee
          // has not clocked out
          status = "Clocked In";
        } else {
          // Attendance record exists and employee
          // already clocked out
          status = "Clocked Out";
        }

        const isClockedIn = status === "Clocked In";

        // --------------------------------------------------------
        // TOTAL WORKED SECONDS
        // --------------------------------------------------------

        let totalSecondsWorked = attendance?.totalSecondsWorked || 0;

        // If currently clocked in, add current running session
        if (isClockedIn && attendance?.lastResumeTime) {
          const currentTime = now();

          const currentSessionSeconds = Math.floor(
            (currentTime - new Date(attendance.lastResumeTime)) / 1000,
          );

          totalSecondsWorked += Math.max(currentSessionSeconds, 0);
        }

        // --------------------------------------------------------
        // RETURN RECORD
        // --------------------------------------------------------

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

          status,

          isClockedIn,
        };
      });

      // ============================================================
      // SUMMARY
      // ============================================================

      const totalEmployees = records.length;

      const clockedInCount = records.filter(
        (record) => record.status === "Clocked In",
      ).length;

      const notClockedInCount = records.filter(
        (record) => record.status === "Not Clocked In",
      ).length;

      const clockedOutCount = records.filter(
        (record) => record.status === "Clocked Out",
      ).length;

      // ============================================================
      // SEARCH
      // ============================================================

      let filteredRecords = records;

      if (search) {
        const searchLower = search.trim().toLowerCase();

        filteredRecords = records.filter(
          (record) =>
            record.user?.name?.toLowerCase().includes(searchLower) ||
            record.user?.employee?.employeeCode
              ?.toLowerCase()
              .includes(searchLower),
        );
      }

      // ============================================================
      // PAGINATION
      // ============================================================

      const totalRecords = filteredRecords.length;

      const skip = (pageNum - 1) * limitNum;

      const paginatedRecords = filteredRecords.slice(skip, skip + limitNum);

      // ============================================================
      // RESPONSE
      // ============================================================

      return res.json({
        records: paginatedRecords,

        summary: {
          totalEmployees,
          clockedInCount,
          notClockedInCount,
          clockedOutCount,
        },

        pagination: {
          total: totalRecords,
          page: pageNum,
          pages: Math.ceil(totalRecords / limitNum),
          limit: limitNum,
        },
      });
    }

    // ============================================================
    // HISTORICAL ATTENDANCE
    // ============================================================

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

    // ============================================================
    // CREATE ATTENDANCE MAP
    // ============================================================

    const attendanceMap = new Map();

    for (const record of attendanceRecords) {
      const recordUserId = record.user?._id?.toString();

      if (!recordUserId) continue;

      const key = `${recordUserId}_${record.date}`;

      // Keep latest attendance record
      if (!attendanceMap.has(key)) {
        attendanceMap.set(key, record);
      }
    }

    // ============================================================
    // CREATE DATE LIST
    // ============================================================

    const dates = [];

    if (startDate && endDate) {
      let current = moment(startDate);

      const end = moment(endDate);

      while (current.isSameOrBefore(end, "day")) {
        dates.push(current.format("YYYY-MM-DD"));

        current.add(1, "day");
      }
    }

    // ============================================================
    // BUILD HISTORICAL RECORDS
    // ============================================================

    let records = [];

    for (const date of dates) {
      for (const user of users) {
        const key = `${user._id.toString()}_${date}`;

        const attendance = attendanceMap.get(key);

        // --------------------------------------------------------
        // ACTUAL ATTENDANCE RECORD
        // --------------------------------------------------------

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
          });

          continue;
        }

        // --------------------------------------------------------
        // NO ATTENDANCE RECORD
        // --------------------------------------------------------
        // This is a virtual record.
        // It is NOT saved into MongoDB.

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

          status: "Not Clocked In",

          isClockedIn: false,
        });
      }
    }

    // ============================================================
    // SEARCH
    // ============================================================

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

    // ============================================================
    // SORT
    // ============================================================

    records.sort((a, b) => {
      if (a.date !== b.date) {
        return b.date.localeCompare(a.date);
      }

      return (a.user?.name || "").localeCompare(b.user?.name || "");
    });

    // ============================================================
    // SUMMARY
    // ============================================================

    const totalRecords = records.length;

    const clockedInCount = records.filter(
      (record) => record.status === "Clocked In",
    ).length;

    const clockedOutCount = records.filter(
      (record) => record.status === "Clocked Out",
    ).length;

    const notClockedInCount = records.filter(
      (record) => record.status === "Not Clocked In",
    ).length;

    // ============================================================
    // PAGINATION
    // ============================================================

    const skip = (pageNum - 1) * limitNum;

    const paginatedRecords = records.slice(skip, skip + limitNum);

    // ============================================================
    // RESPONSE
    // ============================================================

    return res.json({
      records: paginatedRecords,

      summary: {
        totalEmployees: records.length,

        clockedInCount,

        clockedOutCount,

        notClockedInCount,
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

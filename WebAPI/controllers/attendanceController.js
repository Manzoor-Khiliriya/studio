const Attendance = require("../models/Attendance");
const User = require("../models/User");
const moment = require("moment");
const { emitDashboardUpdate } = require("../utils/socket");

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
    const today = moment().format("YYYY-MM-DD");
    let attendance = await Attendance.findOne({ user: req.user.id, date: today });

    if (attendance) {
      attendance.clockOut = null;
      attendance.lastResumeTime = new Date();

      await attendance.save();
      emitEvent(req, "attendanceChanged");
      emitDashboardUpdate(req);
      return res.status(200).json(attendance);
    }

    const now = new Date();

    attendance = await Attendance.create({
      user: req.user.id,
      date: today,
      clockIn: now,
      lastResumeTime: now,
      totalSecondsWorked: 0
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
    const today = moment().format("YYYY-MM-DD");

    const record = await Attendance.findOne({
      user: req.user.id,
      date: today,
      clockOut: null
    });

    if (!record) {
      return res.status(404).json({ message: "No active session." });
    }

    const now = new Date();
    const sessionSeconds = Math.floor((now - record.lastResumeTime) / 1000);

    record.clockOut = now;
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
    const today = moment().format("YYYY-MM-DD");
    const record = await Attendance.findOne({ user: req.user.id, date: today });
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllAttendance = async (req, res) => {
  try {
    const { startDate, endDate, userId, search, page = 1, limit = 10 } = req.query;

    let query = {};

    if (search) {
      const matchedUsers = await User.find({
        name: { $regex: search, $options: "i" }
      }).select("_id");

      query.user = { $in: matchedUsers.map(u => u._id) };
    }

    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    }

    if (userId) {
      query.user = userId;
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const totalRecords = await Attendance.countDocuments(query);

    const records = await Attendance.find(query)
      .populate({
        path: "user",
        select: "name email",
        populate: {
          path: "employee",
          select: "employeeCode"
        }
      })
      .sort({ date: -1, clockIn: -1 })
      .skip(skip)
      .limit(limitNum);

    res.json({
      records,
      pagination: {
        total: totalRecords,
        page: pageNum,
        pages: Math.ceil(totalRecords / limitNum),
        limit: limitNum
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getEmployeeCalendar = async (req, res) => {
  try {
    const { userId, month, year } = req.query;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const startOfMonth = moment([year, month - 1]).format("YYYY-MM-DD");
    const endOfMonth = moment(startOfMonth).endOf("month").format("YYYY-MM-DD");

    const records = await Attendance.find({
      user: userId,
      date: { $gte: startOfMonth, $lte: endOfMonth }
    }).sort({ date: 1 });

    const calendarMap = records.reduce((acc, record) => {
      acc[record.date] = record;
      return acc;
    }, {});

    res.json({
      userId,
      month,
      year,
      records: calendarMap
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
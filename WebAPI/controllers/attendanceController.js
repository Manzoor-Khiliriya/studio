const Attendance = require("../models/Attendance");
const moment = require("moment");

// --- CLOCK IN ---
exports.clockIn = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = moment().format("YYYY-MM-DD");

    // Check if already clocked in today
    const existing = await Attendance.findOne({ user: userId, date: today });
    if (existing) return res.status(400).json({ message: "Already clocked in for today." });

    const attendance = await Attendance.create({
      user: userId,
      date: today,
      clockIn: new Date()
    });

    res.status(201).json(attendance);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- CLOCK OUT ---
exports.clockOut = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = moment().format("YYYY-MM-DD");

    const record = await Attendance.findOne({ user: userId, date: today, clockOut: null });
    if (!record) return res.status(404).json({ message: "Active session not found." });

    record.clockOut = new Date();
    
    // Calculate total time
    const diffMs = record.clockOut - record.clockIn;
    record.totalWorkingMinutes = Math.floor(diffMs / 1000 / 60);

    await record.save();
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- GET STATUS ---
exports.getTodayStatus = async (req, res) => {
  try {
    const today = moment().format("YYYY-MM-DD");
    const record = await Attendance.findOne({ user: req.user.id, date: today });
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- ADMIN: GET ALL ATTENDANCE ---
exports.getAllAttendance = async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query;
    let query = {};

    // Date Range Filter (Optional)
    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    }

    // Specific User Filter (Optional)
    if (userId) {
      query.user = userId;
    }

    const records = await Attendance.find(query)
      .populate("user", "name email") // Get name/email from User model
      .sort({ date: -1, clockIn: -1 });

    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
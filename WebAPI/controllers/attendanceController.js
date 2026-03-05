const Attendance = require("../models/Attendance");
const User = require("../models/User");
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

// --- ADMIN: GET ALL ATTENDANCE WITH PAGINATION & SEARCH ---
exports.getAllAttendance = async (req, res) => {
  try {
    const { startDate, endDate, userId, search, page = 1, limit = 10 } = req.query;
    let query = {};

    // 1. Employee Name Search (Across Models)
    if (search) {
      // Find users whose names match the search string (case-insensitive)
      const matchedUsers = await User.find({
        name: { $regex: search, $options: "i" }
      }).select("_id");

      // Extract IDs and add to query
      const userIds = matchedUsers.map(u => u._id);
      query.user = { $in: userIds };
    }

    // 2. Date Range Filter
    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    }

    // 3. Specific User Filter (Overrides search if both provided)
    if (userId) {
      query.user = userId;
    }

    // Convert strings to numbers for pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count for pagination metadata
    const totalRecords = await Attendance.countDocuments(query);

    const records = await Attendance.find(query)
      .populate("user", "name email") // Populates the user data into the record
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
const Attendance = require("../models/Attendance");

const todayDate = () => new Date().toISOString().split("T")[0];

// Clock In
exports.clockIn = async (req, res) => {
  try {
    const existing = await Attendance.findOne({
      employeeId: req.user.id,
      date: todayDate(),
    });

    if (existing) return res.status(400).json({ message: "Already clocked in" });

    const record = new Attendance({
      employeeId: req.user.id,
      date: todayDate(),
      clockIn: new Date(),
    });

    await record.save();
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Clock Out
exports.clockOut = async (req, res) => {
  try {
    const record = await Attendance.findOne({
      employeeId: req.user.id,
      date: todayDate(),
    });

    if (!record || record.clockOut)
      return res.status(400).json({ message: "Clock in first" });

    record.clockOut = new Date();

    const diff = (record.clockOut - record.clockIn) / (1000 * 60 * 60);
    record.totalHours = diff.toFixed(2);

    await record.save();
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Employee history
exports.getMyAttendance = async (req, res) => {
  const data = await Attendance.find({ employeeId: req.user.id });
  res.json(data);
};

const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  date: { type: String }, // e.g., "2026-01-25"
  clockIn: Date,
  clockOut: Date,
  totalHours: Number,
}, { timestamps: true });

module.exports = mongoose.model("Attendance", attendanceSchema);

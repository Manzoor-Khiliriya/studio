const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true },
  clockIn: { type: Date, required: true },
  clockOut: { type: Date },
  totalSecondsWorked: { type: Number, default: 0 },
  lastResumeTime: { type: Date },
  status: {
    type: String,
    enum: ['Present', 'Late', 'Half-Day'],
    default: 'Present'
  },
}, { timestamps: true });

module.exports = mongoose.model("Attendance", attendanceSchema);
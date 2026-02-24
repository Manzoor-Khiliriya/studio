const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  clockIn: { type: Date, required: true },
  clockOut: { type: Date },
  totalWorkingMinutes: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['Present', 'Late', 'Half-Day'], 
    default: 'Present' 
  },
}, { timestamps: true });

module.exports = mongoose.model("Attendance", attendanceSchema);
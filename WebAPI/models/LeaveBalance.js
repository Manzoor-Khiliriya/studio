const mongoose = require("mongoose");

const leaveBalanceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  year: { type: Number, required: true },
  type: { type: String, default: "Annual Leave" },
  earned: { type: Number, default: 0 },
  carriedForward: { type: Number, default: 0 },
  initialAdjustment: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model("LeaveBalance", leaveBalanceSchema);
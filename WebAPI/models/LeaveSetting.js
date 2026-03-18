const mongoose = require("mongoose");

const leaveSettingSchema = new mongoose.Schema({
  leaveType: {
    type: String,
    enum: [
      "Annual Leave",
      "Sick Leave",
      "Bereavement Leave",
      "Paternity Leave",
      "Maternity Leave"
    ],
    required: true,
    unique: true
  },
  yearlyQuota: { type: Number, default: 0 },
  accrualRate: { type: Number, default: 0 },
  carryForwardLimit: { type: Number, default: 0 },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

module.exports = mongoose.model("LeaveSetting", leaveSettingSchema);
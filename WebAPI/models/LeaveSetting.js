const mongoose = require("mongoose");

const leaveSettingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  annualLeaveRate: { type: Number, default: 1.5 },
  yearlySickQuota: { type: Number, default: 18 },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

module.exports = mongoose.model("LeaveSetting", leaveSettingSchema);
const mongoose = require("mongoose");

const leaveSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

  type: {
    type: String,
    enum: ["Annual Leave", "Sick Leave", "Personal Leave", "Maternity Leave", "Unpaid Leave", "Other Leave"],
    required: true
  },

  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },

  reason: { type: String, required: true, trim: true },

  status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },

  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  adminComment: { type: String, trim: true }

}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

leaveSchema.pre("validate", function(next) {
  if (this.endDate < this.startDate) {
    next(new Error("End date cannot be before start date"));
  }
  next();
});

module.exports = mongoose.model("Leave", leaveSchema);

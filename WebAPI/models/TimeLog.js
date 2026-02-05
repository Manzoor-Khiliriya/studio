const mongoose = require("mongoose");

const timeLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  task: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true, index: true },

  startTime: { type: Date, required: true },
  endTime: { type: Date },

  durationSeconds: { type: Number, default: 0 },

  logType: { type: String, enum: ["work", "break"], default: "work" },
  isRunning: { type: Boolean, default: true },

  dateString: {
    type: String,
    required: true,
    index: true
  }

}, { timestamps: true });

/**
 * Compound index for fast dashboard queries
 */
timeLogSchema.index({ user: 1, dateString: 1 });
timeLogSchema.index({ task: 1, user: 1 });

/**
 * Auto-set dateString + duration
 */
timeLogSchema.pre("save", function (next) {
  // Ensure dateString always matches startTime
  if (this.startTime) {
    this.dateString = this.startTime.toISOString().split("T")[0];
  }

  // Calculate duration if session ended
  if (this.endTime && this.startTime) {
    const diff = (this.endTime - this.startTime) / 1000;
    this.durationSeconds = Math.max(0, Math.round(diff));
    this.isRunning = false;
  }

  next();
});

/**
 * Virtual: duration in HOURS (for task progress system)
 */
timeLogSchema.virtual("durationHours").get(function () {
  return +(this.durationSeconds / 3600).toFixed(2);
});

module.exports = mongoose.model("TimeLog", timeLogSchema);

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
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

/**
 * Compound indexes
 */
timeLogSchema.index({ user: 1, dateString: 1 });
timeLogSchema.index({ task: 1, user: 1 });

/**
 * FIX: Use "validate" instead of "save"
 * This ensures dateString is set BEFORE Mongoose checks if it's required.
 * Also, we removed the "next" callback to avoid the "next is not a function" error.
 */
timeLogSchema.pre("validate", function () {
  // 1. Set dateString automatically from startTime
  if (this.startTime && !this.dateString) {
    this.dateString = new Date(this.startTime).toISOString().split("T")[0];
  }

  // 2. Calculate duration if session ended
  if (this.endTime && this.startTime) {
    const diff = (new Date(this.endTime) - new Date(this.startTime)) / 1000;
    this.durationSeconds = Math.max(0, Math.round(diff));
    this.isRunning = false;
  }
});

/**
 * Virtual: duration in HOURS
 */
timeLogSchema.virtual("durationHours").get(function () {
  return +(this.durationSeconds / 3600).toFixed(2);
});

module.exports = mongoose.model("TimeLog", timeLogSchema);
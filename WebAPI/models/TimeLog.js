const mongoose = require("mongoose");

const timeLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Task",
    required: true,
    index: true
  },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  durationSeconds: { type: Number, default: 0 },
  logType: { type: String, enum: ["work", "break"], default: "work" },
  isRunning: { type: Boolean, default: true },
  // Normalized date (YYYY-MM-DD) for grouping in reports
  dateString: {
    type: String,
    required: true,
    default: () => new Date().toISOString().split('T')[0],
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index for fast daily lookups per user
timeLogSchema.index({ user: 1, dateString: 1 });

// Virtual to match your Task Model's minute-based logic
timeLogSchema.virtual("durationMinutes").get(function () {
  return Math.round(this.durationSeconds / 60);
});

// Pre-save calculation
timeLogSchema.pre("save", async function () {
  if (this.endTime && this.startTime) {
    this.durationSeconds = Math.round((this.endTime - this.startTime) / 1000);
    this.isRunning = false;
  }
});

module.exports = mongoose.model("TimeLog", timeLogSchema);
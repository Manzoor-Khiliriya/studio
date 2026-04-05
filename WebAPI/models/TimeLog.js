const mongoose = require("mongoose");

const timeLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  task: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true, index: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  durationSeconds: { type: Number, default: 0 },
  rawDurationSeconds: { type: Number, default: 0 },
  logType: { type: String, enum: ["work", "break"], default: "work" },
  action: {
    type: String,
    enum: ["Start", "Stop", null],
    default: null
  },
  isRunning: { type: Boolean, default: true },
  dateString: {
    type: String,
    required: true,
    index: true
  },
  clearedByAdmin: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

timeLogSchema.index({ user: 1, dateString: 1 });
timeLogSchema.index({ task: 1, user: 1 });

timeLogSchema.pre("validate", function () {
  if (this.startTime && !this.dateString) {
    this.dateString = new Date(this.startTime).toISOString().split("T")[0];
  }

  if (this.endTime && this.startTime) {
    const diff = Math.max(0, Math.round((new Date(this.endTime) - new Date(this.startTime)) / 1000));

    // Always store raw
    if (!this.rawDurationSeconds) {
      this.rawDurationSeconds = diff;
    }

    // Only set duration if not manually set (proficiency case)
    if (!this.durationSeconds) {
      this.durationSeconds = diff;
    }

    this.isRunning = false;
  }
});

timeLogSchema.virtual("durationHours").get(function () {
  return +(this.durationSeconds / 3600).toFixed(2);
});

module.exports = mongoose.model("TimeLog", timeLogSchema);
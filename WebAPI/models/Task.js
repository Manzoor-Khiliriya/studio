const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  projectNumber: { type: String, required: true, unique: true, trim: true },
  projectDetails: { type: String },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

  estimatedTime: { type: Number, required: true },  // HOURS
  allocatedTime: { type: Number, required: true },  // HOURS

  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },

  priority: { type: String, enum: ["Low", "Medium", "High"], default: "Medium" },
  status: { type: String, enum: ["Pending", "In Progress", "Completed", "Overdue"], default: "Pending" }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

taskSchema.virtual("timeLogs", {
  ref: "TimeLog",
  localField: "_id",
  foreignField: "task"
});

// Convert seconds → HOURS
taskSchema.virtual("totalConsumedHours").get(function () {
  if (!this.timeLogs) return 0;
  const totalSeconds = this.timeLogs.reduce((a, l) => a + (l.durationSeconds || 0), 0);
  return +(totalSeconds / 3600).toFixed(2);
});

taskSchema.virtual("progressPercent").get(function () {
  if (!this.allocatedTime) return 0;
  return Math.min(100, Math.round((this.totalConsumedHours / this.allocatedTime) * 100));
});

module.exports = mongoose.model("Task", taskSchema);

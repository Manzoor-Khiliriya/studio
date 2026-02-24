const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  projectNumber: { type: String, required: true, unique: true, trim: true },
  projectDetails: { type: String },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "Employee" }],

  estimatedTime: { type: Number, required: true },  // HOURS
  allocatedTime: { type: Number, required: true },  // HOURS

  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },

  priority: { type: String, enum: ["Low", "Medium", "High"], default: "Medium" },

  liveStatus: { 
    type: String, 
    enum: ["To be started", "In progress"], 
    default: "To be started" 
  },

  status: { 
    type: String, 
    enum: [
      "On hold", 
      "Feedback pending", 
      "Final rendering", 
      "Postproduction", 
      "Completed", 
    ], 
    default: "On hold" 
  },

  activeStatus: {
    type: String,
    enum: [
      "Draft-1", "Draft-2", "Draft-3", "Draft-4", "Draft-5",
      "Pre-Final", "Final"
    ],
    default: "Draft-1"
  }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// --- Virtuals ---

taskSchema.virtual("timeLogs", {
  ref: "TimeLog",
  localField: "_id",
  foreignField: "task"
});

taskSchema.virtual("totalConsumedHours").get(function () {
  if (!this.timeLogs || this.timeLogs.length === 0) return 0;

  const totalSeconds = this.timeLogs
    .filter(log => log.logType === "work")
    .reduce((a, l) => a + (l.durationSeconds || 0), 0);

  return +(totalSeconds / 3600).toFixed(2);
});

taskSchema.virtual("progressPercent").get(function () {
  if (!this.allocatedTime) return 0;
  return Math.min(100, Math.round((this.totalConsumedHours / this.allocatedTime) * 100));
});

module.exports = mongoose.model("Task", taskSchema);
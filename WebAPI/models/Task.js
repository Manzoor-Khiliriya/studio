const mongoose = require("mongoose");

// --- WORK LOG SCHEMA ---
const workLogSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  totalMinutesConsumed: { type: Number, default: 0 },
  isTimerRunning: { type: Boolean, default: false },
  lastStartTime: { type: Date },
  sessions: [{
    startTime: Date,
    endTime: Date,
    duration: Number
  }]
});

// --- TASK SCHEMA ---
const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  projectNumber: { type: String, required: true, unique: true },
  projectDetails: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  assignedTo: [workLogSchema],

  estimatedTime: { type: Number, required: true }, // Theoretical (Date-based)
  allocatedTime: { type: Number, required: true }, // Manual Admin Budget
  
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  assignmentDate: { type: Date, default: Date.now },

  priority: {
    type: String,
    enum: ["Low", "Medium", "High"],
    default: "Medium"
  },
  status: {
    type: String,
    enum: ["Pending", "In Progress", "Completed", "Overdue"],
    default: "Pending"
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

/* --- UPDATED VIRTUALS --- */

// Calculate total time spent by all employees on this task
taskSchema.virtual("totalConsumedTime").get(function () {
  if (!this.assignedTo) return 0;
  return this.assignedTo.reduce((acc, curr) => acc + (curr.totalMinutesConsumed || 0), 0);
});

// NEW: Progress percentage based on ALLOCATED time (Admin's budget)
taskSchema.virtual("progressPercent").get(function () {
  // If no time is allocated, we can't calculate progress
  if (!this.allocatedTime || this.allocatedTime === 0) return 0;
  
  const percent = (this.totalConsumedTime / this.allocatedTime) * 100;
  
  // We round it, but we DON'T cap it at 100 here so the Admin 
  // can see if the team is at 110% or 120% (Overtime)
  return Math.round(percent);
});

// NEW: Check if the task has exceeded the Admin's allocated budget
taskSchema.virtual("isOverBudget").get(function () {
  return this.totalConsumedTime > this.allocatedTime;
});

module.exports = mongoose.model("Task", taskSchema);
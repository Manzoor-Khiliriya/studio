const mongoose = require("mongoose");

const taskAllocationSchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    role: {
      type: String,
      trim: true,
      enum: ["Main", "Support"],
      default: "Main",
    },
    priorityOrder: {
      type: Number,
      required: true,
      min: 1,
    },
    dailyAllocations: [
      {
        date: String,
        allocatedSeconds: Number,
        proficiency: { type: Number, default: null },
        workedSeconds: { type: Number, default: 0 }, 
        isClosed: { type: Boolean, default: false },
        assignedAt: { type: Date, default: Date.now },
        closedAt: { type: Date, default: null },
      },
    ],
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("TaskAllocation", taskAllocationSchema);

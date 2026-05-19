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
    allocatedHours: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("TaskAllocation", taskAllocationSchema);

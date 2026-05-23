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
        allocatedHours: Number,
      },
    ],
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("TaskAllocation", taskAllocationSchema);

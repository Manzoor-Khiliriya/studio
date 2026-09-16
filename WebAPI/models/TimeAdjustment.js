const mongoose = require("mongoose");

const timeAdjustmentRequestSchema = new mongoose.Schema(
  {
    timeLog: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TimeLog",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
    },

    originalEndTime: { type: Date, required: true },

    requestedEndTime: { type: Date, required: true },

    reason: { type: String, required: true, trim: true },

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
      index: true,
    },

    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
    adminNote: { type: String, trim: true },
  },
  { timestamps: true },
);

timeAdjustmentRequestSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model(
  "TimeAdjustmentRequest",
  timeAdjustmentRequestSchema,
);

const mongoose = require("mongoose");

const taskStatusSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["status", "activeStatus"],
      required: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["Enable", "Disable"],
      default: "Enable",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("TaskStatus", taskStatusSchema);

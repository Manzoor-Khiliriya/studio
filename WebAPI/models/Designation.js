const mongoose = require("mongoose");

const designationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["Enable", "Disable"],
      default: "Enable",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Designation", designationSchema);

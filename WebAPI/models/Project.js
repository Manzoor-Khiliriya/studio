const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  project_code: { type: String, required: true, unique: true, uppercase: true },
  title: { type: String, required: true },
  clientName: { type: String },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ["Active", "Inactive"], default: "Active" }
}, { timestamps: true });

module.exports = mongoose.model("Project", projectSchema);
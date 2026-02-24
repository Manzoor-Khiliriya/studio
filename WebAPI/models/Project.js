const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  projectNumber: { type: String, required: true, unique: true, uppercase: true },
  title: { type: String, required: true },
  description: { type: String },
  clientName: { type: String },
  status: { type: String, default: "In Progress" }
}, { timestamps: true });

module.exports = mongoose.model("Project", projectSchema);
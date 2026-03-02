const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  project_code: { type: String, required: true, unique: true, uppercase: true },
  title: { type: String, required: true },
  clientName: { type: String },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ["Active", "Inactive"], default: "Active" }
}, { 
  timestamps: true,
  // CRITICAL: This allows virtuals to show up in your JSON response
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// VIRTUAL POPULATE: 
// This tells Mongoose to look into the "Task" collection
// and find all tasks where "project" ID matches this Project's "_id"
projectSchema.virtual('tasks', {
  ref: 'Task',           // The name of your Task model
  localField: '_id',     // The field in THIS Project model
  foreignField: 'project' // The field in the TASK model that points to the project
});

module.exports = mongoose.model("Project", projectSchema);
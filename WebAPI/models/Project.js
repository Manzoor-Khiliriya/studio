const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  projectCode: { type: String, required: true, unique: true, uppercase: true },
  projectType: { type: String, enum: ["Standard", "Revision"], required: true },
  title: { type: String, required: true },
  clientName: { type: String },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ["Active", "On hold", "Submitted", "Inactive"], 
    default: "Active" 
  },
  statusChangedAt: { type: Date }, 
  deleteStatus: { type: String, enum: ["Enable", "Disable"], default: "Disable" },
  invoiceNumber: { type: String },
  invoiceDate: { type: Date }, 
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

projectSchema.pre('save', async function() {
  if (this.isModified('status')) {
    this.statusChangedAt = new Date();
  }
});

projectSchema.virtual('tasks', {
  ref: 'Task',           
  localField: '_id',     
  foreignField: 'project' 
});

module.exports = mongoose.model("Project", projectSchema);
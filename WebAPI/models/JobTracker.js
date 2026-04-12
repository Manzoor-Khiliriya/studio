const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
  name: String,
  lastRun: Date
});

module.exports = mongoose.model("JobTracker", jobSchema);
const cron = require("node-cron");
const Project = require("../models/Project"); // Update these paths to match your folders
const Task = require("../models/Task");
const TimeLog = require("../models/TimeLog");
const Attendance = require("../models/Attendance");
const Leave = require("../models/Leave");

// Function to calculate the "13 months ago" date
const getCutoffDate = () => {
  const d = new Date();
  d.setMonth(d.getMonth() - 13);
  return d;
};

// This schedules the task to run every day at Midnight (00:00)
cron.schedule("0 0 * * *", async () => {
  console.log("--- STARTING AUTOMATIC 13-MONTH DATA CLEANUP ---");
  const cutoff = getCutoffDate();

  try {
    // 1. PROJECT-BASED CLEANUP
    // Only delete projects that are "Inactive" AND older than 13 months
    const expiredProjects = await Project.find({
      status: "Inactive",
      updatedAt: { $lt: cutoff }
    }).select("_id");

    if (expiredProjects.length > 0) {
      const pIds = expiredProjects.map(p => p._id);

      // Find tasks linked to these projects
      const tasks = await Task.find({ project: { $in: pIds } }).select("_id");
      const tIds = tasks.map(t => t._id);

      // DELETE: TimeLogs -> Tasks -> Projects (In that order)
      await TimeLog.deleteMany({ task: { $in: tIds } });
      await Task.deleteMany({ project: { $in: pIds } });
      await Project.deleteMany({ _id: { $in: pIds } });
      
      console.log(`Successfully purged ${pIds.length} expired projects.`);
    }

    // 2. ATTENDANCE CLEANUP (Clock-in / Clock-out)
    // Deletes general attendance older than 13 months
    const attendancePurge = await Attendance.deleteMany({
      clockIn: { $lt: cutoff }
    });
    console.log(`Purged ${attendancePurge.deletedCount} old attendance records.`);

    // 3. LEAVE CLEANUP
    const leavePurge = await Leave.deleteMany({
      endDate: { $lt: cutoff },
      status: { $ne: "Pending" }
    });
    console.log(`Purged ${leavePurge.deletedCount} old leave records.`);

    console.log("--- CLEANUP COMPLETED SUCCESSFULLY ---");
  } catch (error) {
    console.error("CRON ERROR:", error);
  }
});
const cron = require("node-cron");
const Project = require("../models/Project");
const Task = require("../models/Task");
const TimeLog = require("../models/TimeLog");
const Attendance = require("../models/Attendance");
const Leave = require("../models/Leave");

const getCutoffDate = () => {
  const d = new Date();
  d.setMonth(d.getMonth() - 13);
  return d;
};

cron.schedule("0 0 * * *", async () => {
  console.log("--- STARTING AUTOMATIC 13-MONTH DATA CLEANUP ---");
  const cutoff = getCutoffDate();

  try {
    const expiredProjects = await Project.find({
      deleteStatus: "Disable",
      updatedAt: { $lt: cutoff }
    }).select("_id");

    if (expiredProjects.length > 0) {
      const pIds = expiredProjects.map(p => p._id);

      const tasks = await Task.find({ project: { $in: pIds } }).select("_id");
      const tIds = tasks.map(t => t._id);

      await TimeLog.deleteMany({ task: { $in: tIds } });
      await Task.deleteMany({ project: { $in: pIds } });
      await Project.deleteMany({ _id: { $in: pIds } });
      
      console.log(`Successfully purged ${pIds.length} expired projects.`);
    }

    const attendancePurge = await Attendance.deleteMany({
      clockIn: { $lt: cutoff }
    });
    console.log(`Purged ${attendancePurge.deletedCount} old attendance records.`);

    // const leavePurge = await Leave.deleteMany({
    //   endDate: { $lt: cutoff },
    //   status: { $ne: "Pending" }
    // });
    // console.log(`Purged ${leavePurge.deletedCount} old leave records.`);

    console.log("--- CLEANUP COMPLETED SUCCESSFULLY ---");
  } catch (error) {
    console.error("CRON ERROR:", error);
  }
});
const cron = require("node-cron");
const Project = require("../models/Project");
const Task = require("../models/Task");
const TimeLog = require("../models/TimeLog");
const Attendance = require("../models/Attendance");
const Leave = require("../models/Leave");
const LeaveBalance = require("../models/LeaveBalance");
const LeaveSetting = require("../models/LeaveSetting");
const User = require("../models/User");
const JobTracker = require("../models/JobTracker");
const Notification = require("../models/Notification");

const { calculateLeaveDays } = require("../utils/leaveHelpers");
const { now } = require("../utils/dateHelper");

//
// 🔥 HELPER (timezone-safe)
//
const getCutoffDate = () => {
  const d = now();
  d.setMonth(d.getMonth() - 13);
  return d;
};

//
// 🔥 1. CLEANUP (SAFE)
//
async function runCleanupSafe() {
  const currentTime = now();

  const job = await JobTracker.findOne({ name: "data-cleanup" });

  if (job?.lastRun) {
    const last = new Date(job.lastRun);

    if (
      last.getFullYear() === currentTime.getFullYear() &&
      last.getMonth() === currentTime.getMonth() &&
      last.getDate() === currentTime.getDate()
    ) {
      console.log("⏭ Cleanup already ran today");
      return;
    }
  }

  console.log("🧹 Running cleanup...");

  const cutoff = getCutoffDate();

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
  }

  await Attendance.deleteMany({
    clockIn: { $lt: cutoff }
  });

  const oneMonthAgo = now();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  const notificationResult = await Notification.deleteMany({
    createdAt: { $lt: oneMonthAgo },
    read: true
  });

  console.log(`🗑 Deleted ${notificationResult.deletedCount} old read notifications.`);

  await JobTracker.findOneAndUpdate(
    { name: "data-cleanup" },
    { lastRun: currentTime },
    { upsert: true }
  );

  console.log("✅ Cleanup done");
}

//
// 🔥 2. MONTHLY ACCRUAL (SAFE)
//
async function runMonthlyAccrualSafe() {
  const currentTime = now();

  const job = await JobTracker.findOne({ name: "monthly-accrual" });

  if (job?.lastRun) {
    const last = new Date(job.lastRun);

    if (
      last.getFullYear() === currentTime.getFullYear() &&
      last.getMonth() === currentTime.getMonth()
    ) {
      console.log("⏭ Monthly accrual already ran");
      return;
    }
  }

  console.log("🚀 Running monthly accrual...");

  const users = await User.find({ role: "Employee" });
  const setting = await LeaveSetting.findOne({ leaveType: "Annual Leave" });

  const currentYear = currentTime.getFullYear();
  const rate = setting?.accrualRate || 0;

  for (const user of users) {
    await LeaveBalance.findOneAndUpdate(
      {
        user: user._id,
        year: currentYear,
        type: "Annual Leave"
      },
      {
        $inc: { earned: rate }
      },
      { upsert: true }
    );
  }

  await JobTracker.findOneAndUpdate(
    { name: "monthly-accrual" },
    { lastRun: currentTime },
    { upsert: true }
  );

  console.log("✅ Monthly accrual done");
}

//
// 🔥 3. YEARLY CARRY FORWARD (SAFE)
//
async function runYearlyCarryForwardSafe() {
  const currentTime = now();

  const job = await JobTracker.findOne({ name: "yearly-carry-forward" });

  if (job?.lastRun) {
    const last = new Date(job.lastRun);

    if (last.getFullYear() === currentTime.getFullYear()) {
      console.log("⏭ Carry forward already ran");
      return;
    }
  }

  console.log("🚀 Running yearly carry forward...");

  const users = await User.find({ role: "Employee" });
  const setting = await LeaveSetting.findOne({ leaveType: "Annual Leave" });

  const currentYear = currentTime.getFullYear();
  const nextYear = currentYear + 1;

  for (const user of users) {
    const balance = await LeaveBalance.findOne({
      user: user._id,
      year: currentYear,
      type: "Annual Leave"
    });

    const earned = balance?.earned || 0;

    const leaves = await Leave.find({
      user: user._id,
      type: "Annual Leave",
      status: "Approved",
      startDate: {
        $gte: new Date(`${currentYear}-01-01`),
        $lte: new Date(`${currentYear}-12-31`)
      }
    });

    let taken = 0;
    for (const l of leaves) {
      taken += await calculateLeaveDays(l.startDate, l.endDate);
    }

    const remaining = earned - taken;

    const carryForward = Math.min(
      Math.max(0, remaining),
      setting?.carryForwardLimit || 0
    );

    await LeaveBalance.findOneAndUpdate(
      {
        user: user._id,
        year: nextYear,
        type: "Annual Leave"
      },
      {
        earned: 0,
        carriedForward: carryForward
      },
      { upsert: true }
    );
  }

  await JobTracker.findOneAndUpdate(
    { name: "yearly-carry-forward" },
    { lastRun: currentTime },
    { upsert: true }
  );

  console.log("✅ Carry forward done");
}

//
// 🔥 CRON SCHEDULES (IST SAFE)
//
cron.schedule("0 0 * * *", runCleanupSafe, {
  timezone: "Asia/Kolkata"
});

cron.schedule("0 0 1 * *", runMonthlyAccrualSafe, {
  timezone: "Asia/Kolkata"
});

cron.schedule("0 1 1 1 *", runYearlyCarryForwardSafe, {
  timezone: "Asia/Kolkata"
});

//
// 🔥 SAFE FALLBACK (on server restart)
//
(async () => {
  const currentTime = now();

  await runCleanupSafe();

  if (currentTime.getDate() === 1) {
    await runMonthlyAccrualSafe();
  }

  if (currentTime.getDate() === 1 && currentTime.getMonth() === 0) {
    await runYearlyCarryForwardSafe();
  }
})();
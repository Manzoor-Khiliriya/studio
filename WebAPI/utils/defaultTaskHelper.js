const Task = require("../models/Task");
const TimeLog = require("../models/TimeLog");
const Employee = require("../models/Employee");
const { now: getCurrentTime, getToday } = require("./dateHelper");

const getDefaultTaskProjectTime = async (projectId, defaultTaskId) => {
  try {
    const projectTasks = await Task.find({
      project: projectId,
    })
      .select("_id")
      .lean();

    const taskIds = projectTasks.map((task) => task._id);

    if (!taskIds.length) {
      return {
        totalConsumedSeconds: 0,
        totalRawConsumedSeconds: 0,
        totalConsumedHours: 0,
        totalRawConsumedHours: 0,
        liveStatus: "To be started",
      };
    }

    const logs = await TimeLog.find({
      task: { $in: taskIds },
      logType: "work",
    })
      .select(
        "task user durationSeconds rawDurationSeconds isRunning startTime endTime dateString", // 🔥 added "task" field
      )
      .lean();

    if (!logs.length) {
      return {
        totalConsumedSeconds: 0,
        totalRawConsumedSeconds: 0,
        totalConsumedHours: 0,
        totalRawConsumedHours: 0,
        liveStatus: "To be started",
      };
    }

    let totalConsumedSeconds = 0;
    let totalRawConsumedSeconds = 0;

    const runningLogs = [];

    for (const log of logs) {
      if (log.isRunning) {
        runningLogs.push(log);
        continue;
      }

      totalConsumedSeconds += log.durationSeconds || 0;
      totalRawConsumedSeconds += log.rawDurationSeconds || 0;
    }

    if (runningLogs.length) {
      const userIds = [
        ...new Set(
          runningLogs.map((log) => log.user?.toString()).filter(Boolean),
        ),
      ];

      const employees = await Employee.find({
        user: { $in: userIds },
      })
        .select("user proficiency")
        .lean();

      const proficiencyMap = new Map(
        employees.map((employee) => [
          employee.user.toString(),
          typeof employee.proficiency === "number" ? employee.proficiency : 100,
        ]),
      );

      const now = getCurrentTime();

      for (const log of runningLogs) {
        if (!log.startTime) continue;

        const rawSeconds = Math.max(
          0,
          Math.floor((now - new Date(log.startTime).getTime()) / 1000),
        );

        const proficiency = proficiencyMap.get(log.user?.toString()) ?? 100;

        const adjustedSeconds = Math.round(rawSeconds * (proficiency / 100));

        totalRawConsumedSeconds += rawSeconds;
        totalConsumedSeconds += adjustedSeconds;
      }
    }

    const today = getToday();
    const defaultTaskIdStr = defaultTaskId?.toString();

    const ownLogs = defaultTaskIdStr
      ? logs.filter((log) => log.task?.toString() === defaultTaskIdStr)
      : [];

    const isRunningToday = ownLogs.some(
      (log) => log.isRunning && log.dateString === today,
    );

    const hasWorked = ownLogs.some((log) => (log.durationSeconds || 0) > 0);

    const liveStatus = isRunningToday
      ? "In progress"
      : hasWorked
        ? "Started"
        : "To be started";

    return {
      totalConsumedSeconds,
      totalRawConsumedSeconds,

      totalConsumedHours: totalConsumedSeconds / 3600,

      totalRawConsumedHours: totalRawConsumedSeconds / 3600,

      liveStatus,
    };
  } catch (error) {
    console.error("getDefaultTaskProjectTime Error:", error);

    throw error;
  }
};

module.exports = {
  getDefaultTaskProjectTime,
};

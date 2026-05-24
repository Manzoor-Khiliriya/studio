const Task = require("../models/Task");
const Employee = require("../models/Employee");
const TaskAllocation = require("../models/TaskAllocation");
const { getToday } = require("../utils/dateHelper");

const emitEvent = (req, event, data, userIds = []) => {
  const io = req.app.get("socketio");
  if (!io) return;
  if (userIds.length) {
    userIds.forEach((id) => {
      io.to(id.toString()).emit(event, data);
    });
  } else {
    io.emit(event, data);
  }
};

exports.updateTaskAllocation = async (req, res) => {
  try {
    const {
      role,
      priorityOrder,
      hours = 0,
      minutes = 0,
      seconds = 0,
    } = req.body;
    const allocatedSeconds = hours * 3600 + minutes * 60 + seconds;
    const today = getToday();

    const allocation = await TaskAllocation.findById(req.params.id);
    if (!allocation)
      return res
        .status(404)
        .json({ success: false, message: "Allocation not found" });

    if (role !== undefined) allocation.role = role;
    if (priorityOrder !== undefined) allocation.priorityOrder = priorityOrder;

    const existingIndex = allocation.dailyAllocations.findIndex(
      (d) => d.date === today,
    );
    if (existingIndex > -1) {
      allocation.dailyAllocations[existingIndex].allocatedSeconds =
        allocatedSeconds;
    } else {
      allocation.dailyAllocations.push({ date: today, allocatedSeconds });
    }

    await allocation.save();
    emitEvent(req, "allocationChanged", { taskId: allocation.task });
    return res
      .status(200)
      .json({ success: true, message: "Allocation updated", allocation });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

exports.getEmployeeAllocations = async (req, res) => {
  try {
    const allocations = await TaskAllocation.find()
      .populate({
        path: "employee",
        populate: {
          path: "user",
          select: "name",
        },
      })
      .populate({
        path: "task",
        select: "title project timelogs",

        populate: [
          {
            path: "project",
            select: "title projectCode",
          },

          {
            path: "timeLogs",
            select:
              "rawDurationSeconds dateString user logType isRunning startTime",
          },
        ],
      });

    const grouped = {};

    allocations.forEach((allocation) => {
      const employeeId = allocation.employee?._id?.toString();

      if (!employeeId) return;

      if (!grouped[employeeId]) {
        grouped[employeeId] = {
          employee: allocation.employee,

          tasks: [],
        };
      }

      const today = getToday();

      const todayWorkedSeconds = (allocation.task?.timeLogs || [])
        .filter(
          (log) =>
            log.user?.toString() === allocation.employee.user._id.toString() &&
            log.dateString === today &&
            log.logType === "work",
        )
        .reduce((acc, log) => {
          if (log.isRunning) {
            const liveSeconds = Math.floor(
              (Date.now() - new Date(log.startTime).getTime()) / 1000,
            );
            return acc + Math.max(0, liveSeconds);
          }
          return acc + (log.rawDurationSeconds || 0);
        }, 0);

      // with this
      const workedHours = todayWorkedSeconds / 3600;
      const h = Math.floor(todayWorkedSeconds / 3600);
      const m = Math.floor((todayWorkedSeconds % 3600) / 60);
      const s = todayWorkedSeconds % 60;

      allocation._doc.todayWorkedFormatted = `${h}h ${m}m ${s}s`;
      allocation._doc.todayWorkedHours = workedHours;
      const todayAllocation = allocation.dailyAllocations?.find(
        (d) => d.date === today,
      );
      const todayAllocatedSeconds = todayAllocation?.allocatedSeconds ?? 0;
      allocation._doc.isCurrentlyWorking = (
        allocation.task?.timeLogs || []
      ).some(
        (log) =>
          log.user?.toString() === allocation.employee.user._id.toString() &&
          log.isRunning === true &&
          log.logType === "work",
      );

      const ah = Math.floor(todayAllocatedSeconds / 3600);
      const am = Math.floor((todayAllocatedSeconds % 3600) / 60);
      const as_ = todayAllocatedSeconds % 60;

      const overWorkedSeconds = Math.max(
        0,
        todayWorkedSeconds - todayAllocatedSeconds,
      );
      const oh = Math.floor(overWorkedSeconds / 3600);
      const om = Math.floor((overWorkedSeconds % 3600) / 60);
      const os = overWorkedSeconds % 60;

      allocation._doc.todayAllocatedFormatted = `${ah}h ${am}m ${as_}s`;
      allocation._doc.todayAllocatedSeconds = todayAllocatedSeconds;
      allocation._doc.isOverWorked = todayWorkedSeconds > todayAllocatedSeconds;
      allocation._doc.overWorkedFormatted = `${oh}h ${om}m ${os}s`;

      grouped[employeeId].tasks.push(allocation);
    });

    return res.status(200).json({
      success: true,
      employees: Object.values(grouped),
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

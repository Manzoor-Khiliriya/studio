const TaskAllocation = require("../models/TaskAllocation");
const { getToday } = require("../utils/dateHelper");
const { computeWorkedSeconds, calculateProficiency } = require("../utils/proficiencyHelper");

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
    const requestedDate = req.query.date || getToday();
    const employeeNameFilter = (req.query.employeeName || "").trim().toLowerCase();
    const today = getToday();
    const isToday = requestedDate === today;

    const allocations = await TaskAllocation.find()
      .populate({
        path: "employee",
        populate: {
          path: "user",
          select: "name role designation",
          populate: { path: "designation", select: "name" },
        },
      })
      .populate({
        path: "task",
        select: "title project timelogs status activeStatus",
        populate: [
          {
            path: "project",
            select: "title projectType status deleteStatus",
            populate: { path: "projectType", select: "name" },
          },
          {
            path: "timeLogs",
            select: "rawDurationSeconds dateString user logType isRunning startTime",
          },
          { path: "status", select: "name type" },
          { path: "activeStatus", select: "name type" },
        ],
      });

    const validAllocations = allocations.filter((allocation) => {
      const project = allocation.task?.project;
      const role = allocation.employee?.user?.role;

      if (role === "Admin") return false;
      if (!project) return false;

      if (isToday) {
        if (project.deleteStatus === "Enable") return false;
        if (["Submitted", "Inactive", "On hold"].includes(project.status)) return false;
      }

      return true;
    });

    const grouped = {};
    const bulkOps = [];

    validAllocations.forEach((allocation) => {
      const employeeId = allocation.employee?._id?.toString();
      if (!employeeId) return;

      // Name filter — skip this allocation's employee entirely if it
      // doesn't match. Doing this early avoids doing all the
      // formatting/proficiency work for employees we won't return.
      if (employeeNameFilter) {
        const empName = (allocation.employee?.user?.name || "").toLowerCase();
        if (!empName.includes(employeeNameFilter)) return;
      }

      const workedSeconds = computeWorkedSeconds(allocation, requestedDate);
      const dayAllocation = allocation.dailyAllocations?.find(
        (d) => d.date === requestedDate,
      );
      const allocatedSeconds = dayAllocation?.allocatedSeconds ?? 0;

      if (!isToday && workedSeconds === 0 && allocatedSeconds === 0) {
        return;
      }

      if (!grouped[employeeId]) {
        grouped[employeeId] = { employee: allocation.employee, tasks: [] };
      }

      const workedHours = workedSeconds / 3600;

      const h = Math.floor(workedSeconds / 3600);
      const m = Math.floor((workedSeconds % 3600) / 60);
      const s = workedSeconds % 60;

      allocation._doc.todayWorkedFormatted = `${h}h ${m}m ${s}s`;
      allocation._doc.todayWorkedHours = workedHours;

      allocation._doc.isCurrentlyWorking = isToday && (allocation.task?.timeLogs || []).some(
        (log) =>
          log.user?.toString() === allocation.employee.user._id.toString() &&
          log.isRunning === true &&
          log.logType === "work",
      );

      const ah = Math.floor(allocatedSeconds / 3600);
      const am = Math.floor((allocatedSeconds % 3600) / 60);
      const as_ = allocatedSeconds % 60;

      const overWorkedSeconds = Math.max(0, workedSeconds - allocatedSeconds);
      const oh = Math.floor(overWorkedSeconds / 3600);
      const om = Math.floor((overWorkedSeconds % 3600) / 60);

      allocation._doc.todayAllocatedFormatted = `${ah}h ${am}m ${as_}s`;
      allocation._doc.todayAllocatedSeconds = allocatedSeconds;
      allocation._doc.isOverWorked = workedSeconds > allocatedSeconds;
      allocation._doc.overWorkedFormatted = `${oh}h ${om}m`;

      if (isToday) {
        const proficiency = calculateProficiency(workedHours, allocatedSeconds);
        allocation._doc.proficiency = proficiency;

        if (dayAllocation) {
          bulkOps.push({
            updateOne: {
              filter: { _id: allocation._id, "dailyAllocations.date": requestedDate },
              update: { $set: { "dailyAllocations.$.proficiency": proficiency } },
            },
          });
        }
      } else {
        allocation._doc.proficiency = dayAllocation?.proficiency ?? null;
      }

      grouped[employeeId].tasks.push(allocation);
    });

    if (bulkOps.length) {
      await TaskAllocation.bulkWrite(bulkOps);
    }

    return res.status(200).json({
      success: true,
      employees: Object.values(grouped),
      date: requestedDate,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
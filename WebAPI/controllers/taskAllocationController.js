const TaskAllocation = require("../models/TaskAllocation");
const { getToday } = require("../utils/dateHelper");
const {
  computeWorkedSeconds,
  calculateProficiency,
} = require("../utils/proficiencyHelper");

const emitEvent = (req, event, data, userIds = []) => {
  const io = req.app.get("socketio");
  if (!io) return;
  if (userIds.length) {
    userIds.forEach((id) => io.to(id.toString()).emit(event, data));
  } else {
    io.emit(event, data);
  }
};

const fmt = (sec) => {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${h}h ${m}m ${s}s`;
};

exports.updateTaskAllocation = async (req, res) => {
  try {
    const {
      role,
      priorityOrder,
      hours = 0,
      minutes = 0,
      seconds = 0,
      reassign = true, // false = just correct the current slot's time
    } = req.body;
    const allocatedSeconds = hours * 3600 + minutes * 60 + seconds;
    const today = getToday();

    const allocation = await TaskAllocation.findById(req.params.id);
    if (!allocation)
      return res
        .status(404)
        .json({ success: false, message: "Allocation not found" });

    // populated copy, only used to compute worked time
    const populated = await TaskAllocation.findById(req.params.id)
      .populate({
        path: "employee",
        populate: { path: "user", select: "_id" },
      })
      .populate({
        path: "task",
        select: "timeLogs",
        populate: {
          path: "timeLogs",
          select: "rawDurationSeconds dateString user logType isRunning startTime",
        },
      });

    if (role !== undefined) allocation.role = role;
    if (priorityOrder !== undefined) allocation.priorityOrder = priorityOrder;

    const todaySlots = allocation.dailyAllocations.filter((d) => d.date === today);
    const openSlot = todaySlots.find((d) => !d.isClosed);
    const closedSum = todaySlots
      .filter((d) => d.isClosed)
      .reduce((a, d) => a + (d.workedSeconds || 0), 0);

    const totalWorked = computeWorkedSeconds(populated, today);
    const openWorked = Math.max(0, totalWorked - closedSum);

    const slotIsEmpty =
      openSlot && (openSlot.allocatedSeconds || 0) === 0 && openWorked === 0;

    if (openSlot && reassign && !slotIsEmpty) {
      // freeze the old slot exactly as it is
      openSlot.workedSeconds = openWorked;
      openSlot.proficiency = calculateProficiency(
        openWorked / 3600,
        openSlot.allocatedSeconds || 0,
      );
      openSlot.isClosed = true;
      openSlot.closedAt = new Date();

      // start a new slot
      allocation.dailyAllocations.push({
        date: today,
        allocatedSeconds,
        assignedAt: new Date(),
        isClosed: false,
      });
    } else if (openSlot) {
      openSlot.allocatedSeconds = allocatedSeconds;
    } else {
      allocation.dailyAllocations.push({
        date: today,
        allocatedSeconds,
        assignedAt: new Date(),
        isClosed: false,
      });
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
        if (["Submitted", "Inactive", "On hold"].includes(project.status))
          return false;
      }
      return true;
    });

    const grouped = {};
    const bulkOps = [];

    validAllocations.forEach((allocation) => {
      const employeeId = allocation.employee?._id?.toString();
      if (!employeeId) return;

      if (employeeNameFilter) {
        const empName = (allocation.employee?.user?.name || "").toLowerCase();
        if (!empName.includes(employeeNameFilter)) return;
      }

      const totalWorked = computeWorkedSeconds(allocation, requestedDate);
      const daySlots = (allocation.dailyAllocations || []).filter(
        (d) => d.date === requestedDate,
      );
      const slots = daySlots.length ? daySlots : [null]; // today with no slot yet
      const closedSum = daySlots
        .filter((d) => d.isClosed)
        .reduce((a, d) => a + (d.workedSeconds || 0), 0);

      const isRunningNow =
        isToday &&
        (allocation.task?.timeLogs || []).some(
          (log) =>
            log.user?.toString() === allocation.employee.user._id.toString() &&
            log.isRunning === true &&
            log.logType === "work",
        );

      const base = allocation.toObject();

      slots.forEach((slot, idx) => {
        const isClosed = !!slot?.isClosed;
        const workedSeconds = isClosed
          ? slot.workedSeconds || 0
          : Math.max(0, totalWorked - closedSum);
        const allocatedSeconds = slot?.allocatedSeconds ?? 0;

        if (!isToday && workedSeconds === 0 && allocatedSeconds === 0) return;

        if (!grouped[employeeId]) {
          grouped[employeeId] = { employee: allocation.employee, tasks: [] };
        }

        const workedHours = workedSeconds / 3600;
        const overSeconds = Math.max(0, workedSeconds - allocatedSeconds);
        const diffH = Math.floor(overSeconds / 3600);
        const diffM = Math.floor((overSeconds % 3600) / 60);

        const row = {
          ...base,
          rowKey: `${allocation._id}-${slot?._id ?? "none"}`,
          slotId: slot?._id ?? null,
          slotIndex: idx + 1,
          slotCount: slots.length,
          isClosedSlot: isClosed,
          todayWorkedFormatted: fmt(workedSeconds),
          todayWorkedHours: workedHours,
          todayWorkedSeconds: workedSeconds,
          isCurrentlyWorking: isRunningNow && !isClosed,
          todayAllocatedFormatted: fmt(allocatedSeconds),
          todayAllocatedSeconds: allocatedSeconds,
          isOverWorked: workedSeconds > allocatedSeconds,
          overWorkedFormatted: `${diffH}h ${diffM}m`,
          diffHours: diffH,
          diffMinutes: diffM,
          diffFormatted: `${diffH}h ${diffM}m`,
        };

        if (isToday && !isClosed) {
          const proficiency = calculateProficiency(workedHours, allocatedSeconds);
          row.proficiency = proficiency;

          if (slot) {
            bulkOps.push({
              updateOne: {
                filter: { _id: allocation._id },
                update: { $set: { "dailyAllocations.$[s].proficiency": proficiency } },
                arrayFilters: [{ "s._id": slot._id }],
              },
            });
          }
        } else {
          row.proficiency = slot?.proficiency ?? null;
        }

        grouped[employeeId].tasks.push(row);
      });
    });

    if (bulkOps.length) await TaskAllocation.bulkWrite(bulkOps);

    return res.status(200).json({
      success: true,
      employees: Object.values(grouped),
      date: requestedDate,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
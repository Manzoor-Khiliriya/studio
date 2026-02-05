const Holiday = require("../models/Holiday");
const Leave = require("../models/Leave");

const calculateLeaveDays = async (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const holidays = await Holiday.find({ date: { $gte: start, $lte: end } }, "date");
  const holidaySet = new Set(holidays.map(h => h.date.toISOString().split("T")[0]));

  let count = 0;
  const current = new Date(start);

  while (current <= end) {
    const dateStr = current.toISOString().split("T")[0];
    const isWeekend = current.getDay() === 0 || current.getDay() === 6;

    if (!isWeekend && !holidaySet.has(dateStr)) count++;
    current.setDate(current.getDate() + 1);
  }

  return count;
};

const hasLeaveOverlap = (existingLeaves, newStart, newEnd) => {
  const start = new Date(newStart);
  const end = new Date(newEnd);

  return existingLeaves.some(l => start <= l.endDate && end >= l.startDate);
};

const isUserOnLeaveDuring = async (userId, startDate, endDate) => {
  const overlappingLeave = await Leave.findOne({
    user: userId,
    status: "Approved",
    startDate: { $lte: endDate },
    endDate: { $gte: startDate }
  });

  return !!overlappingLeave;
};
module.exports = { calculateLeaveDays, hasLeaveOverlap, isUserOnLeaveDuring };

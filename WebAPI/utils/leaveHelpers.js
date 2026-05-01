const Holiday = require("../models/Holiday");
const Employee = require("../models/Employee");
const { formatDate, startOfDay, endOfDay } = require("../utils/dateHelper");

const calculateLeaveDays = async (startDate, endDate) => {
  const start = startOfDay(startDate);
  const end = endOfDay(endDate);

  const holidays = await Holiday.find(
    { date: { $gte: start, $lte: end } },
    "date"
  );

  const holidaySet = new Set(
    holidays.map(h => formatDate(h.date))
  );

  let count = 0;
  const current = new Date(start);

  while (current <= end) {
    const dateStr = formatDate(current);
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
  const employee = await Employee.findOne({ user: userId });
  if (!employee || !employee.leaves?.length) return false;

  const start = startOfDay(startDate);
  const end = endOfDay(endDate);

  return employee.leaves.some(leave => {
    const d = new Date(leave.date);
    return d >= start && d <= end;
  });
};

module.exports = {
  calculateLeaveDays,
  hasLeaveOverlap,
  isUserOnLeaveDuring
};
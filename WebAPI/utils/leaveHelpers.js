const Holiday = require("../models/Holiday");
const Employee = require("../models/Employee");
const { formatDate, startOfDay, endOfDay } = require("../utils/dateHelper");
const moment = require("moment-timezone");


const calculateLeaveDays = async (startDate, endDate) => {
  const start = startOfDay(startDate);
  const end = endOfDay(endDate);

  const holidays = await Holiday.find(
    { date: { $gte: start, $lte: end } },
    "date",
  );

  const holidaySet = new Set(holidays.map((h) => formatDate(h.date)));

  let count = 0;
  let current = moment(start).tz("Asia/Kolkata");
  const endMoment = moment(end).tz("Asia/Kolkata");

  while (current.isSameOrBefore(endMoment, "day")) {
    const dateStr = current.format("YYYY-MM-DD");
    const isWeekend = current.day() === 0 || current.day() === 6;

    if (!isWeekend && !holidaySet.has(dateStr)) count++;

    current = current.add(1, "day");
  }

  return count;
};

const hasLeaveOverlap = (existingLeaves, newStart, newEnd) => {
  const start = new Date(newStart);
  const end = new Date(newEnd);

  return existingLeaves.some((l) => start <= l.endDate && end >= l.startDate);
};

const isUserOnLeaveDuring = async (userId, startDate, endDate) => {
  const employee = await Employee.findOne({ user: userId });
  if (!employee || !employee.leaves?.length) return false;

  const start = startOfDay(startDate);
  const end = endOfDay(endDate);

  return employee.leaves.some((leave) => {
    const d = new Date(leave.date);
    return d >= start && d <= end;
  });
};

module.exports = {
  calculateLeaveDays,
  hasLeaveOverlap,
  isUserOnLeaveDuring,
};

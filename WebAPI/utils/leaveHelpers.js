const Holiday = require("../models/Holiday");
const Employee = require("../models/Employee"); // 🔹 Added missing import

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
  const employee = await Employee.findOne({ user: userId });
  if (!employee || !employee.leaves || !employee.leaves.length) return false;

  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0); // Normalize to start of day
  
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999); // Normalize to end of day

  // Check if any manual leave date falls between the task start and end
  return employee.leaves.some(leave => {
    const d = new Date(leave.date);
    return d >= start && d <= end;
  });
};

// 🔹 Exporting everything correctly
module.exports = { 
  calculateLeaveDays, 
  hasLeaveOverlap, 
  isUserOnLeaveDuring 
};
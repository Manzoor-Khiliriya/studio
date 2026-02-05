const Holiday = require("../models/Holiday");

const isWeekend = (d) => [0, 6].includes(d.getDay());

const toValidDate = (value) => {
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

const calculateEmployeeAvailableHours = async (start, end, employeeJoinDate) => {
  const startDate = toValidDate(start);
  const endDate = toValidDate(end);
  const joinDate = toValidDate(employeeJoinDate);

  // 🚨 HARD STOP if bad input
  if (!startDate || !endDate)
    throw new Error("Invalid start or end date provided");

  // If join date invalid, assume employee existed from startDate
  const effectiveStart = joinDate
    ? new Date(Math.max(startDate, joinDate))
    : startDate;

  // Prevent negative range
  if (effectiveStart > endDate) return 0;

  // ✅ Query only if dates are valid
  const holidays = await Holiday.find({
    date: { $gte: effectiveStart, $lte: endDate },
  }).select("date");

  const holidaySet = new Set(
    holidays.map((h) => h.date.toISOString().split("T")[0])
  );

  let days = 0;
  const current = new Date(effectiveStart);

  while (current <= endDate) {
    const dateStr = current.toISOString().split("T")[0];
    if (!isWeekend(current) && !holidaySet.has(dateStr)) days++;
    current.setDate(current.getDate() + 1);
  }

  return days * 9; // working hours
};

module.exports = { calculateEmployeeAvailableHours };

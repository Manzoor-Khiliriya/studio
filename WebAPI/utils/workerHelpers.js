const Holiday = require("../models/Holiday");
const { formatDate } = require("../utils/dateHelper");

const isWeekend = (d) => [0, 6].includes(d.getDay());

const toValidDate = (value) => {
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

const calculateEmployeeAvailableHours = async (start, end, employeeJoinDate) => {
  const startDate = toValidDate(start);
  const endDate = toValidDate(end);
  const joinDate = toValidDate(employeeJoinDate);

  if (!startDate || !endDate)
    throw new Error("Invalid start or end date provided");

  const effectiveStart = joinDate
    ? new Date(Math.max(startDate, joinDate))
    : startDate;

  if (effectiveStart > endDate) return 0;

  const holidays = await Holiday.find({
    date: { $gte: effectiveStart, $lte: endDate },
  }).select("date");

  const holidaySet = new Set(
    holidays.map((h) => formatDate(h.date))
  );

  let days = 0;
  const current = new Date(effectiveStart);

  while (current <= endDate) {
    const dateStr = formatDate(current);

    if (!isWeekend(current) && !holidaySet.has(dateStr)) {
      days++;
    }

    current.setDate(current.getDate() + 1);
  }

  return days * 9;
};

module.exports = { calculateEmployeeAvailableHours };
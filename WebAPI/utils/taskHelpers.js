const Holiday = require("../models/Holiday");
const { formatDate } = require("../utils/dateHelper");

const isWeekend = (date) => {
  const d = new Date(date).getDay();
  return d === 0 || d === 6;
};

const calculateEstimatedHours = async (start, end) => {
  const startDate = new Date(start);
  const endDate = new Date(end);

  if (isNaN(startDate) || isNaN(endDate)) {
    throw new Error("Invalid start or end date");
  }

  if (startDate > endDate) {
    throw new Error("Start date cannot be after end date");
  }

  const holidays = await Holiday.find({
    date: { $gte: startDate, $lte: endDate }
  }).select("date");

  const holidaySet = new Set(
    holidays.map(h => formatDate(h.date))
  );

  let days = 0;
  const current = new Date(startDate);

  while (current <= endDate) {
    const dateStr = formatDate(current);

    if (!isWeekend(current) && !holidaySet.has(dateStr)) {
      days++;
    }

    current.setDate(current.getDate() + 1);
  }

  return days * 9;
};

module.exports = { calculateEstimatedHours };
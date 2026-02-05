const Holiday = require("../models/Holiday");

const isWeekend = (date) => {
  const d = new Date(date).getDay();
  return d === 0 || d === 6;
};

const calculateEstimatedHours = async (start, end) => {
  const startDate = new Date(start);
  const endDate = new Date(end);

  // ✅ HARD GUARD
  if (isNaN(startDate) || isNaN(endDate)) {
    throw new Error("Invalid start or end date");
  }

  // Ensure correct order
  if (startDate > endDate) {
    throw new Error("Start date cannot be after end date");
  }

  const holidays = await Holiday.find({
    date: { $gte: startDate, $lte: endDate }
  }).select("date");

  const holidaySet = new Set(
    holidays.map(h => h.date.toISOString().split("T")[0])
  );

  let days = 0;
  const current = new Date(startDate);

  while (current <= endDate) {
    const dateStr = current.toISOString().split("T")[0];

    if (!isWeekend(current) && !holidaySet.has(dateStr)) {
      days++;
    }

    current.setDate(current.getDate() + 1);
  }

  return days * 9;
};


module.exports = { calculateEstimatedHours };

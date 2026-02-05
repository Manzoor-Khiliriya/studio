const Holiday = require("../models/Holiday");

const isWeekend = d => [0,6].includes(new Date(d).getDay());

const calculateEmployeeAvailableHours = async (start, end, employeeJoinDate) => {
  const effectiveStart = new Date(Math.max(new Date(start), new Date(employeeJoinDate)));
  const endDate = new Date(end);

  const holidays = await Holiday.find({
    date: { $gte: effectiveStart, $lte: endDate }
  }).select("date");

  const holidaySet = new Set(holidays.map(h => h.date.toISOString().split("T")[0]));

  let days = 0;
  const current = new Date(effectiveStart);

  while (current <= endDate) {
    const dateStr = current.toISOString().split("T")[0];
    if (!isWeekend(current) && !holidaySet.has(dateStr)) days++;
    current.setDate(current.getDate() + 1);
  }

  return days * 9; // hours
};

module.exports = { calculateEmployeeAvailableHours };

const moment = require("moment-timezone");
const Holiday = require("../models/Holiday");
const { formatDate, startOfDay, endOfDay } = require("./dateHelper");

const TIMEZONE = "Asia/Kolkata";

const isWeekend = (d) => {
  const day = moment(d).tz(TIMEZONE).day();
  return day === 0 || day === 6;
};

const toValidDate = (value) => {
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

const calculateEmployeeAvailableHours = async (
  start,
  end,
  employeeJoinDate,
) => {
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

  const holidaySet = new Set(holidays.map((h) => formatDate(h.date)));

  let days = 0;
  let current = moment(effectiveStart).tz(TIMEZONE);
  const endMoment = moment(endDate).tz(TIMEZONE);

  while (current.isSameOrBefore(endMoment, "day")) {
    const dateStr = current.format("YYYY-MM-DD");

    if (!isWeekend(current.toDate()) && !holidaySet.has(dateStr)) {
      days++;
    }

    current = current.add(1, "day");
  }

  return days * 9;
};

const calculateWorkingDaysFromHolidaySet = (startDate, endDate, holidaySet) => {
  let current = moment(startOfDay(startDate)).tz(TIMEZONE);
  const end = moment(endOfDay(endDate)).tz(TIMEZONE);

  let count = 0;

  while (current.isSameOrBefore(end, "day")) {
    const dateStr = current.format("YYYY-MM-DD");

    if (!isWeekend(current.toDate()) && !holidaySet.has(dateStr)) {
      count++;
    }

    current = current.add(1, "day");
  }

  return count;
};

module.exports = { calculateEmployeeAvailableHours, calculateWorkingDaysFromHolidaySet };
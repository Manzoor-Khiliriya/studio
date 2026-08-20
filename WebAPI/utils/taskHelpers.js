const moment = require("moment-timezone");
const Holiday = require("../models/Holiday");
const { formatDate } = require("../utils/dateHelper");

const TIMEZONE = "Asia/Kolkata";

const isWeekend = (d) => {
  const day = moment(d).tz(TIMEZONE).day();
  return day === 0 || day === 6;
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

  const holidaySet = new Set(holidays.map(h => formatDate(h.date)));

  let days = 0;
  let current = moment(startDate).tz(TIMEZONE);
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

module.exports = { calculateEstimatedHours };
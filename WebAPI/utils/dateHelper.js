const moment = require("moment-timezone");
const TIMEZONE = "Asia/Kolkata";

const getToday = () => moment().tz(TIMEZONE).format("YYYY-MM-DD");

const getYesterday = () =>
  moment().tz(TIMEZONE).subtract(1, "day").format("YYYY-MM-DD");

const formatDate = (date) => moment(date).tz(TIMEZONE).format("YYYY-MM-DD");

const startOfDay = (date) => moment(date).tz(TIMEZONE).startOf("day").toDate();

const endOfDay = (date) => moment(date).tz(TIMEZONE).endOf("day").toDate();

const now = () => moment().tz(TIMEZONE).toDate();

const isSameDay = (a, b) =>
  moment(a).tz(TIMEZONE).isSame(moment(b).tz(TIMEZONE), "day");

const isSameMonth = (a, b) =>
  moment(a).tz(TIMEZONE).isSame(moment(b).tz(TIMEZONE), "month");

const isSameYear = (a, b) =>
  moment(a).tz(TIMEZONE).isSame(moment(b).tz(TIMEZONE), "year");

const getMonthRange = (year, month) => {
  const start = moment.tz(
    { year: Number(year), month: Number(month) - 1, day: 1 },
    TIMEZONE,
  );
  const end = start.clone().endOf("month");
  return {
    startOfMonth: start.format("YYYY-MM-DD"),
    endOfMonth: end.format("YYYY-MM-DD"),
  };
};

module.exports = {
  getToday,
  getYesterday,
  formatDate,
  startOfDay,
  endOfDay,
  now,
  isSameDay,
  isSameMonth,
  isSameYear,
  getMonthRange,
};

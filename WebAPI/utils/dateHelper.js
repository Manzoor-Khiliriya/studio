const moment = require("moment-timezone");

const TIMEZONE = "Asia/Kolkata";

const getToday = () =>
    moment().tz(TIMEZONE).format("YYYY-MM-DD");

const formatDate = (date) =>
    moment(date).tz(TIMEZONE).format("YYYY-MM-DD");

const startOfDay = (date) =>
    moment(date).tz(TIMEZONE).startOf("day").toDate();

const endOfDay = (date) =>
    moment(date).tz(TIMEZONE).endOf("day").toDate();

const now = () => moment().tz("Asia/Kolkata").toDate();

module.exports = {
    getToday,
    formatDate,
    startOfDay,
    endOfDay,
    now
};
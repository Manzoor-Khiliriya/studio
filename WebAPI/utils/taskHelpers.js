/**
 * Checks if a specific date falls on a weekend
 * @param {Date|String} date 
 * @returns {Boolean}
 */
const isWeekend = (date) => {
  const day = new Date(date).getDay();
  return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
};

/**
 * Helper: Calculates total working minutes between two dates
 * Logic: 9 hours per day, excluding Saturdays and Sundays
 */
const calculateEstimatedMinutes = (start, end) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  let totalDays = 0;

  // Iterate through dates
  let current = new Date(startDate);
  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 0 = Sunday, 6 = Saturday
      totalDays++;
    }
    current.setDate(current.getDate() + 1);
  }

  const DAILY_LIMIT_MINS = 9 * 60; // 540 minutes
  return totalDays * DAILY_LIMIT_MINS;
};

/**
 * Groups sessions from the workLog array by day for charts/tables
 * @param {Array} sessions - Array of session objects
 */
const groupSessionsByDay = (sessions = []) => {
  const daily = {};

  sessions.forEach(s => {
    if (!s.startTime || !s.endTime) return;

    const start = new Date(s.startTime);
    const dateKey = start.toISOString().split("T")[0];

    const minutes = s.duration
      ? s.duration
      : Math.max(0, (new Date(s.endTime) - start) / 60000);

    if (!daily[dateKey]) daily[dateKey] = 0;
    daily[dateKey] += minutes;
  });

  return Object.entries(daily).map(([date, mins]) => ({
    date,
    minutes: Math.round(mins)
  }));
};

module.exports = {
  isWeekend,
  calculateEstimatedMinutes,
  groupSessionsByDay
};
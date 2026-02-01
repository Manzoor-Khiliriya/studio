const Holiday = require("../models/Holiday");
const { isWeekend } = require('./taskHelpers');

/**
 * Calculates the number of working days between two dates,
 * skipping weekends (Sat/Sun) and official Holidays from the database.
 */

/**
 * Calculates working days between two dates, 
 * excluding weekends and public holidays from the DB.
 */
const calculateLeaveDays = async (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let count = 0;

  // Fetch all holiday dates from DB
  const holidayRecords = await Holiday.find({}, 'date');
  const holidayStrings = holidayRecords.map(h => h.date.toISOString().split('T')[0]);

  let current = new Date(start);
  while (current <= end) {
    const dayOfWeek = current.getDay();
    const dateString = current.toISOString().split('T')[0];

    const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6); // 0 = Sunday, 6 = Saturday
    const isHoliday = holidayStrings.includes(dateString);

    if (!isWeekend && !isHoliday) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
};

/**
 * Validates if the requested leave dates overlap with any existing leaves.
 */
const hasLeaveOverlap = (existingLeaves, newStart, newEnd) => {
  const start = new Date(newStart);
  const end = new Date(newEnd);

  return existingLeaves.some(leave => {
    const lStart = new Date(leave.startDate);
    const lEnd = new Date(leave.endDate);

    // Check if new range falls within or overlaps existing range
    return (start <= lEnd && end >= lStart);
  });
};

// Exporting properly
module.exports = {
  calculateLeaveDays,  
  hasLeaveOverlap
};
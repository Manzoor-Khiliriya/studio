const calculateProficiency = (workedHours, allocatedSeconds) => {
  const hasAllocation = allocatedSeconds && allocatedSeconds > 0;
  const hasWorked = workedHours && workedHours > 0;

  if (!hasAllocation) {
    return hasWorked ? 100 : null;
  }

  if (!hasWorked) return 100;

  const allocatedHours = allocatedSeconds / 3600;
  return Math.round((allocatedHours / workedHours) * 100);
};

const computeWorkedSeconds = (allocation, dateStr) => {
  return (allocation.task?.timeLogs || [])
    .filter(
      (log) =>
        log.user?.toString() === allocation.employee.user._id.toString() &&
        log.dateString === dateStr &&
        log.logType === "work",
    )
    .reduce((acc, log) => {
      if (log.isRunning) {
        const liveSeconds = Math.floor(
          (Date.now() - new Date(log.startTime).getTime()) / 1000,
        );
        return acc + Math.max(0, liveSeconds);
      }
      return acc + (log.rawDurationSeconds || 0);
    }, 0);
};

module.exports = { calculateProficiency, computeWorkedSeconds };

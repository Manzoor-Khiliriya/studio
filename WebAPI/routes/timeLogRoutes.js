const express = require("express");
const router = express.Router();
const timeLogController = require("../controllers/timeLogController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");

// All time tracking routes require authentication
router.use(authenticate);

/* =========================================================
   EMPLOYEE ACTIONS (Self Time Tracking)
   ========================================================= */

// Start/Resume work on a task
router.post("/start", timeLogController.startTimer);

// Toggle between 'work' and 'break'
router.post("/pause", timeLogController.togglePause);

// Stop current active timer
router.post("/stop", timeLogController.stopTimer);

// Get today’s logs + active status for the dashboard
router.get("/my", timeLogController.getMyLogs);


/* =========================================================
   ADMIN REPORTING (Aggregated Metrics)
   ========================================================= */

/**
 * GET /api/timelogs/report/tasks
 * Query Params: ?page=1&limit=5&search=PROJ-101
 * Returns paginated project-task-duration tree
 */


// Optional: Weekly breakdown for a specific employee
// router.get("/report/employee/:userId", authorize("Admin"), timeLogController.getWeeklyReport);


/* =========================================================
   ADMIN CONTROLS (Global Actions)
   ========================================================= */

// Emergency stop for all active timers across the company
router.post(
  "/stop-all", 
  authorize("Admin"), 
  timeLogController.stopAllLiveSessions
);

// Archive/Clear logs from the active admin view
router.post(
  "/clear-all", 
  authorize("Admin"), 
  timeLogController.clearAllLogs
);

module.exports = router;
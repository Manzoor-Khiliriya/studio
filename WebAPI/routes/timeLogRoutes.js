const express = require("express");
const router = express.Router();
const timeLogController = require("../controllers/timeLogController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");

/* =========================================================
   EMPLOYEE ROUTES (Self Time Tracking)
   ========================================================= */
router.use(authenticate);

// Start working on a task
router.post("/start", timeLogController.startTimer);

// Pause / Resume (work <-> break)
router.post("/pause", timeLogController.togglePause);

// Stop current timer
router.post("/stop", timeLogController.stopTimer);

// Get today’s logs + active status
router.get("/my", timeLogController.getMyLogs);


/* =========================================================
   ADMIN REPORT ROUTES
   ========================================================= */

// Overall task performance (hours spent vs allocated)
router.get("/report/tasks", authorize("Admin"), timeLogController.getTaskPerformanceReport);


// ... existing imports

/* =========================================================
   ADMIN CONTROL ROUTES
   ========================================================= */

// Matches: POST /api/timelogs/clear-all
router.post("/clear-all", authorize("Admin"), timeLogController.clearAllLogs);

// Matches: POST /api/timelogs/stop-all
router.post("/stop-all", authorize("Admin"), timeLogController.stopAllLiveSessions);

module.exports = router;

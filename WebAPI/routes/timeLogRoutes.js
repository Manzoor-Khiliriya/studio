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

router.post(
  "/stop-all",
  authorize("Admin"),
  timeLogController.stopAllLiveSessions,
);

// Archive/Clear logs from the active admin view
router.post("/clear-all", authorize("Admin"), timeLogController.clearLogs);

module.exports = router;

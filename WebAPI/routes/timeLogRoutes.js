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

// Weekly report for specific employee
router.get(
  "/report/employee/:userId",
  authorize("Admin"),
  timeLogController.employeeWeeklyReport
);

module.exports = router;

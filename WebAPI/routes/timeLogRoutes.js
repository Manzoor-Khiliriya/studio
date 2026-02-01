const express = require("express");
const router = express.Router();
const timeLogController = require("../controllers/timeLogController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");

// --- EMPLOYEE ROUTES (Self-management) ---

// Start or Resume a task
router.post("/start", authenticate, timeLogController.startTimer);

// Stop the current timer (Clock out or end task)
router.post("/stop", authenticate, timeLogController.stopTimer);
router.post("/pause", authenticate, timeLogController.togglePause);

// View personal logs (For the employee dashboard)
router.get("/my", authenticate, timeLogController.getMyLogs);


// --- ADMIN & MANAGEMENT ROUTES ---

/** * Daily Report for all employees
 * Accessible only by Admin 
 */
router.get("/report", authenticate, authorize("admin"), timeLogController.getTaskPerformanceReport);

/** * Weekly report for a specific employee
 * Added the missing "/" and protected it for Admin use
 */
router.get("/report/employee/:id", authenticate, authorize("admin"), timeLogController.employeeWeeklyReport);

module.exports = router;
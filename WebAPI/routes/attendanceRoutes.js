const express = require("express");
const router = express.Router();
const attendanceController = require("../controllers/attendanceController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");

router.use(authenticate);

// Employee Routes
router.get("/today", attendanceController.getTodayStatus);
router.post("/clock-in", attendanceController.clockIn);
router.post("/clock-out", attendanceController.clockOut);

// Admin Route (New)
router.get("/admin/all", authorize("Admin"), attendanceController.getAllAttendance);

module.exports = router;
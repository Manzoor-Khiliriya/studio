const express = require("express");
const router = express.Router();
const attendanceController = require("../controllers/attendanceController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");
const { ROLE } = require("../utils/constant");

router.use(authenticate);

// Employee Routes
router.get("/today", attendanceController.getTodayStatus);
router.post("/clock-in", attendanceController.clockIn);
router.post("/clock-out", attendanceController.clockOut);

// Admin Route (New)
router.get("/admin/all", authorize(ROLE.ADMIN, ROLE.HR_MANAGER), attendanceController.getAllAttendance);

module.exports = router;
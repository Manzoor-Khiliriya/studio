const express = require("express");
const router = express.Router();
const attendanceController = require("../controllers/attendanceController");
const { authenticate } = require("../middlewares/authMiddleware"); // Assuming you have auth

// All routes are protected so we know WHICH user is clocking in
router.use(authenticate);

router.get("/today", attendanceController.getTodayStatus);
router.post("/clock-in", attendanceController.clockIn);
router.post("/clock-out", attendanceController.clockOut);
// router.get("/history", attendanceController.getAttendanceHistory);

module.exports = router;
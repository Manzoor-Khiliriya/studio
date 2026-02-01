const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const {
  clockIn,
  clockOut,
  getMyAttendance,
} = require("../controllers/attendanceController");

router.post("/in", auth, clockIn);
router.post("/out", auth, clockOut);
router.get("/my", auth, getMyAttendance);

module.exports = router;

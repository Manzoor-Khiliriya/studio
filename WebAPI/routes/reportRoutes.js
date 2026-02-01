const express = require("express");
const router = express.Router();
const reportCtrl = require("../controllers/reportController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");

// Both routes are strictly for Admin
router.get("/leaderboard", authenticate, authorize("admin"), reportCtrl.getPerformanceLeaderboard);
router.get("/utilization", authenticate, authorize("admin"), reportCtrl.getDailyUtilization);
router.get("/reports/summary", authenticate, authorize("admin"), reportCtrl.getAdminSummary);


module.exports = router;
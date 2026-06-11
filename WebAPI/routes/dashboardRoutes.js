const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");
const { ROLE } = require("../utils/constant");

router.get("/summary", authenticate, dashboardController.getSummary);
router.get(
  "/manager-dashboard",
  authenticate,
  authorize(ROLE.MANAGER),
  dashboardController.getManagerDashboard,
);

module.exports = router;

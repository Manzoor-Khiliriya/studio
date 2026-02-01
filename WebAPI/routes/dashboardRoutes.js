const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const { authenticate } = require("../middlewares/authMiddleware");

// Single endpoint for the Home/Dashboard screen
router.get("/summary", authenticate, dashboardController.getSummary);

module.exports = router;
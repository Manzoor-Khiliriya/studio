const express = require("express");
const router = express.Router();
const searchController = require("../controllers/searchController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");

// Example usage: GET /api/search?query=John
router.get("/search", authenticate, authorize("Admin"), searchController.globalSearch);

module.exports = router;
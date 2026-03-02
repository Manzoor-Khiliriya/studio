const express = require("express");
const router = express.Router();
const {
  createProject,
  getAllProjects,
  getEstimate,
  updateProject,
  deleteProject,
  getProjectCalendarStacks // <--- Import the new controller function
} = require("../controllers/projectController");

const { authenticate, authorize } = require("../middlewares/authMiddleware");

// 1. Base Project Routes
router.route("/")
  .get(authenticate, getAllProjects)
  .post(authenticate, authorize("Admin"), createProject);

// 2. Calendar Aggregation Route (Place this BEFORE /:id)
// Matches: GET /api/projects/calendar?search=PROJ-101
router.get("/calendar", authenticate, getProjectCalendarStacks);

// 3. Specific Project ID Routes
router.route("/:id")
  .put(authenticate, authorize("Admin"), updateProject)
  .delete(authenticate, authorize("Admin"), deleteProject);

router.get("/:id/calculate-estimate", authenticate, getEstimate);

module.exports = router;
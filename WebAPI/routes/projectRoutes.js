const express = require("express");
const router = express.Router();
const { 
  createProject, 
  getAllProjects, 
  updateProject, 
  deleteProject 
} = require("../controllers/projectController");

// Import your auth middleware
const { authenticate, authorize } = require("../middlewares/authMiddleware");

router.route("/")
  .get(authenticate, getAllProjects)
  .post(authenticate, authorize("Admin"), createProject);

router.route("/:id")
  .put(authenticate, authorize("Admin"), updateProject)
  .delete(authenticate, authorize("Admin"), deleteProject);

module.exports = router;
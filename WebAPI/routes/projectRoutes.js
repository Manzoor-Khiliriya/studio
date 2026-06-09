const express = require("express");
const router = express.Router();
const {
  createProject,
  getAllProjects,
  getEstimate,
  updateProject,
  deleteProject,
  getProjectCalendarStacks,
  getTaskPerformanceReport,
} = require("../controllers/projectController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");
const { ROLE } = require("../utils/constant");

router.use(authenticate);

router
  .route("/")
  .get(authorize(ROLE.ADMIN), getAllProjects)
  .post(authorize(ROLE.ADMIN), createProject);
router.get("/calendar", authorize(ROLE.ADMIN), getProjectCalendarStacks);
router.get(
  "/reports/performance",
  authorize(ROLE.ADMIN),
  getTaskPerformanceReport,
);
router
  .route("/:id")
  .put(authorize(ROLE.ADMIN), updateProject)
  .delete(authorize(ROLE.ADMIN), deleteProject);

router.get("/:id/calculate-estimate", authenticate, getEstimate);

module.exports = router;

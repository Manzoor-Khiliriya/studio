const express = require("express");
const router = express.Router();
const taskAllocationController = require("../controllers/taskAllocationController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");

router.use(authenticate);

router.put(
  "/:id",
  authorize("Admin"),
  taskAllocationController.updateTaskAllocation,
);

router.delete(
  "/:id",
  authorize("Admin"),
  taskAllocationController.deleteTaskAllocation,
);

router.get(
  "/employee-allocation",
  authorize("Admin"),
  taskAllocationController.getEmployeeAllocations,
);

router.patch("/:id/daily", authorize("Admin"), taskAllocationController.setDailyAllocatedHours);

module.exports = router;

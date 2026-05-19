const express = require("express");
const router = express.Router();
const taskAllocationController = require("../controllers/taskAllocationController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");

router.use(authenticate);

router.post(
  "/",
  authorize("Admin"),
  taskAllocationController.createTaskAllocation,
);

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

router.get(
  "/employee/:employeeId",
  authorize("Admin"),
  taskAllocationController.getEmployeeTaskQueue,
);

router.get("/my-queue", taskAllocationController.getMyTaskQueue);

module.exports = router;

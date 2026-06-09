const express = require("express");
const router = express.Router();
const taskAllocationController = require("../controllers/taskAllocationController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");
const { ROLE } = require("../utils/constant");

router.use(authenticate);

router.put(
  "/:id",
  authorize(ROLE.ADMIN),
  taskAllocationController.updateTaskAllocation,
);

router.get(
  "/employee-allocation",
  authorize(ROLE.ADMIN),
  taskAllocationController.getEmployeeAllocations,
);

module.exports = router;

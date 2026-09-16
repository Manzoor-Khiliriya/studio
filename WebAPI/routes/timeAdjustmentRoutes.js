const express = require("express");
const router = express.Router();
const timeAdjustmentController = require("../controllers/timeAdjustmentController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");
const { ROLE } = require("../utils/constant");

router.use(authenticate);

/* ============================================================
   EMPLOYEE ROUTES
   ============================================================ */

// Auto-stopped sessions still eligible for a correction request
router.get(
  "/eligible",
  authorize(ROLE.EMPLOYEE, ROLE.MANAGER),
  timeAdjustmentController.getEligibleLogs,
);

// Submit a correction request
router.post(
  "/",
  authorize(ROLE.EMPLOYEE, ROLE.MANAGER),
  timeAdjustmentController.requestAdjustment,
);

// View own requests
router.get(
  "/mine",
  authorize(ROLE.EMPLOYEE, ROLE.MANAGER),
  timeAdjustmentController.getMyAdjustmentRequests,
);

/* ============================================================
   ADMIN ROUTES
   ============================================================ */

// List all requests (optional ?status=Pending)
router.get(
  "/",
  authorize(ROLE.ADMIN),
  timeAdjustmentController.getAdjustmentRequests,
);

// Approve / reject
router.put(
  "/:id/review",
  authorize(ROLE.ADMIN),
  timeAdjustmentController.reviewAdjustmentRequest,
);

module.exports = router;
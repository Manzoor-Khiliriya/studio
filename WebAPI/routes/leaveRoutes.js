const express = require("express");
const router = express.Router();
const leaveController = require("../controllers/leaveController");
const { authenticate } = require("../middlewares/authMiddleware");

/**
 * @route   ALL /api/leaves/*
 * @access  Protected (Requires Login)
 */
router.use(authenticate);

/* =============================================================
   EMPLOYEE ROUTES (Self-Service)
   ============================================================= */

// Apply for a new leave request
router.post("/apply", leaveController.applyLeave);

// Get my personal leave history
router.get("/my-leaves", leaveController.getMyLeaves);

// Edit a pending leave request (before admin processes it)
router.put("/update/:id", leaveController.updateLeave);

// Delete/Cancel a pending leave request
router.delete("/cancel/:id", leaveController.deleteLeave);


/* =============================================================
   ADMIN ROUTES (Management)
   ============================================================= */

// Get all leave requests from all employees
router.get("/all", leaveController.getAllLeaves);

// Approve or Reject a leave request
router.patch("/process/:id", leaveController.processLeave);

// Admin can delete any leave record
router.delete("/admin/delete/:id", leaveController.deleteLeave);

module.exports = router;
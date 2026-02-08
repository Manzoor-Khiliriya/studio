const express = require("express");
const router = express.Router();
const employeeController = require("../controllers/employeeController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");

router.use(authenticate);

router.get("/active-list", authorize("Admin"), employeeController.getActiveEmployeesList);

// Admin routes
router.get("/", authorize("Admin"), employeeController.getAllEmployees);
router.get("/:userId", authorize("Admin"), employeeController.getEmployeeProfile);
router.put("/:userId", authorize("Admin"), employeeController.updateEmployeeStats);

// Logged-in employee self profile
router.get("/my/profile", employeeController.getMyEmployeeProfile);

module.exports = router;

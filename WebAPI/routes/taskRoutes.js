const express = require("express");
const router = express.Router();
const taskController = require("../controllers/taskController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");

/* All routes require login */
router.use(authenticate);

/* ================= ADMIN ROUTES ================= */

// Create task
router.post("/", authorize("Admin"), taskController.createTask);

// Get all tasks (admin dashboard)
router.get("/all", authorize("Admin"), taskController.getAllTasks);

// Update task
router.put("/:id", authorize("Admin"), taskController.updateTask);

// Patch is appropriate here as we are doing a partial update
router.patch("/:id/status", authorize("Admin"), taskController.updateTaskStatus);

// Delete task
router.delete("/:id", authorize("Admin"), taskController.deleteTask);

// View tasks assigned to specific employee
router.get("/employee-tasks/:userId", authorize("Admin"), taskController.getTasksByEmployee);


/* ================= SHARED ROUTES ================= */

// Task detail (Admin + assigned employees)
router.get("/detail/:id", taskController.getTaskDetail);


/* ================= EMPLOYEE ROUTES ================= */

// Logged-in employee tasks
router.get("/my-tasks", taskController.getMyTasks);

module.exports = router;

const express = require("express");
const router = express.Router();
const taskController = require("../controllers/taskController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");

/** * @access All Task routes require a valid token
 */
router.use(authenticate);

/* =============================================================
   ADMIN ROUTES
   ============================================================= */

// Create a new task (POST /api/tasks/)
router.post("/", taskController.createTask);

// Get all tasks for Admin list view (GET /api/tasks/all)
router.get("/all", authorize("Admin"), taskController.getAllTasks);
// Update a task (PUT /api/tasks/:id)
router.put("/:id", taskController.updateTask);

// Delete a task (DELETE /api/tasks/:id)
router.delete("/:id", taskController.deleteTask);


/* =============================================================
   SHARED / DETAIL ROUTES
   ============================================================= */

// Get full details of a specific task (GET /api/tasks/detail/:id)
// Used by both Admin and Assigned Employees
router.get("/detail/:id", taskController.getTaskDetail);
router.get('/admin/employee-tasks/:userId', authenticate, authorize("Admin"), taskController.getTasksByEmployee);

/* =============================================================
   EMPLOYEE ROUTES
   ============================================================= */

// Get tasks assigned only to the logged-in user (GET /api/tasks/me)
router.get("/me", taskController.getMyTasks);

module.exports = router;
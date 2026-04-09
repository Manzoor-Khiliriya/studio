const express = require("express");
const router = express.Router();
const taskController = require("../controllers/taskController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");

router.use(authenticate);

/* ================= ADMIN ROUTES ================= */
router.post("/", authorize("Admin"), taskController.createTask);
router.get("/all", authorize("Admin"), taskController.getAllTasks);
router.put("/:id", authorize("Admin"), taskController.updateTask);
router.patch("/:id/status", authorize("Admin"), taskController.updateTaskStatus);
router.delete("/:id", authorize("Admin"), taskController.deleteTask);
router.get("/employee-tasks/:userId", authorize("Admin"), taskController.getTasksByEmployee);

/* ================= SHARED ROUTES ================= */
router.get("/detail/:id", authorize("Admin"), taskController.getTaskDetail);

/* ================= EMPLOYEE ROUTES ================= */
router.get("/my-tasks", taskController.getMyTasks);

module.exports = router;
const express = require("express");
const router = express.Router();
const taskController = require("../controllers/taskController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");
const { ROLE } = require("../utils/constant");

router.use(authenticate);

/* ================= ADMIN ROUTES ================= */
router.post("/", authorize(ROLE.ADMIN), taskController.createTask);
router.get("/all", authorize(ROLE.ADMIN), taskController.getAllTasks);
router.put("/:id", authorize(ROLE.ADMIN), taskController.updateTask);
router.patch("/:id/status", authorize(ROLE.ADMIN), taskController.updateTaskStatus);
router.delete("/:id", authorize(ROLE.ADMIN), taskController.deleteTask);
router.get("/employee-tasks/:userId", authorize(ROLE.ADMIN, ROLE.MANAGER), taskController.getTasksByEmployee);

/* ================= SHARED ROUTES ================= */
router.get("/detail/:id", authorize(ROLE.ADMIN), taskController.getTaskDetail);

/* ================= EMPLOYEE ROUTES ================= */
router.get("/my-tasks", taskController.getMyTasks);

module.exports = router;
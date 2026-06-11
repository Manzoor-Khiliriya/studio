const express = require("express");
const router = express.Router();
const taskController = require("../controllers/taskController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");
const { ROLE } = require("../utils/constant");

router.use(authenticate);

router.post("/", authorize(ROLE.ADMIN), taskController.createTask);
router.get("/all", authorize(ROLE.ADMIN), taskController.getAllTasks);
router.put("/:id", authorize(ROLE.ADMIN, ROLE.MANAGER), taskController.updateTask);
router.patch("/:id/status", authorize(ROLE.ADMIN, ROLE.MANAGER), taskController.updateTaskStatus);
router.delete("/:id", authorize(ROLE.ADMIN), taskController.deleteTask);
router.get("/employee-tasks/:userId", authorize(ROLE.ADMIN, ROLE.MANAGER), taskController.getTasksByEmployee);

router.get("/detail/:id", authorize(ROLE.ADMIN), taskController.getTaskDetail);

router.get("/my-tasks", authorize(ROLE.EMPLOYEE, ROLE.MANAGER), taskController.getMyTasks);

module.exports = router;
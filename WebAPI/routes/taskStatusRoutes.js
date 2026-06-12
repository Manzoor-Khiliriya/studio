const express = require("express");
const router = express.Router();
const controller = require("../controllers/taskStatusController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");
const { ROLE } = require("../utils/constant");

router.use(authenticate);

router.get("/", authorize(ROLE.ADMIN), controller.getTaskStatuses);
router.post("/", authorize(ROLE.ADMIN), controller.createTaskStatus);
router.put("/:id", authorize(ROLE.ADMIN), controller.updateTaskStatus);
router.delete("/:id", authorize(ROLE.ADMIN), controller.deleteTaskStatus);

module.exports = router;

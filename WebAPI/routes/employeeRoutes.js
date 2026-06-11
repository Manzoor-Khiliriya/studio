const express = require("express");
const router = express.Router();
const employeeController = require("../controllers/employeeController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");
const { ROLE } = require("../utils/constant");

router.use(authenticate);

router.get("/active-list", authorize(ROLE.ADMIN, ROLE.MANAGER), employeeController.getAssignableUsers);
router.get("/", authorize(ROLE.ADMIN), employeeController.getAllEmployees);
router.get("/:userId", authorize(ROLE.ADMIN), employeeController.getEmployeeProfile);
router.get("/my/profile", employeeController.getMyEmployeeProfile);

module.exports = router;


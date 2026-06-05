const express = require("express");
const router = express.Router();
const {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} = require("../controllers/departmentController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");

router.use(authenticate);

router.get("/", authorize("Admin"), getDepartments);
router.post("/", authorize("Admin"), createDepartment);
router.put("/:id", authorize("Admin"), updateDepartment);
router.delete("/:id", authorize("Admin"), deleteDepartment);

module.exports = router;
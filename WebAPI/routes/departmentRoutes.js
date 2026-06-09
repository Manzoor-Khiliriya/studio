const express = require("express");
const router = express.Router();
const {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} = require("../controllers/departmentController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");
const { ROLE } = require("../utils/constant");

router.use(authenticate);

router.get("/", authorize(ROLE.ADMIN), getDepartments);
router.post("/", authorize(ROLE.ADMIN), createDepartment);
router.put("/:id", authorize(ROLE.ADMIN), updateDepartment);
router.delete("/:id", authorize(ROLE.ADMIN), deleteDepartment);

module.exports = router;
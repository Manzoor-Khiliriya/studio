const express = require("express");
const router = express.Router();
const leaveController = require("../controllers/leaveController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");
const { ROLE } = require("../utils/constant");

router.use(authenticate);

router.post("/apply", leaveController.applyLeave);
router.get("/my-leaves", leaveController.getMyLeaves);
router.put("/update/:id", leaveController.updateLeave);

router.get("/all", authorize(ROLE.ADMIN, ROLE.MANAGER, ROLE.GAD_MANAGER, ROLE.GAD_EMPLOYEE, ROLE.HR_MANAGER, ROLE.HR_EMPLOYEE), leaveController.getAllLeaves);
router.patch("/process/:id", authorize(ROLE.ADMIN, ROLE.HR_MANAGER, ROLE.GAD_MANAGER, ROLE.MANAGER), leaveController.processLeave);
router.delete("/delete/:id", leaveController.deleteLeave);

router.get("/settings", authorize(ROLE.ADMIN), leaveController.getLeaveSettings);
router.put("/settings", authorize(ROLE.ADMIN), leaveController.updateLeaveSettings);
router.get("/calendar", authorize(ROLE.ADMIN, ROLE.HR_MANAGER), leaveController.getLeaveCalendar);
router.put("/adjust-annual", authorize(ROLE.ADMIN), leaveController.updateEarnedAdjustment);

module.exports = router;

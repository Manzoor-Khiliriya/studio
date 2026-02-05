const express = require("express");
const router = express.Router();
const leaveController = require("../controllers/leaveController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");

router.use(authenticate);

router.post("/apply", leaveController.applyLeave);
router.get("/my-leaves", leaveController.getMyLeaves);
router.put("/update/:id", leaveController.updateLeave);
router.delete("/cancel/:id", leaveController.deleteLeave);

router.get("/all", authorize("Admin"), leaveController.getAllLeaves);
router.patch("/process/:id", authorize("Admin"), leaveController.processLeave);
router.delete("/admin/delete/:id", authorize("Admin"), leaveController.deleteLeave);

module.exports = router;

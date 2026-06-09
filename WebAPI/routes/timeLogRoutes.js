const express = require("express");
const router = express.Router();
const timeLogController = require("../controllers/timeLogController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");
const { ROLE } = require("../utils/constant");

router.use(authenticate);

router.post("/start", authorize(ROLE.ADMIN, ROLE.EMPLOYEE, ROLE.MANAGER), timeLogController.startTimer);
router.post("/pause", authorize(ROLE.ADMIN, ROLE.EMPLOYEE, ROLE.MANAGER), timeLogController.togglePause);
router.post("/stop", authorize(ROLE.ADMIN, ROLE.EMPLOYEE, ROLE.MANAGER), timeLogController.stopTimer);
router.get("/my", authorize(ROLE.ADMIN, ROLE.EMPLOYEE, ROLE.MANAGER), timeLogController.getMyLogs);

router.post(
  "/stop-all",
  authorize(ROLE.ADMIN),
  timeLogController.stopAllLiveSessions,
);

router.post("/clear-all", authorize(ROLE.ADMIN), timeLogController.clearLogs);

module.exports = router;

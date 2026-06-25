const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middlewares/authMiddleware");
const {
  getMyNotifications,
  markAllAsRead,
  deleteNotification,
  markNotificationRead,
} = require("../controllers/notificationController");
const { ROLE } = require("../utils/constant");

router.get("/", authenticate, getMyNotifications);
router.patch("/mark-read", authenticate, markAllAsRead);
router.patch("/:id/read", authenticate, markNotificationRead);
router.delete("/:id", authenticate, authorize(ROLE.ADMIN), deleteNotification);

module.exports = router;

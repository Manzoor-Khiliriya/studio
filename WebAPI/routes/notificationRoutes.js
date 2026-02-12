const express = require("express");
const router = express.Router();
const { authenticate } = require("../middlewares/authMiddleware"); // Ensure this matches your auth middleware path
const { 
  getMyNotifications, 
  markAllAsRead, 
  deleteNotification 
} = require("../controllers/notificationController");

router.get("/", authenticate, getMyNotifications);
router.patch("/mark-read", authenticate, markAllAsRead);
router.delete("/:id", authenticate, deleteNotification);

module.exports = router;
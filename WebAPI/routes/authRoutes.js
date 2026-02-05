const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authenticate } = require("../middlewares/authMiddleware");

// Public
router.post("/login", authController.login);

// Logged-in user actions
router.get("/my-profile", authenticate, authController.getMe);
router.post("/reset-password", authenticate, authController.resetPassword);

module.exports = router;

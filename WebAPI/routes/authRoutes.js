const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authenticate } = require("../middlewares/authMiddleware");

// --- PUBLIC ROUTES (No login required) ---

// Login
router.post("/login", authController.login);

// Step 1: Request the reset (sends email/OTP)
router.post("/forgot-password", authController.forgotPassword);

// Step 2: Update the password using the OTP
// REMOVED 'authenticate' because the user doesn't have a token yet
router.post("/reset-password", authController.resetPassword);


// --- PROTECTED ROUTES (Login required) ---

// Get profile
// router.get("/my-profile", authenticate, authController.getMe);

module.exports = router;
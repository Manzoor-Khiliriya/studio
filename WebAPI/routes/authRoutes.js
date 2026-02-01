const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authenticate } = require("../middlewares/authMiddleware");

// Public route: Login
router.post("/login", authController.login);

/** * Protected route: Reset Password
 * Only a logged-in user can change their own password
 */
router.post("/reset-password", authenticate, authController.resetPassword);

module.exports = router;
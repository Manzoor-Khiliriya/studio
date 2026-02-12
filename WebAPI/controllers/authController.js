const User = require("../models/User");
const {
  hashPassword,
  generateToken,
  comparePassword,
} = require("../utils/authHelpers");
const { sanitizeUser } = require("../utils/userHelpers");
const sendNotification = require("../utils/notifier"); // Your utility


/**
 * LOGIN
 */
exports.login = async (req, res) => {
  try {
    const email = req.body.email?.toLowerCase().trim();
    const { password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await User.findOne({ email })
      .select("+password")
      .populate("employee");

    // Avoid telling attacker what failed
    if (!user || !(await comparePassword(password, user.password))) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!user.isActive()) {
      return res.status(403).json({ message: "Account disabled. Contact admin." });
    }

    const token = generateToken(user);

    res.json({
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET CURRENT USER (Used after page reload)
 */
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password")
      .populate("employee");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(sanitizeUser(user));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate code and expiry
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordToken = otp;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; 
    await user.save();

    // Trigger the notification utility
    // req.app.get("socketio") pulls the 'io' instance you set in server.js
    await sendNotification(
      user, 
      {
        type: "reset",
        otp: otp,
        message: "A password reset verification code has been sent to your email."
      },
      req.app.get("socketio") 
    );

    res.json({ message: "Verification code sent to your email" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * RESET PASSWORD - Step 2
 * Verify OTP and update password
 */
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "All fields (email, code, new password) are required" });
    }

    // 1. Find user with matching email, valid token, and token not expired
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      resetPasswordToken: otp,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired verification code" });
    }

    // 2. Hash new password and clear reset fields
    user.password = await hashPassword(newPassword);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({ message: "Password reset successful. You can now log in." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

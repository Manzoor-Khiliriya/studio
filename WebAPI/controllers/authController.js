const User = require("../models/User");
const {
  hashPassword,
  generateToken,
  comparePassword,
} = require("../utils/authHelpers");
const { sanitizeUser } = require("../utils/userHelpers");

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

/**
 * CHANGE / RESET PASSWORD (Logged-in user)
 */
exports.resetPassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "Both passwords required" });
    }

    const user = await User.findById(req.user._id).select("+password");
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await comparePassword(oldPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: "Current password incorrect" });

    user.password = await hashPassword(newPassword);
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

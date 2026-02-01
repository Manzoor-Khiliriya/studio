const User = require("../models/User");
const { 
  hashPassword, 
  generateToken, 
  comparePassword 
} = require("../utils/authHelpers"); // Updated import
const { sanitizeUser } = require("../utils/userHelpers");

// --- LOGIN ---
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find user & include password
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    // 2. Check status via Model Method
    if (!user.isActive()) {
      return res.status(403).json({ message: "Account disabled. Contact admin." });
    }

    // 3. Verify Password via Helper
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // 4. Generate Token via Helper
    const token = generateToken(user);

    res.json({ 
      token, 
      user: sanitizeUser(user) 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- RESET PASSWORD ---
exports.resetPassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    
    // Find user (req.user.id populated by protect middleware)
    const user = await User.findById(req.user.id).select("+password");
    if (!user) return res.status(404).json({ message: "User not found" });

    // Verify current password using Helper
    const isMatch = await comparePassword(oldPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: "Current password incorrect" });

    // Hash and update
    user.password = await hashPassword(newPassword);
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const { verifyToken } = require("../utils/authHelpers");
const User = require("../models/User");

/**
 * AUTHENTICATE USER
 */
exports.authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    const user = await User.findById(decoded.id)
      .select("-password -__v")
      .populate("employee");

    if (!user) {
      return res.status(401).json({ message: "Invalid session" });
    }

    if (!user.isActive()) {
      return res.status(403).json({ message: "Account disabled. Contact admin." });
    }

    req.user = user;
    next();
  } catch (err) {
    let message = "Invalid token";

    if (err.name === "TokenExpiredError") {
      message = "Session expired. Please login again.";
    }

    res.status(401).json({ message });
  }
};

/**
 * AUTHORIZE ROLES
 */
exports.authorize = (...roles) => {
  const allowed = roles.map(r => r.toLowerCase());

  return (req, res, next) => {
    if (!req.user) {
      return res.status(500).json({ message: "Authentication flow error" });
    }

    if (!allowed.includes(req.user.role.toLowerCase())) {
      return res.status(403).json({ message: "Forbidden: Access restricted" });
    }

    next();
  };
};

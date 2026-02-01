const jwt = require("jsonwebtoken");
const User = require("../models/User"); // Path to your User model

exports.authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user to check if they were disabled by Admin
    const currentUser = await User.findById(decoded.id);

    if (!currentUser) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    if (currentUser.status === "Disable") {
      return res.status(403).json({ message: "Your account has been disabled. Contact Admin." });
    }

    // Attach full user object (or specific fields) to request
    req.user = currentUser;
    next();
  } catch (err) {
    const message = err.name === "TokenExpiredError" ? "Token expired" : "Invalid token";
    return res.status(401).json({ message });
  }
};

/**
 * Middleware to restrict access based on roles
 * Usage: router.post("/task", authenticate, authorize("admin"), createTask)
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Role (${req.user.role}) is not authorized to access this resource` 
      });
    }
    next();
  };
};
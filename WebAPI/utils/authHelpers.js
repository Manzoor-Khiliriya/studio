const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const SALT_ROUNDS = 12; // stronger than 10, still performant

/**
 * Hash password
 */
exports.hashPassword = async (password) => {
  if (!password) throw new Error("Password is required");
  return bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compare password
 */
exports.comparePassword = async (password, hashedPassword) => {
  if (!password || !hashedPassword) return false;
  return bcrypt.compare(password, hashedPassword);
};

/**
 * Generate JWT
 */
exports.generateToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET not configured");
  }

  return jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
      issuer: "work-management-system",
    }
  );
};

/**
 * Verify JWT
 */
exports.verifyToken = (token) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET not configured");
  }
  return jwt.verify(token, process.env.JWT_SECRET);
};

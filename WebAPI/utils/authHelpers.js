const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

/**
 * Generates a secure hash for a plain text password
 * @param {string} password 
 * @returns {Promise<string>}
 */
exports.hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

/**
 * Compares a plain text password with a hashed password
 * @param {string} password 
 * @param {string} hashedPassword 
 * @returns {Promise<boolean>}
 */
exports.comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};


/**
 * Generates a JWT token for a user
 * @param {Object} user - The user object from the database
 * @returns {string} - Signed JWT token
 */
exports.generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id, 
      role: user.role, 
      email: user.email 
    },
    process.env.JWT_SECRET,
    { 
      expiresIn: process.env.JWT_EXPIRES_IN || "7d" 
    }
  );
};

/**
 * Verifies a JWT token
 * @param {string} token 
 * @returns {Object} - Decoded payload
 */
exports.verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};
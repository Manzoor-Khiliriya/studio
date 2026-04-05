const Employee = require("../models/Employee");

/**
 * Remove sensitive fields before sending user object
 */
exports.sanitizeUser = (user) => {
  if (!user) return null;

  const userObj = user.toObject ? user.toObject({ virtuals: true }) : { ...user };

  delete userObj.password;
  delete userObj.__v;

  if (userObj.employee) {
    delete userObj.employee.user;
    delete userObj.employee.__v;
  }

  return userObj;
};

/**
 * Validate required fields in request body
 */
exports.validateRequiredFields = (body, fields = []) => {
  for (const field of fields) {
    const value = body[field];
    if (value === undefined || value === null || String(value).trim() === "") {
      return `Field '${field}' is required.`;
    }
  }
  return null;
};

/**
 * Role helpers
 */
exports.isActiveAdmin = (user) =>
  user?.role === "Admin" && user?.status === "Enable";

exports.isActiveEmployee = (user) =>
  user?.role === "Employee" && user?.status === "Enable";

// utils/applyProficiency.js

exports.applyProficiency = async (userId, rawSeconds) => {
  const employee = await Employee.findOne({ user: userId });
  const proficiency = employee?.proficiency ?? 100;
  const adjustedSeconds = Math.round(rawSeconds * (proficiency / 100));
  return { rawSeconds, adjustedSeconds };
};

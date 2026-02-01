/**
 * Checks if all required fields exist in the request body
 * @param {Object} body - req.body
 * @param {Array} fields - Array of strings (field names)
 * @returns {String | null} - Error message or null if valid
 */
exports.validateRequiredFields = (body, fields) => {
  for (const field of fields) {
    if (!body[field] || body[field].toString().trim() === "") {
      return `Field '${field}' is required.`;
    }
  }
  return null;
};

/**
 * Removes sensitive data like password before sending to frontend
 */
exports.sanitizeUser = (user) => {
  const userObj = user.toObject();
  delete userObj.password;
  return userObj;
};

/**
 * Checks if a user is both an Admin and Enabled
 */
exports.isActiveAdmin = (user) => {
  return user && user.role === "Admin";
};

/**
 * Checks if a user is both an Employee and Enabled
 */
exports.isActiveEmployee = (user) => {
  return user && user.role === "Employee" && user.status === "Enable";
};
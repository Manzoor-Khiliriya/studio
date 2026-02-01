const User = require("../models/User");
const Task = require("../models/Task");
const Leave = require("../models/Leave");
const { isActiveAdmin } = require("../utils/userHelpers");

/**
 * 🔍 GLOBAL SEARCH (Admin Only)
 * Searches across Users, Tasks, and Leaves
 */
exports.globalSearch = async (req, res) => {
  try {
    // 1. Security Check
    if (!isActiveAdmin(req.user)) {
      return res.status(403).json({ message: "Search restricted to Active Admins." });
    }

    const { query } = req.query;
    if (!query || query.length < 2) {
      return res.status(400).json({ message: "Search query must be at least 2 characters." });
    }

    // Case-insensitive regex for partial matching
    const searchRegex = new RegExp(query, "i");

    // 2. Parallel Search across collections
    const [users, tasks, leaves] = await Promise.all([
      // Search Users by Name, Email, or Designation
      User.find({
        $or: [
          { name: searchRegex },
          { email: searchRegex },
          { designation: searchRegex }
        ]
      }).select("name email designation status").limit(5),

      // Search Tasks by Title or Project Number
      Task.find({
        $or: [
          { title: searchRegex },
          { projectNumber: searchRegex }
        ]
      }).select("title projectNumber status endDate").limit(5),

      // Search Leaves by Reason or Type (populated with User name)
      Leave.find({
        $or: [
          { reason: searchRegex },
          { type: searchRegex }
        ]
      })
      .populate("user", "name")
      .select("user type status startDate")
      .limit(5)
    ]);

    // 3. Format and Return Results
    res.json({
      results: {
        employees: users,
        projects: tasks,
        leaveRequests: leaves.map(l => ({
          _id: l._id,
          employeeName: l.user?.name,
          type: l.type,
          status: l.status,
          date: l.startDate
        }))
      },
      totalCount: users.length + tasks.length + leaves.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
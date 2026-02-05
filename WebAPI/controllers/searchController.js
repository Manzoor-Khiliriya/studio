const User = require("../models/User");
const Employee = require("../models/Employee");
const Task = require("../models/Task");
const Leave = require("../models/Leave");

exports.globalSearch = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({ message: "Search query must be at least 2 characters." });
    }

    const searchRegex = new RegExp(query, "i");

    /* ================= USERS + EMPLOYEE PROFILE ================= */
    const employees = await Employee.find({ designation: searchRegex })
      .populate({
        path: "user",
        match: { $or: [{ name: searchRegex }, { email: searchRegex }] },
        select: "name email status"
      })
      .limit(5)
      .lean();

    const users = employees
      .filter(e => e.user)
      .map(e => ({
        _id: e.user._id,
        name: e.user.name,
        email: e.user.email,
        designation: e.designation,
        status: e.user.status,
        type: "employee"
      }));

    /* ================= TASKS ================= */
    const tasks = await Task.find({
      $or: [
        { title: searchRegex },
        { projectNumber: searchRegex }
      ]
    })
      .select("title projectNumber status endDate")
      .limit(5)
      .lean();

    const formattedTasks = tasks.map(t => ({
      _id: t._id,
      title: t.title,
      projectNumber: t.projectNumber,
      status: t.status,
      endDate: t.endDate,
      type: "task"
    }));

    /* ================= LEAVES ================= */
    const leaves = await Leave.find({
      $or: [
        { reason: searchRegex },
        { type: searchRegex }
      ]
    })
      .populate("user", "name")
      .select("user type status startDate")
      .limit(5)
      .lean();

    const formattedLeaves = leaves.map(l => ({
      _id: l._id,
      employeeName: l.user?.name,
      leaveType: l.type,
      status: l.status,
      startDate: l.startDate,
      type: "leave"
    }));

    res.json({
      results: [
        ...users,
        ...formattedTasks,
        ...formattedLeaves
      ],
      totalCount: users.length + formattedTasks.length + formattedLeaves.length
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

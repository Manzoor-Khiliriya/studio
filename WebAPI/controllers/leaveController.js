const Leave = require("../models/Leave");
const User = require("../models/User");
const Employee = require("../models/Employee");
const { calculateLeaveDays, hasLeaveOverlap } = require("../utils/leaveHelpers");

/* ================= EMPLOYEE ================= */

exports.getMyLeaves = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 5, type, status } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // --- 1. BUILD QUERY OBJECT ---
    let query = { user: userId };
    
    // Add dynamic filters from frontend
    if (type && type !== "All") query.type = type;
    if (status && status !== "All") query.status = status;

    // --- 2. FETCH FILTERED DATA ---
    const totalLeaves = await Leave.countDocuments(query);
    const leaves = await Leave.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // --- 3. CALCULATE STATS (Global, not paginated) ---
    const employee = await Employee.findOne({ user: userId });
    const user = await User.findById(userId);

    const joinDate = employee?.joinedDate || user.createdAt;
    const now = new Date();
    const months = (now.getFullYear() - joinDate.getFullYear()) * 12 +
                   (now.getMonth() - joinDate.getMonth());

    // Matches your applyLeave logic (14 days per year)
    const earned = months * (14 / 12);

    // Calculate taken days across ALL approved Annual Leaves
    const allApproved = await Leave.find({ 
      user: userId, 
      status: "Approved", 
      type: "Annual Leave" 
    });
    
    let taken = 0;
    for (const l of allApproved) {
      taken += await calculateLeaveDays(l.startDate, l.endDate);
    }

    // --- 4. FORMAT HISTORY ---
    const history = await Promise.all(leaves.map(async l => ({
      ...l.toObject(),
      businessDays: await calculateLeaveDays(l.startDate, l.endDate)
    })));

    res.json({ 
      history, 
      stats: { 
        earned: +earned.toFixed(1), 
        taken, 
        remaining: +(earned - taken).toFixed(1) 
      },
      pagination: {
        totalLeaves,
        totalPages: Math.ceil(totalLeaves / parseInt(limit)),
        currentPage: parseInt(page)
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.applyLeave = async (req, res) => {
  try {
    const { type, startDate, endDate, reason } = req.body;
    const userId = req.user._id;

    const requestedDays = await calculateLeaveDays(startDate, endDate);
    if (!requestedDays) return res.status(400).json({ message: "Selected range invalid." });

    const existing = await Leave.find({ user: userId, status: { $ne: "Rejected" } });
    if (hasLeaveOverlap(existing, startDate, endDate))
      return res.status(400).json({ message: "Overlap with existing leave." });

    if (type === "Annual Leave") {
      const employee = await Employee.findOne({ user: userId });
      const joinDate = employee?.joinedDate || req.user.createdAt;

      const months = (new Date().getFullYear() - joinDate.getFullYear()) * 12 +
                     (new Date().getMonth() - joinDate.getMonth());

      const earned = months * (14 / 12);

      let taken = 0;
      const approved = await Leave.find({ user: userId, status: "Approved", type: "Annual Leave" });
      for (const l of approved) taken += await calculateLeaveDays(l.startDate, l.endDate);

      if (requestedDays > (earned - taken))
        return res.status(400).json({ message: "Insufficient leave balance." });
    }

    const leave = await Leave.create({ user: userId, type, startDate, endDate, reason });
    res.status(201).json(leave);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= ADMIN ================= */

exports.getAllLeaves = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (status && status !== "All") query.status = status;

    if (search) {
      const users = await User.find({ name: { $regex: search, $options: "i" } }).select("_id");
      const userIds = users.map(u => u._id);
      query.user = { $in: userIds };
    }

    const totalLeaves = await Leave.countDocuments(query);
    const leaves = await Leave.find(query)
      .populate({ 
        path: "user", 
        select: "name email", 
        populate: { path: "employee", select: "designation" } 
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    res.json({
      leaves,
      pagination: {
        totalLeaves,
        totalPages: Math.ceil(totalLeaves / parseInt(limit)),
        currentPage: parseInt(page)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.processLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave || leave.status !== "Pending")
      return res.status(400).json({ message: "Invalid request" });

    leave.status = req.body.status;
    leave.adminComment = req.body.adminComment;
    leave.processedBy = req.user._id;

    await leave.save();
    res.json(leave);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Exports for other methods remain the same...
exports.updateLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ message: "Not found" });

    if (leave.user.toString() !== req.user._id.toString() || leave.status !== "Pending")
      return res.status(403).json({ message: "Unauthorized" });

    Object.assign(leave, req.body);

    const existing = await Leave.find({ user: req.user._id, status: { $ne: "Rejected" }, _id: { $ne: leave._id } });
    if (hasLeaveOverlap(existing, leave.startDate, leave.endDate))
      return res.status(400).json({ message: "Overlap detected" });

    await leave.save();
    res.json(leave);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ message: "Not found" });

    const isAdmin = req.user.role === "Admin";
    const isOwner = leave.user.toString() === req.user._id.toString();

    if (!isAdmin && (!isOwner || leave.status !== "Pending"))
      return res.status(403).json({ message: "Unauthorized" });

    await Leave.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
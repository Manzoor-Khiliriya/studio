const Leave = require("../models/Leave");
const User = require("../models/User");
const Employee = require("../models/Employee");
const LeaveSetting = require("../models/LeaveSetting");
const { calculateLeaveDays, hasLeaveOverlap } = require("../utils/leaveHelpers");

// Helper to get current global settings
const getActiveSettings = async () => {
  let settings = await LeaveSetting.findOne({ key: "leave_settings" });
  if (!settings) {
    settings = await LeaveSetting.create({ key: "leave_settings", annualLeaveRate: 1.5, yearlySickQuota: 18 });
  }
  return settings;
};

/* ================= EMPLOYEE ================= */

exports.getMyLeaves = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 5, type, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch dynamic settings
    const settings = await getActiveSettings();

    let query = { user: userId };
    if (type && type !== "All") query.type = type;
    if (status && status !== "All") query.status = status;

    const totalLeaves = await Leave.countDocuments(query);
    const leaves = await Leave.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit));

    const employee = await Employee.findOne({ user: userId });
    const user = await User.findById(userId);

    const joinDate = employee?.joinedDate || user.createdAt;
    const now = new Date();
    const months = (now.getFullYear() - joinDate.getFullYear()) * 12 + (now.getMonth() - joinDate.getMonth());

    // Use dynamic annual rate
    const earned = months * settings.annualLeaveRate;

    const allApproved = await Leave.find({ 
      user: userId, 
      status: "Approved", 
      type: "Annual Leave" 
    });
    
    let taken = 0;
    for (const l of allApproved) {
      taken += await calculateLeaveDays(l.startDate, l.endDate);
    }

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
    const settings = await getActiveSettings();

    const requestedDays = await calculateLeaveDays(startDate, endDate);
    if (!requestedDays) return res.status(400).json({ message: "Selected range invalid." });

    const existing = await Leave.find({ user: userId, status: { $ne: "Rejected" } });
    if (hasLeaveOverlap(existing, startDate, endDate))
      return res.status(400).json({ message: "Overlap with existing leave." });

    if (type === "Annual Leave") {
      const employee = await Employee.findOne({ user: userId });
      const joinDate = employee?.joinedDate || req.user.createdAt;

      const months = (new Date().getFullYear() - joinDate.getFullYear()) * 12 + (new Date().getMonth() - joinDate.getMonth());
      
      // Use dynamic annual rate
      const earned = months * settings.annualLeaveRate;

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
    const { status, search, page = 1, limit = 10, view = "requests" } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const settings = await getActiveSettings();

    if (view === "requests") {
      let query = {};
      if (status && status !== "All") query.status = status;
      if (search) {
        const users = await User.find({ name: { $regex: search, $options: "i" } }).select("_id");
        query.user = { $in: users.map((u) => u._id) };
      }

      const totalLeaves = await Leave.countDocuments(query);
      const leaves = await Leave.find(query)
        .populate({
          path: "user",
          select: "name email",
          populate: { path: "employee", select: "designation joinedDate" },
        })
        .sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean();

      return res.json({
        leaves,
        pagination: { totalLeaves, totalPages: Math.ceil(totalLeaves / parseInt(limit)), currentPage: parseInt(page) },
      });
    }

    if (view === "quota") {
      const now = new Date();
      const currentYear = now.getFullYear();
      let userQuery = {};
      if (search) userQuery.name = { $regex: search, $options: "i" };

      const users = await User.find(userQuery).select("name createdAt").populate("employee").lean();

      const quotaData = await Promise.all(users.map(async (user) => {
        const employee = user.employee;
        const joinDate = new Date(employee?.joinedDate || user.createdAt);

        // Annual Calculation using Settings
        const months = (now.getFullYear() - joinDate.getFullYear()) * 12 + (now.getMonth() - joinDate.getMonth());
        const annualEarned = +(months * settings.annualLeaveRate).toFixed(1);

        const approvedAnnual = await Leave.find({ user: user._id, status: "Approved", type: "Annual Leave" });
        let annualTaken = 0;
        for (const l of approvedAnnual) annualTaken += await calculateLeaveDays(l.startDate, l.endDate);

        // Sick/Casual Calculation using Settings
        const approvedSickCasual = await Leave.find({
          user: user._id,
          status: "Approved",
          type: { $in: ["Sick Leave", "Casual Leave"] },
          startDate: { $gte: new Date(`${currentYear}-01-01`), $lte: new Date(`${currentYear}-12-31`) },
        });

        let sickTaken = 0;
        for (const l of approvedSickCasual) sickTaken += await calculateLeaveDays(l.startDate, l.endDate);

        return {
          employee: { user: { name: user.name }, designation: employee?.designation || "Operator" },
          annualEarned,
          annualTaken,
          annualRemaining: +(annualEarned - annualTaken).toFixed(1),
          sickQuota: settings.yearlySickQuota,
          sickTaken,
          sickRemaining: settings.yearlySickQuota - sickTaken,
        };
      }));

      const paginatedQuota = quotaData.slice(skip, skip + parseInt(limit));
      return res.json({
        leaves: paginatedQuota,
        pagination: { totalLeaves: quotaData.length, totalPages: Math.ceil(quotaData.length / parseInt(limit)), currentPage: parseInt(page) },
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ... processLeave, updateLeave, deleteLeave remain same ...

exports.getLeaveSettings = async (req, res) => {
  try {
    const settings = await getActiveSettings();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateLeaveSettings = async (req, res) => {
  try {
    const { annualLeaveRate, yearlySickQuota } = req.body;
    const settings = await LeaveSetting.findOneAndUpdate(
      { key: "leave_settings" },
      { annualLeaveRate, yearlySickQuota, updatedBy: req.user._id },
      { upsert: true, new: true }
    );
    res.json(settings);
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
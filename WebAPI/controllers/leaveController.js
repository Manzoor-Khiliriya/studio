const Leave = require("../models/Leave");
const User = require("../models/User");
const Employee = require("../models/Employee");
const { calculateLeaveDays, hasLeaveOverlap } = require("../utils/leaveHelpers");

/* ================= EMPLOYEE ================= */

exports.getMyLeaves = async (req, res) => {
  try {
    const userId = req.user._id;
    const leaves = await Leave.find({ user: userId }).sort({ createdAt: -1 });

    const employee = await Employee.findOne({ user: userId });
    const user = await User.findById(userId);

    const joinDate = employee?.joinedDate || user.createdAt;
    const months = (new Date().getFullYear() - joinDate.getFullYear()) * 12 +
                   (new Date().getMonth() - joinDate.getMonth());

    const earned = months * (14 / 12);

    let taken = 0;
    const approved = leaves.filter(l => l.status === "Approved" && l.type === "Annual Leave");
    for (const l of approved) taken += await calculateLeaveDays(l.startDate, l.endDate);

    const history = await Promise.all(leaves.map(async l => ({
      ...l.toObject(),
      businessDays: await calculateLeaveDays(l.startDate, l.endDate)
    })));

    res.json({ history, stats: { earned, taken, remaining: +(earned - taken).toFixed(1) } });

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

      if (requestedDays > earned - taken)
        return res.status(400).json({ message: "Insufficient leave balance." });
    }

    const leave = await Leave.create({ user: userId, type, startDate, endDate, reason });
    res.status(201).json(leave);

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

/* ================= ADMIN ================= */

exports.getAllLeaves = async (req, res) => {
  const { status, search } = req.query;

  let leaves = await Leave.find(status && status !== "All" ? { status } : {})
    .populate({ path: "user", select: "name email", populate: { path: "employee", select: "designation" } })
    .sort({ createdAt: -1 })
    .lean();

  if (search) leaves = leaves.filter(l => l.user?.name.toLowerCase().includes(search.toLowerCase()));

  res.json(leaves);
};

exports.processLeave = async (req, res) => {
  const leave = await Leave.findById(req.params.id);
  if (!leave || leave.status !== "Pending")
    return res.status(400).json({ message: "Invalid request" });

  leave.status = req.body.status;
  leave.adminComment = req.body.adminComment;
  leave.processedBy = req.user._id;

  await leave.save();
  res.json(leave);
};

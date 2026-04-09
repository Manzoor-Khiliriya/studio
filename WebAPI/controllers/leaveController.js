const Leave = require("../models/Leave");
const User = require("../models/User");
const Employee = require("../models/Employee");
const LeaveSetting = require("../models/LeaveSetting");
const { calculateLeaveDays, hasLeaveOverlap } = require("../utils/leaveHelpers");
const sendNotification = require("../utils/notifier");

const getLeaveSetting = async (type) => {
  try {
    const settings = await LeaveSetting.findOne({ leaveType: type });
    return settings;
  } catch (err) {
    throw new Error(err.message);
  }
};

const getTakenDays = async (userId, type, currentYearOnly = true) => {
  let query = { user: userId, status: "Approved", type: type };

  if (currentYearOnly) {
    const currentYear = new Date().getFullYear();
    query.startDate = {
      $gte: new Date(`${currentYear}-01-01`),
      $lte: new Date(`${currentYear}-12-31`)
    };
  }

  const leaves = await Leave.find(query);
  let total = 0;
  for (const l of leaves) {
    total += await calculateLeaveDays(l.startDate, l.endDate);
  }
  return total;
};

exports.getMyLeaves = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 5, type, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const employee = await Employee.findOne({ user: userId });
    const user = await User.findById(userId);
    const joinDate = employee?.joinedDate || user.createdAt;
    const now = new Date();

    const settings = await LeaveSetting.find();

    const t = "Annual Leave";
    const setting = settings.find(s => s.leaveType === t);

    const months = (now.getFullYear() - joinDate.getFullYear()) * 12 + (now.getMonth() - joinDate.getMonth());
    const earned = setting ? (months * setting.accrualRate) : 0;
    const taken = await getTakenDays(userId, t, false);

    const balances = {
      "Annual Leave": {
        earned: +earned.toFixed(1),
        taken,
        remaining: +(earned - taken).toFixed(1),
        type: "accrual"
      }
    };

    let query = { user: userId };
    if (type && type !== "All") query.type = type;
    if (status && status !== "All") query.status = status;

    const totalLeaves = await Leave.countDocuments(query);
    const leaves = await Leave.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit));

    const history = await Promise.all(
      leaves.map(async (l) => ({
        ...l.toObject(),
        businessDays: await calculateLeaveDays(l.startDate, l.endDate)
      }))
    );

    res.json({
      history,
      balances: {
        "annualLeave": balances["Annual Leave"]
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
    if (!requestedDays || requestedDays <= 0) return res.status(400).json({ message: "Invalid date range." });

    const existing = await Leave.find({ user: userId, status: { $ne: "Rejected" } });
    if (hasLeaveOverlap(existing, startDate, endDate)) return res.status(400).json({ message: "Overlap with existing leave." });

    const setting = await getLeaveSetting(type);

    if (type === "Annual Leave") {
      const employee = await Employee.findOne({ user: userId });
      const joinDate = employee?.joinedDate || req.user.createdAt;
      const months = (new Date().getFullYear() - joinDate.getFullYear()) * 12 + (new Date().getMonth() - joinDate.getMonth());
      const earned = setting ? months * setting.accrualRate : 0;
      const taken = await getTakenDays(userId, "Annual Leave", false);
      if (requestedDays > (earned - taken)) return res.status(400).json({ message: "Insufficient Annual Leave balance." });

    } else if (!["LOP", "Casual Leave"].includes(type)) {
      const taken = await getTakenDays(userId, type, true);
      const quota = setting ? setting.yearlyQuota : 10;
      if (taken + requestedDays > quota) {
        return res.status(400).json({ message: `${type} quota (${quota} days) exceeded. You have ${quota - taken} days left.` });
      }
    }

    const leave = await Leave.create({ user: userId, type, startDate, endDate, reason });
    res.status(201).json(leave);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllLeaves = async (req, res) => {
  try {
    const {
      status,
      search,
      page = 1,
      limit = 10,
      view = "requests",
      dateRange,
      startDate: customStart,
      endDate: customEnd
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    let filterStart = null;
    let filterEnd = null;

    if (dateRange && dateRange !== "all") {
      const now = new Date();
      // Reset 
      const start = new Date();
      const end = new Date();

      if (dateRange === "today") {
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
      }
      else if (dateRange === "upcoming") {
        start.setDate(start.getDate() + 1);
        start.setHours(0, 0, 0, 0);
        end.setFullYear(now.getFullYear() + 2);
      }
      else if (dateRange === "current-week") {
        // Logic: Monday to Sunday
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        start.setDate(diff);
        start.setHours(0, 0, 0, 0);

        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
      }
      else if (dateRange === "last-week") {
        // Previous Monday to Previous Sunday
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1) - 7;
        start.setDate(diff);
        start.setHours(0, 0, 0, 0);

        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
      }
      else if (dateRange === "current-month") {
        start.setDate(1); // First of this month
        start.setHours(0, 0, 0, 0);
        end.setMonth(now.getMonth() + 1, 0); // Last day of this month
        end.setHours(23, 59, 59, 999);
      }
      else if (dateRange === "last-month") {
        start.setMonth(now.getMonth() - 1, 1); // First of last month
        start.setHours(0, 0, 0, 0);
        end.setMonth(now.getMonth(), 0); // Last day of last month
        end.setHours(23, 59, 59, 999);
      }
      else if (dateRange === "custom" && customStart && customEnd) {
        start.setTime(new Date(customStart).getTime());
        start.setHours(0, 0, 0, 0);
        end.setTime(new Date(customEnd).getTime());
        end.setHours(23, 59, 59, 999);
      }

      filterStart = start;
      filterEnd = end;
    }

    // --- VIEW 1: REQUESTS (Filtered & Sorted by CREATED date) ---
    if (view === "requests") {
      let query = {};
      if (filterStart && filterEnd) {
        query.createdAt = { $gte: filterStart, $lte: filterEnd };
      }

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
          populate: { path: "employee", select: "employeeCode designation" }
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      const processedLeaves = await Promise.all(leaves.map(async (l) => ({
        ...l,
        duration: await calculateLeaveDays(l.startDate, l.endDate)
      })));


      return res.json({
        leaves: processedLeaves,
        pagination: { totalLeaves, totalPages: Math.ceil(totalLeaves / parseInt(limit)), currentPage: parseInt(page) }
      });
    }

    // --- VIEW 2: CASUAL & LOP (Filtered & Sorted by START date) ---
    if (view === "casual-lop") {
      let query = { type: { $in: ["Casual Leave", "LOP"] }, status: "Approved" };

      if (filterStart && filterEnd) {
        query.startDate = { $gte: filterStart, $lte: filterEnd };
      }

      if (search) {
        const users = await User.find({ name: { $regex: search, $options: "i" } }).select("_id");
        query.user = { $in: users.map((u) => u._id) };
      }

      const totalLeaves = await Leave.countDocuments(query);
      const leavesRaw = await Leave.find(query)
        .populate({
          path: "user",
          select: "name email",
          populate: { path: "employee", select: "employeeCode designation" }
        })
        .sort({ startDate: -1 }) // Sort by when the leave actually happens
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      const leaves = await Promise.all(leavesRaw.map(async (l) => ({
        ...l,
        duration: await calculateLeaveDays(l.startDate, l.endDate)
      })));

      return res.json({
        leaves,
        pagination: { totalLeaves, totalPages: Math.ceil(totalLeaves / parseInt(limit)), currentPage: parseInt(page) }
      });
    }

    // --- VIEW 3: QUOTA ---
    if (view === "quota") {
      // UPDATED: Added { role: "employee" } to the query
      const userQuery = { role: "Employee" };
      if (search) {
        userQuery.name = { $regex: search, $options: "i" };
      }

      const users = await User.find(userQuery).populate("employee").lean();

      const settings = await LeaveSetting.find();
      const leaveTypes = ["Annual Leave", "Sick Leave", "Bereavement Leave", "Paternity Leave", "Maternity Leave"];

      const quotaData = await Promise.all(users.map(async (user) => {
        const joinDate = new Date(user.employee?.joinedDate || user.createdAt);
        const now = new Date();
        const months = (now.getFullYear() - joinDate.getFullYear()) * 12 + (now.getMonth() - joinDate.getMonth());

        const userBalances = {};
        for (const t of leaveTypes) {
          const setting = settings.find(s => s.leaveType === t);
          if (t === "Annual Leave") {
            const earned = setting ? (months * setting.accrualRate) : 0;
            const taken = await getTakenDays(user._id, t, false);
            userBalances[t] = { earned: +earned.toFixed(1), taken, remaining: +(earned - taken).toFixed(1) };
          } else {
            const quota = setting ? setting.yearlyQuota : 10;
            const taken = await getTakenDays(user._id, t, true);
            userBalances[t] = { quota, taken, remaining: Math.max(0, quota - taken) };
          }
        }
        return {
          _id: user._id,
          employee: {
            user: { name: user.name },
            employeeCode: user.employee?.employeeCode || "N/A",
            designation: user.employee?.designation || "Staff"
          },
          balances: userBalances
        };
      }));

      const paginatedResults = quotaData.slice(skip, skip + parseInt(limit));

      return res.json({
        leaves: paginatedResults,
        pagination: {
          totalLeaves: quotaData.length,
          totalPages: Math.ceil(quotaData.length / parseInt(limit)),
          currentPage: parseInt(page)
        }
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateLeaveSettings = async (req, res) => {
  try {
    const { leaveType, value } = req.body;
    let updateFields = { updatedBy: req.user._id };

    if (leaveType === "Annual Leave") {
      updateFields.accrualRate = Number(value);
    } else {
      updateFields.yearlyQuota = Number(value);
    }

    const setting = await LeaveSetting.findOneAndUpdate(
      { leaveType },
      updateFields,
      { upsert: true, new: true }
    );

    res.json({ message: `Settings for ${leaveType} updated.`, setting });
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

    try {
      const io = req.app.get('socketio');
      const recipient = await User.findById(leave.user);

      if (recipient) {
        const statusEmoji = leave.status === "Approved" ? "✅" : "❌";
        const adminNote = leave.adminComment
          ? `\nAdmin Note: "${leave.adminComment}"`
          : "";
        const formatDate = (date) =>
          new Date(date).toLocaleDateString("en-IN", {
            timeZone: "Asia/Kolkata",
            day: "2-digit",
            month: "short",
            year: "numeric"
          });


        await sendNotification(recipient, {
          type: "leave",
          message: `${statusEmoji} Your ${leave.type} request from ${formatDate(leave.startDate)} to ${formatDate(leave.endDate)} has been ${leave.status}.${adminNote}`,
        }, io);
      }
    } catch (notifErr) {
      console.error("Leave notification failed:", notifErr.message);
    }

    res.json(leave);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ message: "Not found" });

    // NEW LOGIC: Allow if owner OR if Admin. 
    // Also: Admins can update even if status is not 'Pending'.
    const isOwner = leave.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "Admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Users can only update 'Pending' leaves, but Admins can update 'Approved/Rejected' too
    if (!isAdmin && leave.status !== "Pending") {
      return res.status(400).json({ message: "Cannot update processed leaves" });
    }

    Object.assign(leave, req.body);

    // Check for overlap (excluding this leave itself)
    const existing = await Leave.find({
      user: leave.user,
      status: { $ne: "Rejected" },
      _id: { $ne: leave._id }
    });

    if (hasLeaveOverlap(existing, leave.startDate, leave.endDate)) {
      return res.status(400).json({ message: "Overlap detected" });
    }

    await leave.save();
    res.json(leave);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.deleteLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ message: "Not found" });

    // NEW LOGIC: Allow Owner (if pending) OR Admin (anytime)
    const isOwner = leave.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "Admin";

    if (isAdmin || (isOwner && leave.status === "Pending")) {
      await Leave.findByIdAndDelete(req.params.id);
      return res.json({ message: "Deleted successfully" });
    }

    res.status(403).json({ message: "Unauthorized to delete" });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getLeaveCalendar = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const leaves = await Leave.find({
      status: "Approved",
      startDate: { $lte: new Date(endDate) },
      endDate: { $gte: new Date(startDate) }
    }).populate({ path: "user", select: "name", populate: { path: "employee", select: "employeeCode" } }).lean();

    const result = [];
    for (const leave of leaves) {
      let current = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      while (current <= end) {
        result.push({
          date: current.toISOString().split("T")[0],
          name: leave.user?.name,
          employeeCode: leave.user?.employee?.employeeCode,
          type: leave.type
        });
        current.setDate(current.getDate() + 1);
      }
    }
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getLeaveSettings = async (req, res) => {
  try {
    const settings = await LeaveSetting.find();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
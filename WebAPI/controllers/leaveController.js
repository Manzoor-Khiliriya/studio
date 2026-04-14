const Leave = require("../models/Leave");
const User = require("../models/User");
const LeaveSetting = require("../models/LeaveSetting");
const { calculateLeaveDays, hasLeaveOverlap } = require("../utils/leaveHelpers");
const sendNotification = require("../utils/notifier");
const { emitDashboardUpdate } = require("../utils/socket");
const LeaveBalance = require("../models/LeaveBalance");

const emitEvent = (req, event, data, userId = null) => {
  const io = req.app.get("socketio");
  if (!io) return;

  if (userId) {
    io.to(userId.toString()).emit(event, data);
  } else {
    io.emit(event, data);
  }
};

const getTakenDays = async (userId, type, currentYearOnly = true) => {
  let query = { user: userId, status: "Approved", type };

  if (currentYearOnly) {
    const year = new Date().getFullYear();
    query.startDate = {
      $gte: new Date(`${year}-01-01`),
      $lte: new Date(`${year}-12-31`)
    };
  }

  const leaves = await Leave.find(query);
  let total = 0;

  for (const l of leaves) {
    total += await calculateLeaveDays(l.startDate, l.endDate);
  }

  return total;
};

//
// ✅ GET MY LEAVES
//
exports.getMyLeaves = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 5, type, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const settings = await LeaveSetting.find();

    // 🔥 ANNUAL LEAVE (UPDATED LOGIC)
    const t = "Annual Leave";
    const setting = settings.find(s => s.leaveType === t);

    const currentYear = new Date().getFullYear();

    let balance = await LeaveBalance.findOne({
      user: userId,
      year: currentYear,
      type: "Annual Leave"
    });

    // ✅ create if not exists
    if (!balance) {
      balance = await LeaveBalance.create({
        user: userId,
        year: currentYear,
        type: "Annual Leave"
      });
    }

    const earned = balance.earned || 0;
    const carryForward = balance.carriedForward || 0;

    const carryForwardLimited = Math.min(
      carryForward,
      setting?.carryForwardLimit || 0
    );

    const taken = await getTakenDays(userId, t, false);

    const totalAvailable = earned + carryForwardLimited;

    const balances = {
      "Annual Leave": {
        earned: +earned.toFixed(1),
        taken,
        remaining: +(totalAvailable - taken).toFixed(1),
        carryForward: carryForwardLimited,
        type: "accrual"
      }
    };

    // 🔍 FILTERS (UNCHANGED)
    let query = { user: userId };
    if (type && type !== "All") query.type = type;
    if (status && status !== "All") query.status = status;

    const totalLeaves = await Leave.countDocuments(query);

    const leaves = await Leave.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const history = await Promise.all(
      leaves.map(async (l) => ({
        ...l.toObject(),
        businessDays: await calculateLeaveDays(l.startDate, l.endDate)
      }))
    );

    // 📦 RESPONSE (UNCHANGED STRUCTURE)
    res.json({
      history,
      balances: {
        annualLeave: balances["Annual Leave"]
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

//
// ✅ APPLY LEAVE
//
exports.applyLeave = async (req, res) => {
  try {
    const { type, startDate, endDate, reason } = req.body;
    const userId = req.user._id;

    const requestedDays = await calculateLeaveDays(startDate, endDate);

    const existing = await Leave.find({ user: userId, status: { $ne: "Rejected" } });
    if (hasLeaveOverlap(existing, startDate, endDate)) {
      return res.status(400).json({ message: "Overlap with existing leave." });
    }

    const setting = await LeaveSetting.findOne({ leaveType: type });

    // 🔥 ANNUAL LEAVE
    if (type === "Annual Leave") {
      const currentYear = new Date().getFullYear();

      let balance = await LeaveBalance.findOne({
        user: userId,
        year: currentYear,
        type: "Annual Leave"
      });

      if (!balance) {
        balance = await LeaveBalance.create({
          user: userId,
          year: currentYear,
          type: "Annual Leave"
        });
      }

      const earned = balance.earned || 0;
      const carryForward = balance.carriedForward || 0;

      const carryForwardLimited = Math.min(
        carryForward,
        setting?.carryForwardLimit || 0
      );

      const taken = await getTakenDays(userId, "Annual Leave", false);

      const totalAvailable = earned + carryForwardLimited;

      if (requestedDays > (totalAvailable - taken)) {
        return res.status(400).json({
          message: "Insufficient Annual Leave balance."
        });
      }
    }

    // 🔥 OTHER LEAVES
    else if (!["LOP", "Casual Leave"].includes(type)) {
      const taken = await getTakenDays(userId, type, true);
      const quota = setting?.yearlyQuota || 10;

      if (taken + requestedDays > quota) {
        return res.status(400).json({
          message: `${type} exceeded. Remaining: ${quota - taken}`
        });
      }
    }

    const leave = await Leave.create({
      user: userId,
      type,
      startDate,
      endDate,
      reason
    });

    emitEvent(req, "leaveChanged");
    emitDashboardUpdate(req);

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
        view: "requests",
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
        view: "casual-lop", 
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

        const userBalances = {};
        for (const t of leaveTypes) {
          const setting = settings.find(s => s.leaveType === t);
          if (t === "Annual Leave") {
            const balance = await LeaveBalance.findOne({
              user: user._id,
              year: new Date().getFullYear(),
              type: "Annual Leave"
            });

            const earned = balance?.earned || 0;
            const carryForward = balance?.carriedForward || 0;

            const carryForwardLimited = Math.min(
              carryForward,
              setting?.carryForwardLimit || 0
            );

            const taken = await getTakenDays(user._id, t, false);

            const totalAvailable = earned + carryForwardLimited;

            userBalances[t] = {
              earned: +earned.toFixed(1),
              taken,
              remaining: +(totalAvailable - taken).toFixed(1),
              carryForward: carryForwardLimited
            };
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
        view: "quota",
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

exports.getLeaveSettings = async (req, res) => {
  try {
    const settings = await LeaveSetting.find().lean();
    res.json(settings);
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
      updateFields.carryForwardLimit = Number(req.body.carryForwardLimit || 0);
    } else {
      updateFields.yearlyQuota = Number(value);
    }

    const setting = await LeaveSetting.findOneAndUpdate(
      { leaveType },
      updateFields,
      { upsert: true, new: true }
    );
    emitEvent(req, "leaveChanged");
    emitDashboardUpdate(req);
    res.json({ message: `Settings for ${leaveType} updated.`, setting });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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

exports.processLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);

    if (!leave || leave.status !== "Pending") {
      return res.status(400).json({ message: "Invalid request" });
    }

    leave.status = req.body.status;
    leave.adminComment = req.body.adminComment;
    leave.processedBy = req.user._id;

    await leave.save();

    const io = req.app.get("socketio");
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
    emitEvent(req, "leaveChanged");
    emitEvent(req, "leaveChanged", leave, leave.user);
    emitDashboardUpdate(req);
    res.json(leave);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ message: "Not found" });

    const isOwner = leave.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "Admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (!isAdmin && leave.status !== "Pending") {
      return res.status(400).json({ message: "Cannot update processed leaves" });
    }

    Object.assign(leave, req.body);

    const existing = await Leave.find({
      user: leave.user,
      status: { $ne: "Rejected" },
      _id: { $ne: leave._id }
    });

    if (hasLeaveOverlap(existing, leave.startDate, leave.endDate)) {
      return res.status(400).json({ message: "Overlap detected" });
    }

    await leave.save();
    emitEvent(req, "leaveChanged");
    emitEvent(req, "leaveChanged", leave, leave.user);
    emitDashboardUpdate(req);
    res.json(leave);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ message: "Not found" });

    const isOwner = leave.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "Admin";

    if (isAdmin || (isOwner && leave.status === "Pending")) {
      await Leave.findByIdAndDelete(req.params.id);
      emitEvent(req, "leaveChanged");
      emitEvent(req, "leaveChanged", leave._id, leave.user);
      emitDashboardUpdate(req);
      return res.json({ message: "Deleted successfully" });
    }

    res.status(403).json({ message: "Unauthorized to delete" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
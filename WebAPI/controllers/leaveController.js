const Leave = require("../models/Leave");
const User = require("../models/User");
const Employee = require("../models/Employee");
const LeaveSetting = require("../models/LeaveSetting");
const { calculateLeaveDays, hasLeaveOverlap } = require("../utils/leaveHelpers");

/* ================= HELPERS ================= */

const getLeaveSetting = async (type) => {
  return await LeaveSetting.findOne({ leaveType: type });
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

/* ================= EMPLOYEE ================= */

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
    const leaveTypes = ["Annual Leave", "Sick Leave", "Bereavement Leave", "Paternity Leave", "Maternity Leave", "Casual Leave", "LOP"];

    const balances = {};

    for (const t of leaveTypes) {
      const setting = settings.find(s => s.leaveType === t);
      
      if (t === "Annual Leave") {
        const months = (now.getFullYear() - joinDate.getFullYear()) * 12 + (now.getMonth() - joinDate.getMonth());
        const earned = setting ? (months * setting.accrualRate) : 0;
        const taken = await getTakenDays(userId, t, false);
        balances[t] = { 
          earned: +earned.toFixed(1), 
          taken, 
          remaining: +(earned - taken).toFixed(1),
          type: "accrual"
        };
      } else if (t === "LOP" || t === "Casual Leave") {
        const taken = await getTakenDays(userId, t, true);
        balances[t] = { taken, quota: "Unlimited", remaining: "N/A", type: "unrestricted" };
      } else {
        const quota = setting ? setting.yearlyQuota : 10; 
        const taken = await getTakenDays(userId, t, true);
        balances[t] = { 
          quota, 
          taken, 
          remaining: Math.max(0, quota - taken),
          type: "quota"
        };
      }
    }

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
      balances,
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

/* ================= ADMIN ================= */

exports.getAllLeaves = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10, view = "requests" } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    if (view === "requests") {
      let query = {};
      if (status && status !== "All") query.status = status;
      if (search) {
        const users = await User.find({ name: { $regex: search, $options: "i" } }).select("_id");
        query.user = { $in: users.map((u) => u._id) };
      }
      const totalLeaves = await Leave.countDocuments(query);
      const leaves = await Leave.find(query)
        .populate({ path: "user", select: "name email", populate: { path: "employee", select: "employee_code designation" } })
        .sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean();

      return res.json({ leaves, pagination: { totalLeaves, totalPages: Math.ceil(totalLeaves / parseInt(limit)), currentPage: parseInt(page) } });
    }

    if (view === "quota") {
      // Find all users (filtered by name if search exists)
      const users = await User.find(search ? { name: { $regex: search, $options: "i" } } : {}).populate("employee").lean();
      const settings = await LeaveSetting.find();
      const leaveTypes = ["Annual Leave", "Sick Leave", "Bereavement Leave", "Paternity Leave", "Maternity Leave", "Casual Leave", "LOP"];
      
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
            userBalances[t] = { 
                earned: +earned.toFixed(1), 
                taken, 
                remaining: +(earned - taken).toFixed(1) 
            };
          } else if (["Casual Leave", "LOP"].includes(t)) {
             userBalances[t] = { 
                taken: await getTakenDays(user._id, t, true), 
                quota: "Unlimited" 
             };
          } else {
            const quota = setting ? setting.yearlyQuota : 10;
            const taken = await getTakenDays(user._id, t, true);
            userBalances[t] = { 
                quota, 
                taken, 
                remaining: Math.max(0, quota - taken) 
            };
          }
        }

        return {
          _id: user._id,
          employee: { 
            user: { name: user.name }, 
            designation: user.employee?.designation || "Staff" 
          },
          balances: userBalances
        };
      }));

      // Apply pagination to the computed array
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

/* ================= SETTINGS ================= */

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

/* ================= COMMON ================= */

exports.processLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave || leave.status !== "Pending") return res.status(400).json({ message: "Invalid request" });
    leave.status = req.body.status;
    leave.adminComment = req.body.adminComment;
    leave.processedBy = req.user._id;
    await leave.save();
    res.json(leave);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ message: "Not found" });
    if (leave.user.toString() !== req.user._id.toString() || leave.status !== "Pending") return res.status(403).json({ message: "Unauthorized" });

    Object.assign(leave, req.body);
    const existing = await Leave.find({ user: req.user._id, status: { $ne: "Rejected" }, _id: { $ne: leave._id } });
    if (hasLeaveOverlap(existing, leave.startDate, leave.endDate)) return res.status(400).json({ message: "Overlap detected" });

    await leave.save();
    res.json(leave);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getLeaveCalendar = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const leaves = await Leave.find({
      status: "Approved",
      startDate: { $lte: new Date(endDate) },
      endDate: { $gte: new Date(startDate) }
    }).populate({ path: "user", select: "name", populate: { path: "employee", select: "employee_code" } }).lean();

    const result = [];
    for (const leave of leaves) {
      let current = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      while (current <= end) {
        result.push({
          date: current.toISOString().split("T")[0],
          name: leave.user?.name,
          employeeCode: leave.user?.employee?.employee_code,
          type: leave.type
        });
        current.setDate(current.getDate() + 1);
      }
    }
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.deleteLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ message: "Not found" });
    if (req.user.role !== "Admin" && (leave.user.toString() !== req.user._id.toString() || leave.status !== "Pending")) return res.status(403).json({ message: "Unauthorized" });
    await Leave.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getLeaveSettings = async (req, res) => {
  try {
    const settings = await LeaveSetting.find();
    res.json(settings);
  } catch (err) { res.status(500).json({ error: err.message }); }
};
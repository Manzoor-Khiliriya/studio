const Leave = require("../models/Leave");
const User = require("../models/User");
const LeaveSetting = require("../models/LeaveSetting");
const {
  calculateLeaveDays,
  hasLeaveOverlap,
} = require("../utils/leaveHelpers");
const sendNotification = require("../utils/notifier");
const { emitDashboardUpdate } = require("../utils/socket");
const LeaveBalance = require("../models/LeaveBalance");
const { now } = require("../utils/dateHelper");
const { buildApprovalFlow } = require("../utils/leaveApprovalFlow");
const Employee = require("../models/Employee");
const Department = require("../models/Department");

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
      $lte: new Date(`${year}-12-31`),
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

    // 🔥 Earned LEAVE (UPDATED LOGIC)
    const t = "Earned Leave";
    const setting = settings.find((s) => s.leaveType === t);

    const currentYear = new Date().getFullYear();

    let balance = await LeaveBalance.findOne({
      user: userId,
      year: currentYear,
      type: "Earned Leave",
    });

    // ✅ create if not exists
    if (!balance) {
      balance = await LeaveBalance.create({
        user: userId,
        year: currentYear,
        type: "Earned Leave",
      });
    }

    const earned = balance.earned || 0;
    const carryForward = balance.carriedForward || 0;

    const carryForwardLimited = Math.min(
      carryForward,
      setting?.carryForwardLimit || 0,
    );

    const taken = await getTakenDays(userId, t, false);

    const totalAvailable =
      earned + carryForwardLimited + (balance.initialAdjustment || 0);

    const balances = {
      "Earned Leave": {
        earned: +earned.toFixed(1),
        taken,
        remaining: +(totalAvailable - taken).toFixed(1),
        carryForward: carryForwardLimited,
        type: "accrual",
      },
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
        businessDays: await calculateLeaveDays(l.startDate, l.endDate),
      })),
    );

    // 📦 RESPONSE (UNCHANGED STRUCTURE)
    res.json({
      history,
      balances: {
        earnedLeave: balances["Earned Leave"],
      },
      pagination: {
        totalLeaves,
        totalPages: Math.ceil(totalLeaves / parseInt(limit)),
        currentPage: parseInt(page),
      },
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

    const existing = await Leave.find({
      user: userId,
      status: { $ne: "Rejected" },
    });
    if (hasLeaveOverlap(existing, startDate, endDate)) {
      return res.status(400).json({ message: "Overlap with existing leave." });
    }

    const setting = await LeaveSetting.findOne({ leaveType: type });

    if (type === "Earned Leave") {
      const currentYear = now().getFullYear();

      let balance = await LeaveBalance.findOne({
        user: userId,
        year: currentYear,
        type: "Earned Leave",
      });

      if (!balance) {
        balance = await LeaveBalance.create({
          user: userId,
          year: currentYear,
          type: "Earned Leave",
        });
      }

      const earned = balance.earned || 0;
      const carryForward = balance.carriedForward || 0;

      const carryForwardLimited = Math.min(
        carryForward,
        setting?.carryForwardLimit || 0,
      );

      const taken = await getTakenDays(userId, "Earned Leave", false);

      const totalAvailable =
        earned + carryForwardLimited + (balance.initialAdjustment || 0);

      if (requestedDays > totalAvailable - taken) {
        return res.status(400).json({
          message: `Insufficient Earned Leave balance. Available ${totalAvailable - taken} Leaves`,
        });
      }
    } else if (!["LOP"].includes(type)) {
      const taken = await getTakenDays(userId, type, true);
      const quota = setting?.yearlyQuota || 10;

      if (taken + requestedDays > quota) {
        return res.status(400).json({
          message: `Insufficient ${type} balance. Available: ${quota - taken} Leaves`,
        });
      }
    }

    const employee = await Employee.findOne({
      user: userId,
    });
    const managerId = employee.manager;
    const adminIds = employee.admin || [];
    const hrId = employee.hrManager;
    const approvalFlow = buildApprovalFlow(
      req.user.role,
      managerId,
      adminIds,
      hrId,
    );
    const leave = await Leave.create({
      user: userId,
      type,
      startDate,
      endDate,
      reason,
      approvalFlow,
      currentLevel: 0,
      status: "Pending",
    });

    const firstStep = approvalFlow[0];

    let approvers = [];

    if (firstStep.approver) {
      const manager = await User.findById(firstStep.approver);

      if (manager) {
        approvers.push(manager);
      }
    } else {
      approvers = await User.find({
        role: firstStep.role,
        status: "Enable",
      });
    }

    const io = req.app.get("socketio");

    for (const approver of approvers) {
      await sendNotification(
        approver,
        {
          type: "leave",
          message: `New ${type} leave request requires your approval`,
        },
        io,
      );
    }

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
      endDate: customEnd,
    } = req.query;

    const role = req.user?.role;

    if (
      !["Admin", "Hr Manager"].includes(role) &&
      !["my-leaves", "requests"].includes(view)
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    let filterStart = null;
    let filterEnd = null;

    if (dateRange && dateRange !== "all") {
      const currentTime = now();
      const start = now();
      const end = now();

      if (dateRange === "today") {
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
      } else if (dateRange === "upcoming") {
        start.setDate(start.getDate() + 1);
        start.setHours(0, 0, 0, 0);
        end.setFullYear(currentTime.getFullYear() + 2);
      } else if (dateRange === "current-week") {
        start.setDate(currentTime.getDate() - 6);
        start.setHours(0, 0, 0, 0);
        end.setTime(currentTime.getTime());
        end.setHours(23, 59, 59, 999);
      } else if (dateRange === "last-week") {
        start.setDate(currentTime.getDate() - 13);
        start.setHours(0, 0, 0, 0);
        end.setDate(currentTime.getDate() - 7);
        end.setHours(23, 59, 59, 999);
      } else if (dateRange === "current-month") {
        start.setDate(1); // First of this month
        start.setHours(0, 0, 0, 0);
        end.setMonth(currentTime.getMonth() + 1, 0); // Last day of this month
        end.setHours(23, 59, 59, 999);
      } else if (dateRange === "last-month") {
        start.setMonth(currentTime.getMonth() - 1, 1); // First of last month
        start.setHours(0, 0, 0, 0);
        end.setMonth(currentTime.getMonth(), 0); // Last day of last month
        end.setHours(23, 59, 59, 999);
      } else if (dateRange === "custom" && customStart && customEnd) {
        start.setTime(new Date(customStart).getTime());
        start.setHours(0, 0, 0, 0);
        end.setTime(new Date(customEnd).getTime());
        end.setHours(23, 59, 59, 999);
      }

      filterStart = start;
      filterEnd = end;
    }

    if (view === "my-leaves") {
      let query = {
        user: req.user._id,
      };

      if (status && status !== "All") {
        query.status = status;
      }

      if (filterStart && filterEnd) {
        query.createdAt = {
          $gte: filterStart,
          $lte: filterEnd,
        };
      }

      const totalLeaves = await Leave.countDocuments(query);

      const leaves = await Leave.find(query)
        .populate({
          path: "user",
          select: "name email designation",
          populate: {
            path: "employee",
            select: "employeeCode",
          },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      const processedLeaves = await Promise.all(
        leaves.map(async (leave) => ({
          ...leave,
          duration: await calculateLeaveDays(leave.startDate, leave.endDate),
        })),
      );

      return res.json({
        view: "my-leaves",
        leaves: processedLeaves,
        pagination: {
          totalLeaves,
          totalPages: Math.ceil(totalLeaves / parseInt(limit)),
          currentPage: parseInt(page),
        },
      });
    }

    // --- VIEW 1: REQUESTS (Filtered & Sorted by CREATED date) ---
    if (view === "requests") {
      let query;
      if (req.user.role === "Hr Employee") {
        query = {};
      } else if (["Manager", "GAD Manager"].includes(req.user.role)) {
        query = {
          approvalFlow: {
            $elemMatch: {
              approver: req.user._id,
            },
          },
        };
      } else if (req.user.role === "Admin") {
        query = {
          approvalFlow: {
            $elemMatch: {
              approvers: req.user._id,
            },
          },
        };
      } else {
        query = {
          approvalFlow: {
            $elemMatch: {
              role: req.user.role,
            },
          },
        };
      }

      if (filterStart && filterEnd) {
        query.createdAt = { $gte: filterStart, $lte: filterEnd };
      }

      if (status && status !== "All") query.status = status;
      if (search) {
        const users = await User.find({
          name: { $regex: search, $options: "i" },
        }).select("_id");
        query.user = { $in: users.map((u) => u._id) };
      }

      const totalLeaves = await Leave.countDocuments(query);
      const leaves = await Leave.find(query)
        .populate({
          path: "user",
          select: "name email designation",
          populate: { path: "employee", select: "employeeCode" },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      const processedLeaves = await Promise.all(
        leaves.map(async (l) => ({
          ...l,
          duration: await calculateLeaveDays(l.startDate, l.endDate),
        })),
      );

      return res.json({
        view: "requests",
        leaves: processedLeaves,
        pagination: {
          totalLeaves,
          totalPages: Math.ceil(totalLeaves / parseInt(limit)),
          currentPage: parseInt(page),
        },
      });
    }

    if (view === "leave-history") {
      let query = {};

      if (filterStart && filterEnd) {
        query.$or = [
          {
            startDate: {
              $gte: filterStart,
              $lte: filterEnd,
            },
          },
          {
            endDate: {
              $gte: filterStart,
              $lte: filterEnd,
            },
          },
          {
            startDate: { $lte: filterStart },
            endDate: { $gte: filterEnd },
          },
        ];
      }

      if (status && status !== "All") {
        query.status = status;
      }

      if (search) {
        const users = await User.find({
          name: { $regex: search, $options: "i" },
        }).select("_id");

        query.user = { $in: users.map((u) => u._id) };
      }

      const totalLeaves = await Leave.countDocuments(query);

      const leaves = await Leave.find(query)
        .populate({
          path: "user",
          select: "name email designation",
          populate: {
            path: "employee",
            select: "employeeCode",
          },
        })
        .sort({ startDate: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      const processedLeaves = await Promise.all(
        leaves.map(async (leave) => ({
          ...leave,
          duration: await calculateLeaveDays(leave.startDate, leave.endDate),
        })),
      );

      return res.json({
        view: "leave-history",
        leaves: processedLeaves,
        pagination: {
          totalLeaves,
          totalPages: Math.ceil(totalLeaves / parseInt(limit)),
          currentPage: parseInt(page),
        },
      });
    }

    // --- VIEW 2: CASUAL & LOP (Filtered & Sorted by START date) ---
    if (view === "casual-lop") {
      let query = { type: { $in: ["LOP"] }, status: "Approved" };

      if (filterStart && filterEnd) {
        query.startDate = { $gte: filterStart, $lte: filterEnd };
      }

      if (search) {
        const users = await User.find({
          name: { $regex: search, $options: "i" },
        }).select("_id");
        query.user = { $in: users.map((u) => u._id) };
      }

      const totalLeaves = await Leave.countDocuments(query);
      const leavesRaw = await Leave.find(query)
        .populate({
          path: "user",
          select: "name email designation",
          populate: { path: "employee", select: "employeeCode" },
        })
        .sort({ startDate: -1 }) // Sort by when the leave actually happens
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      const leaves = await Promise.all(
        leavesRaw.map(async (l) => ({
          ...l,
          duration: await calculateLeaveDays(l.startDate, l.endDate),
        })),
      );

      return res.json({
        view: "casual-lop",
        leaves,
        pagination: {
          totalLeaves,
          totalPages: Math.ceil(totalLeaves / parseInt(limit)),
          currentPage: parseInt(page),
        },
      });
    }

    if (view === "compensatory-off") {
      let query = { type: { $in: ["Compensatory Off"] }, status: "Approved" };

      if (filterStart && filterEnd) {
        query.startDate = { $gte: filterStart, $lte: filterEnd };
      }

      if (search) {
        const users = await User.find({
          name: { $regex: search, $options: "i" },
        }).select("_id");
        query.user = { $in: users.map((u) => u._id) };
      }

      const totalLeaves = await Leave.countDocuments(query);
      const leavesRaw = await Leave.find(query)
        .populate({
          path: "user",
          select: "name email designation",
          populate: { path: "employee", select: "employeeCode" },
        })
        .sort({ startDate: -1 }) // Sort by when the leave actually happens
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      const leaves = await Promise.all(
        leavesRaw.map(async (l) => ({
          ...l,
          duration: await calculateLeaveDays(l.startDate, l.endDate),
        })),
      );

      return res.json({
        view: "compensatory-off",
        leaves,
        pagination: {
          totalLeaves,
          totalPages: Math.ceil(totalLeaves / parseInt(limit)),
          currentPage: parseInt(page),
        },
      });
    }

    // --- VIEW 3: QUOTA ---
    if (view === "quota") {
      const userQuery = {
        role: { $in: ["Employee", "Manager", "Hr Manager"] },
      };
      if (search) {
        userQuery.name = { $regex: search, $options: "i" };
      }

      const users = await User.find(userQuery).populate("employee").lean();

      const settings = await LeaveSetting.find();
      const leaveTypes = [
        "Earned Leave",
        "Casual Leave",
        "Sick Leave",
        "Bereavement Leave",
        "Paternity Leave",
        "Maternity Leave",
      ];

      const quotaData = await Promise.all(
        users.map(async (user) => {
          const userBalances = {};
          for (const t of leaveTypes) {
            const setting = settings.find((s) => s.leaveType === t);
            if (t === "Earned Leave") {
              const balance = await LeaveBalance.findOne({
                user: user._id,
                year: new Date().getFullYear(),
                type: "Earned Leave",
              });

              const earned = balance?.earned || 0;
              const carryForward = balance?.carriedForward || 0;

              const carryForwardLimited = Math.min(
                carryForward,
                setting?.carryForwardLimit || 0,
              );

              const taken = await getTakenDays(user._id, t, false);

              const totalAvailable =
                earned +
                carryForwardLimited +
                (balance?.initialAdjustment || 0);

              userBalances[t] = {
                earned: +earned.toFixed(1),
                taken,
                remaining: +(totalAvailable - taken).toFixed(1),
                carryForward: carryForwardLimited,
                adjustment: balance?.initialAdjustment || 0,
              };
            } else {
              const quota = setting ? setting.yearlyQuota : 10;
              const taken = await getTakenDays(user._id, t, true);
              userBalances[t] = {
                quota,
                taken,
                remaining: Math.max(0, quota - taken),
              };
            }
          }
          return {
            _id: user._id,
            employee: {
              user: { name: user.name },
              employeeCode: user.employee?.employeeCode || "N/A",
              designation: user.employee?.designation || "Staff",
            },
            balances: userBalances,
          };
        }),
      );

      const paginatedResults = quotaData.slice(skip, skip + parseInt(limit));

      return res.json({
        view: "quota",
        leaves: paginatedResults,
        pagination: {
          totalLeaves: quotaData.length,
          totalPages: Math.ceil(quotaData.length / parseInt(limit)),
          currentPage: parseInt(page),
        },
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

    if (leaveType === "Earned Leave") {
      updateFields.accrualRate = Number(value);
      updateFields.carryForwardLimit = Number(req.body.carryForwardLimit || 0);
    } else {
      updateFields.yearlyQuota = Number(value);
    }

    const setting = await LeaveSetting.findOneAndUpdate(
      { leaveType },
      updateFields,
      { upsert: true, new: true },
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
      endDate: { $gte: new Date(startDate) },
    })
      .populate({
        path: "user",
        select: "name",
        populate: { path: "employee", select: "employeeCode" },
      })
      .lean();

    const result = [];
    for (const leave of leaves) {
      let current = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      while (current <= end) {
        result.push({
          date: current.toISOString().split("T")[0],
          name: leave.user?.name,
          employeeCode: leave.user?.employee?.employeeCode,
          type: leave.type,
        });
        current.setDate(current.getDate() + 1);
      }
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.processLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);

    if (!leave || leave.status !== "Pending") {
      return res.status(400).json({ message: "Invalid request" });
    }

    const newStatus = req.body.status;

    if (!["Approved", "Rejected"].includes(newStatus)) {
      return res.status(400).json({
        message: "Invalid status",
      });
    }

    if (!leave?.approvalFlow?.length) {
      return res.status(400).json({
        message: "Leave approval workflow not found",
      });
    }

    const currentStep = leave.approvalFlow[leave.currentLevel];

    if (currentStep.approver) {
      if (currentStep.approver.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          message: "Not your approval stage",
        });
      }
    } else {
      if (currentStep.role !== req.user.role) {
        return res.status(403).json({
          message: "Not your approval stage",
        });
      }
    }

    if (currentStep.approvers?.length) {
      const canApprove = currentStep.approvers.some(
        (id) => id.toString() === req.user._id.toString(),
      );

      if (!canApprove) {
        return res.status(403).json({
          message: "Not your approval stage",
        });
      }
    }

    if (newStatus === "Rejected") {
      currentStep.status = "Rejected";
      currentStep.approvedBy = req.user._id;
      currentStep.approvedAt = now();
      leave.status = "Rejected";
      await leave.save();

      const io = req.app.get("socketio");

      const employee = await User.findById(leave.user);

      await sendNotification(
        employee,
        {
          type: "leave",
          message: `Your ${leave.type} request has been rejected by ${req?.user?.role}`,
        },
        io,
      );

      emitEvent(req, "leaveChanged", leave);
      emitEvent(req, "leaveChanged", leave, leave.user);
      emitDashboardUpdate(req);
      return res.json(leave);
    }

    currentStep.status = "Approved";
    currentStep.approvedBy = req.user._id;
    currentStep.approvedAt = now();

    const isLastStep = leave.currentLevel === leave.approvalFlow.length - 1;

    if (!isLastStep) {
      leave.currentLevel += 1;
      leave.approvalFlow[leave.currentLevel].status = "Pending";
      await leave.save();
      const io = req.app.get("socketio");
      const nextStep = leave.approvalFlow[leave.currentLevel];
      let nextApprovers = [];

      if (nextStep.approvers?.length) {
        nextApprovers = await User.find({
          _id: { $in: nextStep.approvers },
          status: "Enable",
        });
      } else if (nextStep.approver) {
        const user = await User.findById(nextStep.approver);

        if (user) {
          nextApprovers = [user];
        }
      } else {
        nextApprovers = await User.find({
          role: nextStep.role,
          status: "Enable",
        });
      }

      for (const approver of nextApprovers) {
        await sendNotification(
          approver,
          {
            type: "leave",
            message: `New ${leave.type} request requires your approval`,
          },
          io,
        );
      }

      emitEvent(req, "leaveChanged");
      emitEvent(req, "leaveChanged", leave, leave.user);
      emitDashboardUpdate(req);

      return res.json({
        success: true,
        message: "Approved and forwarded to next approver",
        leave,
      });
    }

    if (newStatus === "Approved") {
      const existing = await Leave.find({
        user: leave.user,
        status: { $ne: "Rejected" },
        _id: { $ne: leave._id },
      });

      if (hasLeaveOverlap(existing, leave.startDate, leave.endDate)) {
        return res.status(400).json({
          message: "Cannot approve. Overlaps with another leave.",
        });
      }

      const requestedDays = await calculateLeaveDays(
        leave.startDate,
        leave.endDate,
      );

      const setting = await LeaveSetting.findOne({ leaveType: leave.type });

      if (leave.type === "Earned Leave") {
        const currentYear = now().getFullYear();

        let balance = await LeaveBalance.findOne({
          user: leave.user,
          year: currentYear,
          type: "Earned Leave",
        });

        if (!balance) {
          balance = await LeaveBalance.create({
            user: leave.user,
            year: currentYear,
            type: "Earned Leave",
          });
        }

        const earned = balance.earned || 0;
        const carryForward = balance.carriedForward || 0;

        const carryForwardLimited = Math.min(
          carryForward,
          setting?.carryForwardLimit || 0,
        );

        const existingLeaves = await Leave.find({
          user: leave.user,
          status: { $ne: "Rejected" },
          type: "Earned Leave",
          _id: { $ne: leave._id },
        });

        let taken = 0;
        for (const l of existingLeaves) {
          taken += await calculateLeaveDays(l.startDate, l.endDate);
        }

        const totalAvailable =
          earned + carryForwardLimited + (balance.initialAdjustment || 0);

        if (requestedDays > totalAvailable - taken) {
          return res.status(400).json({
            message: `Cannot approve. Insufficient Earned Leave balance. Available ${
              totalAvailable - taken
            } Leaves`,
          });
        }
      } else if (!["LOP"].includes(leave.type)) {
        const existingLeaves = await Leave.find({
          user: leave.user,
          status: { $ne: "Rejected" },
          type: leave.type,
          _id: { $ne: leave._id },
        });

        let taken = 0;
        for (const l of existingLeaves) {
          taken += await calculateLeaveDays(l.startDate, l.endDate);
        }

        const quota = setting?.yearlyQuota || 10;

        if (taken + requestedDays > quota) {
          return res.status(400).json({
            message: `Cannot approve. Insufficient ${leave.type} balance. Available: ${
              quota - taken
            } Leaves`,
          });
        }
      }
    }

    leave.status = "Approved";
    leave.approvedBy = req.user._id;
    leave.approvedAt = now();

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
          year: "numeric",
        });

      await sendNotification(
        recipient,
        {
          type: "leave",
          message: `${statusEmoji} Your ${leave.type} request from ${formatDate(
            leave.startDate,
          )} to ${formatDate(leave.endDate)} has been ${
            leave.status
          }.${adminNote}`,
        },
        io,
      );
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
    const isHrManager = req.user.role === "Hr Manager";

    if (!isOwner && !isAdmin && !isHrManager) {
      return res.status(403).json({ message: "Unauthorized Access!" });
    }

    if (!isAdmin && leave.status !== "Pending") {
      return res
        .status(400)
        .json({ message: "Cannot update processed leaves" });
    }
    const updatedLeave = {
      ...leave.toObject(),
      ...req.body,
    };
    const existing = await Leave.find({
      user: leave.user,
      status: { $ne: "Rejected" },
      _id: { $ne: leave._id },
    });

    if (
      hasLeaveOverlap(existing, updatedLeave.startDate, updatedLeave.endDate)
    ) {
      return res.status(400).json({ message: "Overlap with existing leave." });
    }
    const requestedDays = await calculateLeaveDays(
      updatedLeave.startDate,
      updatedLeave.endDate,
    );
    const setting = await LeaveSetting.findOne({
      leaveType: updatedLeave.type,
    });
    if (updatedLeave.type === "Earned Leave") {
      const currentYear = now().getFullYear();

      let balance = await LeaveBalance.findOne({
        user: leave.user,
        year: currentYear,
        type: "Earned Leave",
      });

      if (!balance) {
        balance = await LeaveBalance.create({
          user: leave.user,
          year: currentYear,
          type: "Earned Leave",
        });
      }

      const earned = balance.earned || 0;
      const carryForward = balance.carriedForward || 0;

      const carryForwardLimited = Math.min(
        carryForward,
        setting?.carryForwardLimit || 0,
      );

      const existingLeaves = await Leave.find({
        user: leave.user,
        status: { $ne: "Rejected" },
        type: "Earned Leave",
        _id: { $ne: leave._id },
      });

      let taken = 0;
      for (const l of existingLeaves) {
        taken += await calculateLeaveDays(l.startDate, l.endDate);
      }

      const totalAvailable =
        earned + carryForwardLimited + (balance.initialAdjustment || 0);

      if (requestedDays > totalAvailable - taken) {
        return res.status(400).json({
          message: `Insufficient Earned Leave balance. Available ${
            totalAvailable - taken
          } Leaves`,
        });
      }
    } else if (!["LOP"].includes(updatedLeave.type)) {
      const existingLeaves = await Leave.find({
        user: leave.user,
        status: { $ne: "Rejected" },
        type: updatedLeave.type,
        _id: { $ne: leave._id },
      });
      let taken = 0;
      for (const l of existingLeaves) {
        taken += await calculateLeaveDays(l.startDate, l.endDate);
      }

      const quota = setting?.yearlyQuota || 10;

      if (taken + requestedDays > quota) {
        return res.status(400).json({
          message: `Insufficient ${updatedLeave.type} balance. Available: ${quota - taken} leaves`,
        });
      }
    }
    Object.assign(leave, updatedLeave);
    const employee = await Employee.findOne({
      user: leave.user,
    });

    const managerId = employee.manager;
    const adminIds = employee.admin || [];
    const hrId = employee.hrManager;
    const user = await User.findById(leave.user);
    leave.approvalFlow = buildApprovalFlow(
      user.role,
      managerId,
      adminIds,
      hrId,
    );
    leave.currentLevel = 0;
    leave.status = "Pending";
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
    if (!leave) {
      return res.status(404).json({ message: "Leave Not found" });
    }
    const isOwner = leave.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "Admin";
    const isHrManager = req.user.role === "Hr Manager";

    if (isAdmin || isHrManager) {
      await Leave.findByIdAndDelete(req.params.id);
    } else if (isOwner) {
      if (leave.status !== "Pending") {
        return res.status(403).json({
          message: "Only pending leaves can be deleted",
        });
      }
      await Leave.findByIdAndDelete(req.params.id);
    } else {
      return res.status(403).json({
        message: "Unauthorized to delete",
      });
    }
    emitEvent(req, "leaveChanged");
    emitEvent(req, "leaveChanged", leave._id, leave.user);
    emitDashboardUpdate(req);
    return res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateEarnedAdjustment = async (req, res) => {
  try {
    const { userId, value } = req.body;
    const year = new Date().getFullYear();
    let balance = await LeaveBalance.findOne({
      user: userId,
      year,
      type: "Earned Leave",
    });
    if (!balance) {
      balance = await LeaveBalance.create({
        user: userId,
        year,
        type: "Earned Leave",
      });
    }
    balance.initialAdjustment = Number(value) || 0;
    await balance.save();
    emitEvent(req, "leaveChanged");
    res.json({
      message: "Adjustment updated",
      balance,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

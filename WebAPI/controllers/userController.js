const User = require("../models/User");
const Employee = require("../models/Employee");
const { sanitizeUser } = require("../utils/userHelpers");
const { hashPassword } = require("../utils/authHelpers");
const sendNotification = require("../utils/notifier");
const { emitDashboardUpdate } = require("../utils/socket");
const { now } = require("../utils/dateHelper");
const DeleteRequest = require("../models/DeleteRequest");

const emitEvent = (req, event, data, userId = null) => {
  const io = req.app.get("socketio");
  if (!io) return;

  if (userId) {
    io.to(userId.toString()).emit(event, data);
  } else {
    io.emit(event, data);
  }
};

exports.createUser = async (req, res) => {
  try {
    const {
      name,
      employeeCode,
      role,
      email,
      password,
      designation,
      departments,
      dailyWorkLimit,
      proficiency,
      joinedDate,
      mobileNumber,
      dateOfBirth,
      manager,
      admin = [],
      hrManager,
    } = req.body;
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing)
      return res.status(400).json({ message: "Email already exists" });
    if (employeeCode) {
      const existingCode = await Employee.findOne({
        employeeCode: employeeCode.toUpperCase(),
      });

      if (existingCode) {
        return res.status(400).json({
          message: "Employee code already exists",
        });
      }
    }

    const rolesRequiringAdmin = [
      "Employee",
      "Manager",
      "Hr Employee",
      "Hr Manager",
      "GAD Employee",
      "GAD Manager",
    ];

    const rolesRequiringHrManager = [
      "Employee",
      "Manager",
      "Hr Employee",
      "GAD Employee",
      "GAD Manager",
    ];

    const targetRole = role;
    if (rolesRequiringAdmin.includes(targetRole)) {
      if (!admin.length) {
        return res.status(400).json({
          message: "At least one admin is required",
        });
      }
    }

    if (rolesRequiringHrManager.includes(targetRole)) {
      if (!hrManager) {
        return res.status(400).json({
          message: "Hr Manager is required",
        });
      }
    }

    if (manager) {
      const managerUser = await User.findById(manager);

      if (
        !managerUser ||
        !["Manager", "Hr Manager", "GAD Manager"].includes(managerUser.role)
      ) {
        return res.status(400).json({
          message: "Invalid manager selected",
        });
      }
    }

    if (admin.length) {
      const admins = await User.find({
        _id: { $in: admin },
        role: "Admin",
      });

      if (admins.length !== admin.length) {
        return res.status(400).json({
          message: "Invalid admin selected",
        });
      }
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: await hashPassword(password),
      plainPassword: password,
      role: role || "Employee",
      designation: designation || "Junior Developer",
      status: "Enable",
    });

    const employeeData = {
      user: user._id,
      mobileNumber: mobileNumber || "",
      dateOfBirth: dateOfBirth || null,
      departments: departments || [],
    };

    if (["Employee"].includes(user.role)) {
      employeeData.dailyWorkLimit = dailyWorkLimit || 9;
      employeeData.proficiency = proficiency || 100;
      employeeData.employeeCode = employeeCode?.toUpperCase();
      employeeData.joinedDate = joinedDate || "";
      employeeData.manager = manager || null;
      employeeData.admin = admin;
      employeeData.hrManager = hrManager;
    }

    if (["Manager"].includes(user.role)) {
      employeeData.dailyWorkLimit = dailyWorkLimit || 9;
      employeeData.proficiency = proficiency || 100;
      employeeData.employeeCode = employeeCode?.toUpperCase();
      employeeData.joinedDate = joinedDate || "";
      employeeData.manager = null;
      employeeData.admin = admin;
      employeeData.hrManager = hrManager;
    }

    if (["GAD Employee", "Hr Employee"].includes(user.role)) {
      employeeData.dailyWorkLimit = dailyWorkLimit || 9;
      employeeData.employeeCode = employeeCode?.toUpperCase();
      employeeData.joinedDate = joinedDate || "";
      employeeData.manager = manager || null;
      employeeData.admin = admin;
      employeeData.hrManager = hrManager;
    }

    if (["GAD Manager", "Hr Manager"].includes(user.role)) {
      employeeData.dailyWorkLimit = dailyWorkLimit || 9;
      employeeData.employeeCode = employeeCode?.toUpperCase();
      employeeData.joinedDate = joinedDate || "";
      employeeData.manager = null;
      employeeData.admin = admin;
      employeeData.hrManager = role === "Hr Manager" ? user._id : hrManager;
    }

    if (user.role === "Admin") {
      employeeData.proficiency = proficiency || 100;
    }

    await Employee.create(employeeData);

    const result = await User.findById(user._id).populate("employee");
    try {
      const io = req.app.get("socketio");
      await sendNotification(
        user,
        {
          type: "system",
          title: "Account Created",
          message: `Hello ${name}, your account has been created successfully.`,
          credentials: {
            email: email,
            password: password,
          },
        },
        io,
      );
    } catch (notifErr) {
      console.error("Notification failed:", notifErr.message);
    }
    emitEvent(req, "employeeChanged", sanitizeUser(result));
    emitDashboardUpdate(req);
    res.status(201).json(sanitizeUser(result));
  } catch (err) {
    if (err.code === 11000 && err.keyPattern?.employeeCode) {
      return res.status(400).json({ message: "Employee code already exists" });
    }
    res.status(500).json({ error: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const {
      name,
      email,
      employeeCode,
      role,
      designation,
      departments,
      dailyWorkLimit,
      joinedDate,
      proficiency,
      mobileNumber,
      dateOfBirth,
      manager,
      admin = [],
      hrManager,
    } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (email) {
      const existing = await User.findOne({
        email: email.toLowerCase(),
        _id: { $ne: user._id },
      });

      if (existing) {
        return res.status(400).json({
          message: "Email already exists",
        });
      }
    }
    if (employeeCode) {
      const existingCode = await Employee.findOne({
        employeeCode: employeeCode.toUpperCase(),
        user: { $ne: user._id },
      });

      if (existingCode) {
        return res.status(400).json({
          message: "Employee code already exists",
        });
      }
    }

    const rolesRequiringAdmin = [
      "Employee",
      "Manager",
      "Hr Employee",
      "Hr Manager",
      "GAD Employee",
      "GAD Manager",
    ];

    const rolesRequiringHrManager = [
      "Employee",
      "Manager",
      "Hr Employee",
      "GAD Employee",
      "GAD Manager",
    ];
    const targetRole = role || user.role;

    if (rolesRequiringAdmin.includes(targetRole)) {
      if (!admin.length) {
        return res.status(400).json({
          message: "At least one admin is required",
        });
      }
    }

    if (rolesRequiringHrManager.includes(targetRole)) {
      if (!hrManager) {
        return res.status(400).json({
          message: "Hr Manager is required",
        });
      }
    }

    if (manager) {
      const managerUser = await User.findById(manager);

      if (
        !managerUser ||
        !["Manager", "Hr Manager", "GAD Manager"].includes(managerUser.role)
      ) {
        return res.status(400).json({
          message: "Invalid manager selected",
        });
      }
    }

    if (admin.length) {
      const admins = await User.find({
        _id: { $in: admin },
        role: "Admin",
      });

      if (admins.length !== admin.length) {
        return res.status(400).json({
          message: "Invalid admin selected",
        });
      }
    }

    if (hrManager) {
      const hrUser = await User.findById(hrManager);

      if (!hrUser || hrUser.role !== "Hr Manager") {
        return res.status(400).json({
          message: "Invalid HR Manager selected",
        });
      }
    }

    if (user.role === "Admin" && role && role !== "Admin") {
      return res.status(400).json({
        message: "Admin role cannot be changed",
      });
    }

    if (
      req.user.role === "Admin" &&
      user.role === "Admin" &&
      user._id.toString() !== req.user._id.toString()
    ) {
      const allowedFields = ["designation", "departments"];

      const invalidFields = Object.keys(req.body).filter(
        (key) => !allowedFields.includes(key) && req.body[key] !== undefined,
      );

      if (invalidFields.length) {
        return res.status(403).json({
          message:
            "You can only update designation and departments for other admins",
        });
      }
    }

    if (name) user.name = name;
    if (email) user.email = email.toLowerCase();
    if (role) user.role = role;
    if (designation) user.designation = designation;
    await user.save();

    const employeeData = {
      mobileNumber: mobileNumber || "",
      dateOfBirth: dateOfBirth || null,
      departments: departments || [],
    };

    if (["Employee"].includes(user.role)) {
      employeeData.dailyWorkLimit = dailyWorkLimit || 9;
      employeeData.proficiency = proficiency || 100;
      employeeData.employeeCode = employeeCode?.toUpperCase();
      employeeData.joinedDate = joinedDate || "";
      employeeData.manager = manager || null;
      employeeData.admin = admin;
      employeeData.hrManager = hrManager;
    }

    if (["Manager"].includes(user.role)) {
      employeeData.dailyWorkLimit = dailyWorkLimit || 9;
      employeeData.proficiency = proficiency || 100;
      employeeData.employeeCode = employeeCode?.toUpperCase();
      employeeData.joinedDate = joinedDate || "";
      employeeData.manager = null;
      employeeData.admin = admin;
      employeeData.hrManager = hrManager;
    }

    if (["GAD Employee", "Hr Employee"].includes(user.role)) {
      employeeData.dailyWorkLimit = dailyWorkLimit || 9;
      employeeData.employeeCode = employeeCode?.toUpperCase();
      employeeData.joinedDate = joinedDate || "";
      employeeData.manager = manager || null;
      employeeData.admin = admin;
      employeeData.hrManager = hrManager;
    }

    if (["GAD Manager", "Hr Manager"].includes(user.role)) {
      employeeData.dailyWorkLimit = dailyWorkLimit || 9;
      employeeData.employeeCode = employeeCode?.toUpperCase();
      employeeData.joinedDate = joinedDate || "";
      employeeData.manager = null;
      employeeData.admin = admin;
      employeeData.hrManager =
        user.role === "Hr Manager" ? user._id : hrManager;
    }

    await Employee.findOneAndUpdate({ user: user._id }, employeeData, {
      new: true,
      upsert: true,
    });
    const updated = await User.findById(user._id).populate("employee").lean();
    emitEvent(req, "employeeChanged", sanitizeUser(updated));
    emitDashboardUpdate(req);
    res.json(sanitizeUser(updated));
  } catch (err) {
    if (err.code === 11000 && err.keyPattern?.employeeCode) {
      return res.status(400).json({ message: "Employee code already exists" });
    }
    res.status(500).json({ error: err.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password -plainPassword")
      .populate("employee")
      .sort({ createdAt: -1 });

    res.json(users.map((u) => sanitizeUser(u)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password -plainPassword")
      .populate("employee");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(sanitizeUser(user));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.changeUserStatus = async (req, res) => {
  try {
    const existingUser = await User.findById(req.params.id);
    if (!existingUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }
    if (existingUser.role === "Admin") {
      return res.status(400).json({
        message: "Admin status cannot be changed",
      });
    }
    existingUser.status = req.body.status;
    await existingUser.save();
    emitEvent(req, "employeeChanged", {
      userId: existingUser._id,
      status: existingUser.status,
    });
    emitDashboardUpdate(req);
    res.json({
      message: `User is now ${existingUser.status}`,
      status: existingUser.status,
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ message: "User not found" });

    if (targetUser.role !== "Admin") {
      await User.findByIdAndDelete(req.params.id);
      await Employee.findOneAndDelete({ user: targetUser._id });
      emitEvent(req, "employeeChanged", targetUser._id);
      emitDashboardUpdate(req);
      return res.json({ message: "User deleted successfully." });
    }

    const existing = await DeleteRequest.findOne({
      targetUser: targetUser._id,
      status: "Pending",
    });
    if (existing) {
      return res.status(400).json({
        message: "A delete request is already pending for this admin.",
      });
    }

    const allAdmins = await User.find({
      role: "Admin",
      _id: { $ne: req.user._id },
      status: "Enable",
    });

    const request = await DeleteRequest.create({
      targetUser: targetUser._id,
      requestedBy: req.user._id,
      approvals: [req.user._id],
    });

    emitEvent(req, "deleteRequestChanged", request);
    return res.json({
      message: "Delete request sent to all admins for approval.",
      requestId: request._id,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.respondToDeleteRequest = async (req, res) => {
  try {
    const { requestId, action } = req.body;

    const request = await DeleteRequest.findById(requestId);
    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.status !== "Pending")
      return res.status(400).json({ message: "Request already resolved" });

    const alreadyVoted =
      request.approvals.includes(req.user._id) ||
      request.rejections.includes(req.user._id);
    if (alreadyVoted)
      return res.status(400).json({ message: "You have already responded" });

    if (action === "reject") {
      request.rejections.push(req.user._id);
      request.status = "Rejected";
      await request.save();
      emitEvent(req, "deleteRequestChanged", request);
      return res.json({ message: "Delete request rejected." });
    }

    request.approvals.push(req.user._id);

    const allAdmins = await User.find({
      role: "Admin",
      status: "Enable",
      _id: { $ne: request.targetUser },
    });

    const allApproved = allAdmins.every((admin) =>
      request.approvals.map(String).includes(String(admin._id)),
    );

    if (allApproved) {
      request.status = "Approved";
      await request.save();

      await User.findByIdAndDelete(request.targetUser);
      await Employee.findOneAndDelete({ user: request.targetUser });
      emitEvent(req, "employeeChanged", request.targetUser);
      emitDashboardUpdate(req);
      return res.json({
        message: "All admins approved. Admin deleted successfully.",
      });
    }

    await request.save();
    emitEvent(req, "deleteRequestChanged", request);
    return res.json({
      message: "Approval recorded. Waiting for other admins.",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPendingDeleteRequests = async (req, res) => {
  try {
    const requests = await DeleteRequest.find()
      .populate("targetUser", "name email role")
      .populate("requestedBy", "name")
      .populate("approvals", "name _id")
      .populate("rejections", "name _id")
      .lean();

    const filtered = requests.filter(
      (r) => String(r.targetUser?._id) !== String(req.user._id),
    );

    const enriched = filtered.map((r) => {
      const hasApproved = r.approvals.some(
        (a) => String(a._id) === String(req.user._id),
      );
      const hasRejected = r.rejections.some(
        (a) => String(a._id) === String(req.user._id),
      );
      const isRequester = String(r.requestedBy?._id) === String(req.user._id);

      return {
        ...r,
        hasResponded: hasApproved || hasRejected || isRequester,
        isRequester,
        myAction: hasApproved
          ? "approved"
          : hasRejected
            ? "rejected"
            : isRequester
              ? "requested"
              : null,
      };
    });

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUsersByDepartments = async (req, res) => {
  try {
    const { departments } = req.query;

    let employees;

    if (!departments) {
      employees = await Employee.find({}).populate("user", "name role").lean();
    } else {
      const departmentIds = departments.split(",");
      employees = await Employee.find({
        departments: { $in: departmentIds },
      })
        .populate("user", "name role")
        .lean();
    }

    const managers = employees
      .filter((e) =>
        ["Manager", "Hr Manager", "GAD Manager"].includes(e.user?.role),
      )
      .map((e) => ({ _id: e.user._id, name: e.user.name }));

    const admins = employees
      .filter((e) => e.user?.role === "Admin")
      .map((e) => ({ _id: e.user._id, name: e.user.name }));

    const hrManagers = await User.find({
      role: "Hr Manager",
      status: "Enable",
    })
      .select("name")
      .lean();

    res.json({
      managers,
      admins,
      hrManagers,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.heartbeat = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      lastActiveAt: now(),
    });
    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

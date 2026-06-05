const User = require("../models/User");
const Employee = require("../models/Employee");
const { sanitizeUser } = require("../utils/userHelpers");
const { hashPassword } = require("../utils/authHelpers");
const sendNotification = require("../utils/notifier");
const { emitDashboardUpdate } = require("../utils/socket");
const { now } = require("../utils/dateHelper");

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
    } = req.body;
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing)
      return res.status(400).json({ message: "Email already exists" });
    const existingCode = await Employee.findOne({
      employeeCode: employeeCode.toUpperCase(),
    });
    if (existingCode)
      return res.status(400).json({ message: "Employee code already exists" });
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: await hashPassword(password),
      plainPassword: password,
      role: role || "Employee",
      designation: designation || "Junior Developer",
      status: "Enable",
    });
    if (["Employee", "Manager", "HR"].includes(user.role)) {
      const employeeData = {
        user: user._id,
        employeeCode: employeeCode.toUpperCase(),
        departments: departments || "",
        joinedDate: joinedDate || "",
        mobileNumber: mobileNumber || "",
        dateOfBirth: dateOfBirth || null,
      };

      if (["Employee", "Manager"].includes(user.role)) {
        employeeData.dailyWorkLimit = dailyWorkLimit || 9;
        employeeData.proficiency = proficiency || 100;
      }

      await Employee.create(employeeData);
    }
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
    } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (employeeCode) {
      const existingCode = await Employee.findOne({
        employeeCode: employeeCode.toUpperCase(),
        user: { $ne: user._id },
      });
      if (existingCode)
        return res
          .status(400)
          .json({ message: "Employee code already exists" });
    }
    if (name) user.name = name;
    if (email) user.email = email.toLowerCase();
    if (role) user.role = role;
    if (designation) user.designation = designation;
    await user.save();
    if (["Employee", "Manager", "HR"].includes(user.role)) {
      const employeeData = {
        employeeCode: employeeCode?.toUpperCase(),
        departments: departments || [],
        joinedDate,
        mobileNumber,
        dateOfBirth,
      };

      if (["Employee", "Manager"].includes(user.role)) {
        employeeData.dailyWorkLimit = dailyWorkLimit;
        employeeData.proficiency = proficiency;
      }

      await Employee.findOneAndUpdate({ user: user._id }, employeeData, {
        new: true,
        upsert: true,
      });
    }
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
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true },
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    emitEvent(req, "employeeChanged", {
      userId: user._id,
      status: user.status,
    });
    emitDashboardUpdate(req);
    res.json({ message: `User is now ${user.status}`, status: user.status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// ================= DELETE USER =================
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    await Employee.findOneAndDelete({ user: user._id });
    emitEvent(req, "employeeChanged", user._id);
    emitDashboardUpdate(req);
    res.json({ message: "User and employee profile deleted successfully." });
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

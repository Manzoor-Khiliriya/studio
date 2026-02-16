const User = require("../models/User");
const Employee = require("../models/Employee");
const { sanitizeUser } = require("../utils/userHelpers");
const { hashPassword } = require("../utils/authHelpers");
const sendNotification = require("../utils/notifier");


exports.createUser = async (req, res) => {
  try {
    const { 
      name, email, password, designation, 
      dailyWorkLimit, efficiency, joinedDate,
      mobileNumber, dateOfBirth
    } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ message: "Email already exists" });

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: await hashPassword(password),
      role: "Employee",
      status: "Enable",
    });

    if (user.role === "Employee") {
      await Employee.create({
        user: user._id,
        designation: designation || "Junior Developer",
        dailyWorkLimit: dailyWorkLimit || 9,
        efficiency: efficiency || 100,
        joinedDate: joinedDate || "",
        mobileNumber: mobileNumber || "",
        dateOfBirth: dateOfBirth || null
      });
    }

    try {
      const io = req.app.get('socketio');
      await sendNotification(user, {
        type: "system",
        password: password,
        message: "Your account has been created successfully."
      }, io);
    } catch (notifErr) {
      console.error("Welcome email failed:", notifErr.message);
    }

    const result = await User.findById(user._id).populate("employee");
    res.status(201).json(sanitizeUser(result));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { 
      name, email, designation, dailyWorkLimit, 
      joinedDate, efficiency, leaves,
      mobileNumber, dateOfBirth
    } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (name) user.name = name;
    if (email) user.email = email.toLowerCase();

    await user.save();

    if (user.role === "Employee") {
      await Employee.findOneAndUpdate(
        { user: user._id },
        {
          designation,
          dailyWorkLimit,
          efficiency,
          joinedDate,
          leaves,
          mobileNumber,
          dateOfBirth
        },
        { new: true, upsert: true }
      );
    }

    const updated = await User.findById(user._id).populate("employee");
    res.json(sanitizeUser(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .populate("employee")
      .sort({ createdAt: -1 });

    res.json(users.map(u => sanitizeUser(u)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
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
      { new: true }
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: `User is now ${user.status}`, status: user.status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    await Employee.findOneAndDelete({ user: user._id });

    res.json({ message: "User and employee profile deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

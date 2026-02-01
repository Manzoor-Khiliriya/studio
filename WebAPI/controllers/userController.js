const User = require("../models/User");
const {
  validateRequiredFields,
  sanitizeUser,
  isActiveAdmin
} = require("../utils/userHelpers");
const { hashPassword } = require("../utils/authHelpers");

// --- CREATE USER ---
exports.createUser = async (req, res) => {
  try {
    if (!isActiveAdmin(req.user)) {
      return res.status(403).json({ message: "Access denied. Only active Admins can create users." });
    }

    const error = validateRequiredFields(req.body, ["name", "email", "password", "designation"]);
    if (error) return res.status(400).json({ message: error });

    const { name, email, password, designation, dailyWorkLimit, efficiency } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await hashPassword(password);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "Employee",
      designation,
      dailyWorkLimit: dailyWorkLimit || 540,
      efficiency: efficiency || 100,
      photo: req.file?.path || "",
      status: "Enable"
    });

    res.status(201).json(sanitizeUser(user));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- UPDATE USER ---
exports.updateUser = async (req, res) => {
  try {
    if (!isActiveAdmin(req.user)) {
      return res.status(403).json({ message: "Access denied. Only active Admins can create users." });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { name, designation, status, dailyWorkLimit, efficiency } = req.body;

    if (name) user.name = name;
    if (designation) user.designation = designation;
    if (status) user.status = status;
    if (dailyWorkLimit) user.dailyWorkLimit = dailyWorkLimit;
    if (efficiency !== undefined) user.efficiency = efficiency;

    await user.save();
    res.json(sanitizeUser(user));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * 🧑‍💼 GET ALL USERS (Admin Only)
 * Used for task assignment and employee management
 */
exports.getAllUsers = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 8 } = req.query;
    let query = { role: "Employee" };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { designation: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }

    if (status && status !== "All") {
      query.status = status === "Active" ? "Enable" : "Disable";
    }

    const totalEmployees = await User.countDocuments(query);
    const employees = await User.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    res.json({
      employees,
      totalPages: Math.ceil(totalEmployees / limit),
      currentPage: Number(page),
      totalEmployees
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- GET SINGLE USER ---
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    // const requester = req.user;

    // const isAdmin = isActiveAdmin(requester);

    // const isSelf = requester._id.toString() === targetId;

    // if (!isAdmin && !isSelf) {
    //   return res.status(403).json({ 
    //     message: "Access denied. Employees can only view their own profile." 
    //   });
    // }

    const user = await User.findById(id).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.status !== "Enable") {
      return res.status(403).json({ message: "This account is currently disabled." });
    }

    res.json(sanitizeUser(user));
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message });
  }
};

// --- PERMANENT DELETE (Admin Only) ---
exports.deleteUser = async (req, res) => {
  try {
    // 1. Check if requester is an Active Admin
    if (!isActiveAdmin(req.user)) {
      return res.status(403).json({ message: "Access denied. Only active Admins can delete users." });
    }

    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: `User ${user.name} and all associated data removed from database.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- CHANGE USER STATUS (Admin Only) ---
exports.changeUserStatus = async (req, res) => {
  try {
    if (!isActiveAdmin(req.user)) {
      return res.status(403).json({ message: "Access denied. Only active Admins can change user status." });
    }

    const { status } = req.body; // Expecting "Enable" or "Disable"

    if (!["Enable", "Disable"].includes(status)) {
      return res.status(400).json({ message: "Invalid status. Use 'Enable' or 'Disable'." });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.status = status;
    await user.save();

    res.json({
      message: `User status updated to ${status} successfully.`,
      user: sanitizeUser(user)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
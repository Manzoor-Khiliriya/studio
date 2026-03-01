const Employee = require("../models/Employee");
const User = require("../models/User");

exports.getAllEmployees = async (req, res) => {
  try {
    const { search = "", page = 1, limit = 10, status } = req.query;

    const numericLimit = Number(limit);
    const numericPage = Number(page);

    let userCriteria = {};
    if (search) userCriteria.name = { $regex: search, $options: "i" };
    
    if (status && status !== "All") {
      userCriteria.status = status === "Active" ? "Enable" : "Disable";
    }

    const users = await User.find(userCriteria).select("_id");
    const userIds = users.map(u => u._id);

    let query = { user: { $in: userIds } };

    const employees = await Employee.find(query)
      .populate("user", "name email status")
      .sort({ createdAt: -1 })
      .limit(numericLimit)
      .skip((numericPage - 1) * numericLimit)
      .lean();

    const total = await Employee.countDocuments(query);

    res.json({
      employees,
      totalPages: Math.ceil(total / numericLimit),
      currentPage: numericPage,
      totalEmployees: total,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateEmployeeStats = async (req, res) => {
  try {
    const { designation, dailyWorkLimit, efficiency, skills, joinedDate, photo, leaves } = req.body;

    const updateData = {};
    if (designation !== undefined) updateData.designation = designation;
    if (dailyWorkLimit !== undefined) updateData.dailyWorkLimit = dailyWorkLimit;
    if (efficiency !== undefined) updateData.efficiency = efficiency;
    if (skills !== undefined) updateData.skills = skills;
    if (joinedDate !== undefined) updateData.joinedDate = joinedDate;
    if (photo !== undefined) updateData.photo = photo;
    
    if (leaves !== undefined) updateData.leaves = leaves; 

    const employee = await Employee.findOneAndUpdate(
      { user: req.params.userId },
      updateData,
      { new: true, runValidators: true }
    ).populate("user", "name email status role");

    if (!employee) return res.status(404).json({ message: "Employee profile not found" });
    res.json(employee);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getEmployeeProfile = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.params.userId })
      .populate("user", "name email role status")
      .lean();

    if (!employee) return res.status(404).json({ message: "Employee not found" });

    res.json(employee);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMyEmployeeProfile = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id })
      .populate("user", "name email role status")
      .lean();

    if (!employee) {
      return res.status(404).json({ message: "Employee profile not found" });
    }

    res.json(employee);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET ACTIVE EMPLOYEES LIST (For Dropdowns)
 * Returns only _id and name for enabled users to minimize payload
 */
exports.getActiveEmployeesList = async (req, res) => {
  try {
    // 1. Find all users who are 'Enable'
    const activeUsers = await User.find({ status: "Enable" })
      .select("name")
      .lean();

    const userIds = activeUsers.map(u => u._id);

    // 2. Get their employee profiles (to ensure they have one)
    const employees = await Employee.find({ user: { $in: userIds } })
      .populate("user", "name")
      .select("designation user")
      .sort({ "user.name": 1 }) // Alphabetical order
      .lean();

    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
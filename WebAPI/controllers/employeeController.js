const Employee = require("../models/Employee");
const User = require("../models/User");

exports.getAllEmployees = async (req, res) => {
  try {
    const { search = "", page = 1, limit = 10, status } = req.query;
    const numericLimit = Number(limit);
    const numericPage = Number(page);
    let userCriteria = { role: "Employee" };
    if (search) {
      userCriteria.name = { $regex: search, $options: "i" };
    }
    if (status && status !== "All") {
      userCriteria.status = status === "Active" ? "Enable" : "Disable";
    }
    const users = await User.find(userCriteria).select("_id");
    console.log(users)
    const userIds = users.map(u => u._id);
    const query = { user: { $in: userIds } };
    console.log(userIds)
    const employees = await Employee.find(query)
      .populate("user", "name email status +plainPassword")
      .sort({ createdAt: -1 })
      .limit(numericLimit)
      .skip((numericPage - 1) * numericLimit)
      .lean();
    console.log(employees)
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

exports.getEmployeeProfile = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.params.userId })
      .populate("user", "name email role status")
      .lean();
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }
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

exports.getActiveEmployeesList = async (req, res) => {
  try {
    const activeUsers = await User.find({ status: "Enable" })
      .select("name")
      .lean();
    const userIds = activeUsers.map(u => u._id);
    const employees = await Employee.find({ user: { $in: userIds } })
      .populate("user", "name")
      .select("employeeCode designation user")
      .sort({ "user.name": 1 })
      .lean();
    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
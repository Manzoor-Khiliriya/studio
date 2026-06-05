const Employee = require("../models/Employee");
const User = require("../models/User");

exports.getAllEmployees = async (req, res) => {
  try {
    const {
      search = "",
      page = 1,
      limit = 10,
      status,
      role = "Employee",
    } = req.query;
    const numericLimit = Number(limit);
    const numericPage = Number(page);
    let userCriteria = { role };
    if (search) {
      userCriteria.name = { $regex: search, $options: "i" };
    }
    if (status && status !== "All") {
      userCriteria.status = status === "Active" ? "Enable" : "Disable";
    }

    if (role === "Admin") {
      const admins = await User.find(userCriteria)
        .populate("designation", "name")
        .select("-password  +plainPassword")
        .sort({ createdAt: -1 })
        .limit(numericLimit)
        .skip((numericPage - 1) * numericLimit)
        .lean();

      const total = await User.countDocuments(userCriteria);

      return res.json({
        employees: admins.map((admin) => ({
          _id: admin._id,
          user: {
            _id: admin._id,
            name: admin.name,
            email: admin.email,
            status: admin.status,
            role: admin.role,
            designation: admin.designation,
            plainPassword:
              req.user._id.toString() === admin._id.toString()
                ? admin.plainPassword
                : null,
          },
        })),
        totalPages: Math.ceil(total / numericLimit),
        currentPage: numericPage,
        totalEmployees: total,
      });
    }

    const users = await User.find(userCriteria)
      .populate("designation", "name")
      .select("_id");
    const userIds = users.map((u) => u._id);
    const query = { user: { $in: userIds } };
    const employees = await Employee.find(query)
      .populate({
        path: "user",
        select: "name email status role designation +plainPassword",
        populate: {
          path: "designation",
          select: "name",
        },
      })
      .populate("departments", "name")
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

exports.getEmployeeProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate("designation", "name")
      .lean();

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.role === "Admin") {
      return res.json({
        _id: user._id,
        user,
        departments: [],
      });
    }

    const employee = await Employee.findOne({
      user: req.params.userId,
    })
      .populate({
        path: "user",
        select: "name email role designation status",
        populate: {
          path: "designation",
          select: "name",
        },
      })
      .populate("departments", "name")
      .lean();

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    res.json(employee);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
};

exports.getMyEmployeeProfile = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id })
      .select(
        "-dailyWorkLimit -proficiency -createdAt -updatedAt -createdBy -updatedBy",
      )
      .populate("user", "name email designation")
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
    const userIds = activeUsers.map((u) => u._id);
    const employees = await Employee.find({ user: { $in: userIds } })
      .select("employeeCode designation user")
      .populate({
        path: "user",
        select: "name designation",
        populate: {
          path: "designation",
          select: "name",
        },
      })
      .sort({ "user.name": 1 })
      .lean();
    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

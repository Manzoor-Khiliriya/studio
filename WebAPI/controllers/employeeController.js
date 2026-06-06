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
    const sanitizedEmployees = employees.map((emp) => {
      if (emp.user?.role === "Admin") {
        emp.user.plainPassword =
          emp.user._id.toString() === req.user._id.toString()
            ? emp.user.plainPassword
            : null;
      }

      return emp;
    });

    res.json({
      employees: sanitizedEmployees,
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
      .populate({
        path: "user",
        select: "name email designation",
        populate: {
          path: "designation",
          select: "name",
        },
      })
      .populate("departments", "name")
      .lean();
    if (!employee) {
      return res.status(404).json({ message: "Employee profile not found" });
    }
    res.json(employee);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAssignableUsers = async (req, res) => {
  try {
    const employees = await Employee.find()
      .populate({
        path: "user",
        match: {
          status: "Enable",
          role: {
            $in: ["Employee", "Manager", "Admin"],
          },
        },
        select: "name designation role",
        populate: {
          path: "designation",
          select: "name",
        },
      })
      .populate("departments", "name")
      .select("employeeCode departments user")
      .lean();

    const result = employees
      .filter((e) => e.user)
      .sort((a, b) => a.user.name.localeCompare(b.user.name));

    res.json(result);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
};

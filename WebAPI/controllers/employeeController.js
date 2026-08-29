const Employee = require("../models/Employee");
const TaskAllocation = require("../models/TaskAllocation");
const User = require("../models/User");
const { getToday } = require("../utils/dateHelper");

exports.getAllEmployees = async (req, res) => {
  try {
    const {
      search = "",
      page = 1,
      limit = 10,
      status,
      role = "Employee",
      type = "All",
    } = req.query;
    const numericLimit = Number(limit);
    const numericPage = Number(page);
    let userCriteria = {};

    if (role === "Employee") {
      if (role === "Employee") {
        if (type === "GAD Employee") {
          userCriteria.role = "GAD Employee";
        } else if (type === "Hr Employee") {
          userCriteria.role = "Hr Employee";
        } else if (type === "Employee") {
          userCriteria.role = "Employee";
        } else {
          userCriteria.$or = [
            { role: "Employee" },
            { role: "GAD Employee" },
            { role: "Hr Employee" },
          ];
        }
      }
    } else if (role === "Manager") {
      if (type === "GAD Manager") {
        userCriteria.role = "GAD Manager";
      } else if (type === "Hr Manager") {
        userCriteria.role = "Hr Manager";
      } else if (type === "Manager") {
        userCriteria.role = "Manager";
      } else {
        userCriteria.$or = [
          { role: "Manager" },
          { role: "GAD Manager" },
          { role: "Hr Manager" },
        ];
      }
    } else if (role === "Admin") {
      userCriteria.role = "Admin";
    } else {
      return res.json({
        employees: [],
        totalPages: 0,
        currentPage: numericPage,
        totalEmployees: 0,
      });
    }

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
      .populate("manager", "name")
      .populate("admin", "name")
      .populate("hrManager", "name")
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
      .populate("departments", "name")
      .populate("manager", "name")
      .populate("admin", "name")
      .populate("hrManager", "name")
      .lean();

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    // --- Average proficiency over the last 30 worked days ---
    const allocations = await TaskAllocation.find({ employee: employee._id })
      .select("dailyAllocations")
      .lean();

    // Group proficiency by date across all of this employee's tasks,
    // since they may have multiple allocations on the same day.
    const byDate = {};

    allocations.forEach((allocation) => {
      (allocation.dailyAllocations || []).forEach((day) => {
        if (day.proficiency === null || day.proficiency === undefined) return;

        if (!byDate[day.date]) {
          byDate[day.date] = { sum: 0, count: 0 };
        }
        byDate[day.date].sum += day.proficiency;
        byDate[day.date].count += 1;
      });
    });

    const today = getToday();

    const dayLevelProficiencies = Object.entries(byDate)
      .filter(([date]) => date < today)
      .map(([date, { sum, count }]) => ({
        date,
        proficiency: sum / count,
      }))
      .sort((a, b) => (a.date < b.date ? 1 : -1)) 
      .slice(0, 30);

    const avgProficiencyLast30Days =
      dayLevelProficiencies.length > 0
        ? Math.round(
            dayLevelProficiencies.reduce((acc, d) => acc + d.proficiency, 0) /
              dayLevelProficiencies.length,
          )
        : null;

    res.json({
      ...employee,
      avgProficiencyLast30Days,
      proficiencyDaysCount: dayLevelProficiencies.length,
    });
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
        select: "name email role designation",
        populate: {
          path: "designation",
          select: "name",
        },
      })
      .populate("departments", "name")
      .populate("manager", "name")
      .populate("admin", "name")
      .populate("hrManager", "name")
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

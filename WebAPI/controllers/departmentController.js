const Department = require("../models/Department");

exports.getDepartments = async (req, res) => {
  try {
    const departments = await Department.find()
      .populate("manager", "name role")
      .sort({ name: 1 });
    res.json(departments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createDepartment = async (req, res) => {
  try {
    const { name, manager } = req.body;

    const exists = await Department.findOne({
      name: name.trim(),
    });

    if (exists) {
      return res.status(400).json({
        message: "Department already exists",
      });
    }

    const department = await Department.create({
      name: name.trim(),
      manager,
    });

    res.status(201).json(department);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateDepartment = async (req, res) => {
  try {
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name?.trim(),
        manager: req.body.manager,
        status: req.body.status,
      },
      { new: true },
    );

    if (!department) {
      return res.status(404).json({
        message: "Department not found",
      });
    }

    res.json(department);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findByIdAndDelete(req.params.id);

    if (!department) {
      return res.status(404).json({
        message: "Department not found",
      });
    }

    res.json({
      message: "Department deleted successfully",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

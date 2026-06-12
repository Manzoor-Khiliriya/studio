const Designation = require("../models/Designation");

exports.getDesignations = async (req, res) => {
  try {
    const designations = await Designation.find()
      .sort({ name: 1 });

    res.json(designations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createDesignation = async (req, res) => {
  try {
    const { name, status } = req.body;

    const exists = await Designation.findOne({
      name: name.trim(),
    });

    if (exists) {
      return res.status(400).json({
        message: "Designation already exists",
      });
    }

    const designation = await Designation.create({
      name: name.trim(),
      status
    });

    res.status(201).json(designation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateDesignation = async (req, res) => {
  try {
    const designation = await Designation.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name?.trim(),
        status: req.body.status,
      },
      { new: true }
    );

    if (!designation) {
      return res.status(404).json({
        message: "Designation not found",
      });
    }

    res.json(designation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteDesignation = async (req, res) => {
  try {
    const designation = await Designation.findByIdAndDelete(
      req.params.id
    );

    if (!designation) {
      return res.status(404).json({
        message: "Designation not found",
      });
    }

    res.json({
      message: "Designation deleted successfully",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
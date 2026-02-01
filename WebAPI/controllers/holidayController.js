const Holiday = require('../models/Holiday');

// 🟢 Get all holidays (sorted by date)
exports.getHolidays = async (req, res) => {
  try {
    const holidays = await Holiday.find().sort({ date: 1 });
    res.json(holidays);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🟢 Add a single holiday
exports.addHoliday = async (req, res) => {
  try {
    const { name, date, description } = req.body;
    const holiday = await Holiday.create({ name, date, description });
    res.status(201).json(holiday);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: "Holiday already exists for this date." });
    res.status(500).json({ error: err.message });
  }
};

// 🟢 Bulk Add (Useful for new year setup)
exports.bulkAddHolidays = async (req, res) => {
  try {
    const { holidays } = req.body; // Expects an array of {name, date}
    const result = await Holiday.insertMany(holidays, { ordered: false });
    res.status(201).json({ message: `${result.length} holidays added successfully.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🟢 Delete a holiday
exports.deleteHoliday = async (req, res) => {
  try {
    await Holiday.findByIdAndDelete(req.params.id);
    res.json({ message: "Holiday removed." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
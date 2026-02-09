const Holiday = require("../models/Holiday");

/**
 * Get holidays (optional year filter)
 */
exports.getHolidays = async (req, res) => {
  try {
    const { year, search } = req.query;
    const query = {};

    // --- Year Filter ---
    if (year) {
      query.date = {
        $gte: new Date(`${year}-01-01`),
        $lte: new Date(`${year}-12-31T23:59:59.999Z`)
      };
    }

    // --- Search Filter ---
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },        // "i" makes it case-insensitive
        { description: { $regex: search, $options: "i" } }
      ];
    }

    const holidays = await Holiday.find(query).sort({ date: 1 }).lean();
    res.json(holidays);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Add holiday
 */
exports.addHoliday = async (req, res) => {
  try {
    const holiday = await Holiday.create(req.body);
    res.status(201).json(holiday);
  } catch (err) {
    if (err.code === 11000)
      return res.status(400).json({ message: "Holiday already exists for this date." });

    res.status(500).json({ error: err.message });
  }
};

/**
 * Update holiday
 */
exports.updateHoliday = async (req, res) => {
  try {
    const holiday = await Holiday.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!holiday) return res.status(404).json({ message: "Holiday not found." });

    res.json(holiday);
  } catch (err) {
    if (err.code === 11000)
      return res.status(400).json({ message: "Date conflict with another holiday." });

    res.status(500).json({ error: err.message });
  }
};

/**
 * Bulk add
 */
exports.bulkAddHolidays = async (req, res) => {
  try {
    const result = await Holiday.insertMany(req.body.holidays, { ordered: false });
    res.status(201).json({ message: `${result.length} holidays added.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Delete
 */
exports.deleteHoliday = async (req, res) => {
  try {
    const holiday = await Holiday.findByIdAndDelete(req.params.id);
    if (!holiday) return res.status(404).json({ message: "Holiday not found." });

    res.json({ message: "Holiday removed." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

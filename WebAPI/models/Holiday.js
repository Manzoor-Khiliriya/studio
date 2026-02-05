const mongoose = require("mongoose");

const holidaySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },

  date: {
    type: Date,
    required: true,
    unique: true,
    set: (d) => {
      const parsed = new Date(d);
      if (isNaN(parsed)) return undefined; // let Mongoose required validator handle it
      return new Date(parsed.toISOString().split("T")[0]);
    }
  },

  description: { type: String, trim: true }
}, { timestamps: true });

module.exports = mongoose.model("Holiday", holidaySchema);

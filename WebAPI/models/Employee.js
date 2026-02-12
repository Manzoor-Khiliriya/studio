const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
    index: true,
  },

  designation: { type: String, trim: true },
  photo: { type: String, default: "" },

  dailyWorkLimit: {
    type: Number,
    default: 9,
    min: 0,
    max: 24,
  },

  efficiency: {
    type: Number,
    default: 100,
    min: 1,
    max: 100,
  },

  skills: [{ type: String, trim: true }],

  joinedDate: { type: Date, default: Date.now },
  leaves: [{
    date: { type: Date, required: true },
    reason: { type: String, trim: true }
  }],
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// 🔹 Convert hours → minutes (used in task calculations)
employeeSchema.virtual("dailyWorkLimitMinutes").get(function () {
  return Math.round(this.dailyWorkLimit * 60);
});

module.exports = mongoose.model("Employee", employeeSchema);

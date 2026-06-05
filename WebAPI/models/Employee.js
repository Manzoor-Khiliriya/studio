const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    employeeCode: { type: String, trim: true, unique: true },
    departments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department",
      },
    ],
    mobileNumber: { type: String, trim: true, default: "" },
    dateOfBirth: { type: Date },
    dailyWorkLimit: {
      type: Number,
      min: 0,
      max: 24,
    },
    proficiency: {
      type: Number,
      min: 1,
      max: 100,
    },
    joinedDate: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

employeeSchema.virtual("dailyWorkLimitMinutes").get(function () {
  return Math.round(this.dailyWorkLimit * 60);
});

module.exports = mongoose.model("Employee", employeeSchema);

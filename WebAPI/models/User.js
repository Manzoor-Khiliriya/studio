const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    select: false,
  },
  role: {
    type: String,
    enum: ["Admin", "Employee"],
    default: "Employee",
    index: true,
  },
  status: {
    type: String,
    enum: ["Enable", "Disable"],
    default: "Enable",
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

userSchema.methods.isActive = function () {
  return this.status === "Enable";
};

userSchema.virtual("employee", {
  ref: "Employee",
  localField: "_id",
  foreignField: "user",
  justOne: true,
});

module.exports = mongoose.model("User", userSchema);

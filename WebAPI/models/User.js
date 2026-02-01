const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, "Name is required"], trim: true },
  email: { type: String, required: [true, "Email is required"], unique: true, lowercase: true, trim: true },
  
  // select: false ensures password isn't returned in GET requests by default
  password: { type: String, required: [true, "Password is required"], select: false },
  
  // IMPORTANT: Changed to "Admin"/"Employee" to match your isActiveAdmin helper
  role: { type: String, enum: ["Admin", "Employee"], default: "Employee", index: true },
  
  photo: { type: String, default: "" },
  designation: { type: String, default: "Junior Developer" },
  status: { type: String, enum: ["Enable", "Disable"], default: "Enable" },

  dailyWorkLimit: { 
    type: Number, 
    default: 540 
  },

  efficiency: { 
    type: Number, 
    default: 100,
    min: 1,
    max: 100 
  },

}, { 
  timestamps: true,
  toJSON: { virtuals: true }, 
  toObject: { virtuals: true } 
});

// Helper method on the model instance to check status
userSchema.methods.isActive = function() {
  return this.status === "Enable";
};

module.exports = mongoose.model("User", userSchema);
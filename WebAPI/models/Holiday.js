const mongoose = require('mongoose');

const HolidaySchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  date: { 
    type: Date, 
    required: true, 
    unique: true // Prevents duplicate holidays on the same day
  },
  description: { 
    type: String, 
    trim: true 
  }
}, { timestamps: true });

module.exports = mongoose.model('Holiday', HolidaySchema);
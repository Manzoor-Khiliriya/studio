const mongoose = require('mongoose');

const LeaveSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  type: { 
    type: String, 
    // Matches your balance-check logic in the controller
    enum: ['Annual Leave', 'Sick Leave', 'Personal', 'Maternity', 'Unpaid', 'Other'], 
    required: true 
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  reason: { type: String, required: true, trim: true },
  
  status: { 
    type: String, 
    enum: ['Pending', 'Approved', 'Rejected'], 
    default: 'Pending' 
  },

  processedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  adminComment: { type: String, trim: true },
  
  appliedAt: { type: Date, default: Date.now }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

/* --- VIRTUALS --- */

/**
 * RAW TOTAL DAYS
 * Note: This includes weekends and holidays. 
 * Use the 'businessDays' property from the controller for payroll/balance logic.
 */
LeaveSchema.virtual('rawTotalDays').get(function() {
  if (!this.startDate || !this.endDate) return 0;
  const start = new Date(this.startDate);
  const end = new Date(this.endDate);
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
});

module.exports = mongoose.model('Leave', LeaveSchema);
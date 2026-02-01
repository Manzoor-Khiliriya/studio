import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineArrowLeft } from 'react-icons/hi';

const LeaveModal = ({ isOpen, onClose, onSubmit, initialData }) => {
  // Local state to manage form fields for pre-filling
  const [formData, setFormData] = useState({
    type: 'Annual Leave',
    startDate: '',
    endDate: '',
    reason: ''
  });

  // Effect to sync form with initialData when editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        type: initialData.type || 'Annual Leave',
        // Format dates to YYYY-MM-DD for HTML input
        startDate: initialData.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : '',
        endDate: initialData.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : '',
        reason: initialData.reason || ''
      });
    } else {
      // Reset to defaults for new requests
      setFormData({
        type: 'Annual Leave',
        startDate: '',
        endDate: '',
        reason: ''
      });
    }
  }, [initialData, isOpen]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60]"
          />
          
          {/* Slide-over Panel */}
          <motion.div 
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-[70] shadow-2xl p-12 overflow-y-auto"
          >
            <button 
              onClick={onClose} 
              className="mb-12 flex items-center gap-2 text-slate-300 font-black hover:text-orange-600 uppercase text-[10px] tracking-widest transition-all"
            >
              <HiOutlineArrowLeft size={18} strokeWidth={3}/> Return to Ledger
            </button>
            
            <h2 className="text-4xl font-black text-slate-900 mb-2 tracking-tighter uppercase">
              {initialData ? "Update Leave" : "Apply Leave"}
            </h2>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em] mb-12 italic border-l-4 border-orange-500 pl-4">
              {initialData ? "Modifying existing mission" : "New absence request"}
            </p>
            
            <form onSubmit={onSubmit} className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Category</label>
                <select 
                  name="type" 
                  value={formData.type}
                  onChange={handleChange}
                  required 
                  className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-5 font-black text-xs text-slate-800 focus:border-orange-500 outline-none appearance-none"
                >
                  <option>Annual Leave</option>
                  <option>Sick Leave</option>
                  <option>Personal</option>
                  <option>Maternity</option>
                  <option>Unpaid</option>
                  <option>Other</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Start</label>
                  <input 
                    type="date" 
                    name="startDate" 
                    value={formData.startDate}
                    onChange={handleChange}
                    required 
                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-5 font-black text-xs text-slate-800 focus:border-orange-500 outline-none" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">End</label>
                  <input 
                    type="date" 
                    name="endDate" 
                    value={formData.endDate}
                    onChange={handleChange}
                    required 
                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-5 font-black text-xs text-slate-800 focus:border-orange-500 outline-none" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Reasoning</label>
                <textarea 
                  name="reason" 
                  value={formData.reason}
                  onChange={handleChange}
                  rows="4" 
                  required 
                  className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-5 font-black text-xs text-slate-800 focus:border-orange-500 outline-none" 
                  placeholder="Provide context for your absence..."
                />
              </div>

              <button 
                type="submit" 
                className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black uppercase tracking-widest shadow-xl hover:bg-orange-600 transition-all active:scale-95 border-b-4 border-slate-950"
              >
                {initialData ? "Save Changes" : "Transmit Request"}
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default LeaveModal
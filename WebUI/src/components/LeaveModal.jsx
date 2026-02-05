import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineArrowLeft, HiOutlineShieldCheck, HiOutlineDocumentText } from 'react-icons/hi';

const LeaveModal = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    type: 'Annual Leave',
    startDate: '',
    endDate: '',
    reason: ''
  });

  // Sync state with initialData for editing mode
  useEffect(() => {
    if (initialData) {
      setFormData({
        type: initialData.type || 'Annual Leave',
        startDate: initialData.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : '',
        endDate: initialData.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : '',
        reason: initialData.reason || ''
      });
    } else {
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

  const today = new Date().toISOString().split('T')[0];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* HIGH-FIDELITY BACKDROP */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[60]"
          />
          
          {/* ACTION PANEL */}
          <motion.div 
            initial={{ x: '100%' }} 
            animate={{ x: 0 }} 
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-lg bg-white z-[70] shadow-[-20px_0_60px_-15px_rgba(0,0,0,0.1)] p-12 flex flex-col"
          >
            {/* PANEL HEADER */}
            <div className="mb-12">
              <button 
                onClick={onClose} 
                className="group mb-8 flex items-center gap-2 text-slate-400 font-black hover:text-orange-600 uppercase text-[10px] tracking-[0.3em] transition-all"
              >
                <HiOutlineArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform"/> 
                Back to Registry
              </button>
              
              <h2 className="text-5xl font-black text-slate-900 mb-4 tracking-tighter uppercase leading-none italic">
                {initialData ? "Edit Request" : "New Application"}
              </h2>
              <div className="flex items-center gap-3 text-orange-500">
                 <HiOutlineShieldCheck size={20} />
                 <p className="font-black text-[10px] uppercase tracking-widest">
                   {initialData ? "Modifying Entry ID: " + initialData._id.slice(-6) : "Personnel Absence Protocol"}
                 </p>
              </div>
            </div>
            
            {/* FORM BODY */}
            <form onSubmit={onSubmit} className="space-y-10 flex-1">
              {/* CATEGORY SELECT */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Request Category</label>
                <div className="relative">
                  <select 
                    name="type" 
                    value={formData.type}
                    onChange={handleChange}
                    required 
                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] p-6 font-black text-xs text-slate-800 focus:bg-white focus:border-orange-500/20 focus:ring-4 focus:ring-orange-500/5 transition-all outline-none appearance-none cursor-pointer"
                  >
                    <option>Annual Leave</option>
                    <option>Sick Leave</option>
                    <option>Personal Leave</option>
                    <option>Maternity Leave</option>
                    <option>Paternity Leave</option>
                    <option>Unpaid Leave</option>
                  </select>
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <HiOutlineDocumentText size={20} />
                  </div>
                </div>
              </div>

              {/* DATE RANGE */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Commencement</label>
                  <input 
                    type="date" 
                    name="startDate" 
                    min={today}
                    value={formData.startDate}
                    onChange={handleChange}
                    required 
                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] p-6 font-black text-xs text-slate-800 focus:bg-white focus:border-orange-500/20 focus:ring-4 focus:ring-orange-500/5 transition-all outline-none tabular-nums" 
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Termination</label>
                  <input 
                    type="date" 
                    name="endDate" 
                    min={formData.startDate || today}
                    value={formData.endDate}
                    onChange={handleChange}
                    required 
                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] p-6 font-black text-xs text-slate-800 focus:bg-white focus:border-orange-500/20 focus:ring-4 focus:ring-orange-500/5 transition-all outline-none tabular-nums" 
                  />
                </div>
              </div>

              {/* REASONING */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Operational Justification</label>
                <textarea 
                  name="reason" 
                  value={formData.reason}
                  onChange={handleChange}
                  rows="5" 
                  required 
                  className="w-full bg-slate-50 border-2 border-slate-50 rounded-[2rem] p-8 font-bold text-xs text-slate-800 focus:bg-white focus:border-orange-500/20 focus:ring-4 focus:ring-orange-500/5 transition-all outline-none resize-none leading-relaxed" 
                  placeholder="State the reason for this absence deployment..."
                />
              </div>

              {/* ACTION FOOTER */}
              <div className="pt-8">
                <button 
                  type="submit" 
                  className="w-full bg-slate-900 text-white py-7 rounded-[2rem] font-black uppercase text-sm tracking-[0.3em] shadow-2xl hover:bg-orange-600 transition-all active:scale-[0.98] border-b-[6px] border-slate-950 flex items-center justify-center gap-3"
                >
                  {initialData ? "Update Registry" : "Authorize Request"}
                </button>
                <p className="text-center text-[9px] text-slate-400 font-black uppercase tracking-widest mt-6 italic">
                  * All requests are subject to Command review
                </p>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default LeaveModal;
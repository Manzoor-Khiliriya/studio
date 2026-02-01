import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiUser, FiMail, FiShield, FiDollarSign, FiSave } from "react-icons/fi";
import API from "../services/api";
import { toast } from "react-hot-toast";

export default function EditEmployeeModal({ employee, isOpen, onClose, onUpdate }) {
  const [formData, setFormData] = useState({
    name: employee?.name || "",
    email: employee?.email || "",
    role: employee?.role || "employee",
    hourlyRate: employee?.hourlyRate || 0,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await API.put(`/users/${employee._id}`, formData);
      toast.success("Employee profile updated");
      onUpdate(); // Refresh the list in the parent component
      onClose();
    } catch (err) {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden"
      >
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Edit Member</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">ID: {employee?._id.slice(-6)}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-colors text-slate-400">
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            {/* Name Input */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Full Name</label>
              <div className="relative">
                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:border-indigo-200 outline-none transition-all font-bold text-slate-700"
                />
              </div>
            </div>

            {/* Role Select */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">System Access</label>
              <div className="relative">
                <FiShield className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <select 
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:border-indigo-200 outline-none transition-all font-bold text-slate-700 appearance-none"
                >
                  <option value="employee">Employee</option>
                  <option value="admin">Administrator</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
            </div>

            {/* Hourly Rate */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Compensation (per hour)</label>
              <div className="relative">
                <FiDollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="number" 
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData({...formData, hourlyRate: e.target.value})}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:border-indigo-200 outline-none transition-all font-bold text-slate-700"
                />
              </div>
            </div>
          </div>

          <button 
            type="submit"
            disabled={saving}
            className="w-full bg-slate-900 hover:bg-indigo-600 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all shadow-xl shadow-slate-200 disabled:opacity-50"
          >
            {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><FiSave /> Save Changes</>}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
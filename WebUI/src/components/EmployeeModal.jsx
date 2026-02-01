import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  HiOutlineXMark, HiOutlineUser, 
  HiOutlineBriefcase, HiOutlineLockClosed, HiOutlineChartBar,
  HiOutlineEye, HiOutlineEyeSlash, HiOutlineShieldCheck
} from "react-icons/hi2";
import { CgSpinner } from "react-icons/cg";
import API from "../services/apiSlice";
import { toast } from "react-hot-toast";
import { HiOutlineMail } from "react-icons/hi";

export default function EmployeeModal({ isOpen, onClose, refreshData, editData = null }) {
  const isEditing = !!editData;
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const DAILY_LIMIT_MINS = 540; // Constant 9 Hours

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    designation: "",
    status: "Enable",
    efficiency: 100, // Default 100%
  });

  useEffect(() => {
    setShowPassword(false);
    if (editData) {
      setFormData({
        name: editData.name || "",
        email: editData.email || "",
        designation: editData.designation || "",
        status: editData.status || "Enable",
        efficiency: editData.efficiency || 100,
      });
    } else {
      setFormData({
        name: "",
        email: "",
        password: "",
        designation: "",
        status: "Enable",
        efficiency: 100,
      });
    }
  }, [editData, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const loadingToast = toast.loading(isEditing ? "Updating profile..." : "Onboarding talent...");

    try {
      const payload = {
        name: formData.name,
        designation: formData.designation,
        efficiency: Number(formData.efficiency),
        dailyWorkLimit: DAILY_LIMIT_MINS, // Always send 540
      };

      if (isEditing) {
        await API.put(`/users/${editData._id}`, { ...payload, status: formData.status });
        toast.success("Profile updated", { id: loadingToast });
      } else {
        await API.post("/users", {
          ...payload,
          email: formData.email.toLowerCase(),
          password: formData.password,
        });
        toast.success("Talent onboarded", { id: loadingToast });
      }
      refreshData();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed", { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
        
        <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl overflow-hidden" >
          {/* Header */}
          <div className="p-8 pb-4 flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">{isEditing ? "Edit Profile" : "Onboard Talent"}</h2>
              <p className="text-[10px] text-orange-500 font-black uppercase tracking-[0.2em] mt-1">9hr Daily Limit Policy Active</p>
            </div>
            <button onClick={onClose} className="p-3 hover:bg-slate-50 rounded-2xl text-slate-400"><HiOutlineXMark size={24} /></button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 pt-4 space-y-5">
            {/* Full Name */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Name</label>
              <div className="relative">
                <HiOutlineUser className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500" size={20} />
                <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-orange-500 outline-none transition-all font-bold text-slate-700" />
              </div>
            </div>

            {/* Designation */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Designation</label>
              <div className="relative">
                <HiOutlineBriefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500" size={20} />
                <input required type="text" value={formData.designation} onChange={(e) => setFormData({...formData, designation: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-orange-500 outline-none transition-all font-bold text-slate-700" />
              </div>
            </div>

            {!isEditing ? (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email</label>
                  <div className="relative">
                    <HiOutlineMail className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500" size={20} />
                    <input required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-orange-500 outline-none transition-all font-bold text-slate-700" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Access Key</label>
                  <div className="relative">
                    <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500" size={20} />
                    <input required type={showPassword ? "text" : "password"} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full pl-12 pr-14 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-orange-500 outline-none transition-all font-bold text-slate-700" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">{showPassword ? <HiOutlineEyeSlash size={20} /> : <HiOutlineEye size={20} />}</button>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Account Status</label>
                <div className="relative">
                  <HiOutlineShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500" size={20} />
                  <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className={`w-full pl-12 pr-4 py-4 border-2 border-transparent rounded-2xl outline-none transition-all font-bold appearance-none cursor-pointer ${formData.status === "Disable" ? "bg-red-50 text-red-600" : "bg-slate-50 text-slate-700"}`}>
                    <option value="Enable">Active</option>
                    <option value="Disable">Disabled</option>
                  </select>
                </div>
              </div>
            )}

            {/* Efficiency Input */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Efficiency Factor (%)</label>
              <div className="relative">
                <HiOutlineChartBar className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500" size={20} />
                <input required type="number" min="1" max="200" value={formData.efficiency} onChange={(e) => setFormData({...formData, efficiency: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-orange-500 outline-none transition-all font-bold text-slate-700" />
              </div>
              <p className="text-[9px] text-slate-400 font-bold ml-1 uppercase">
                {formData.efficiency}% Efficiency: Max Effective Hours = {((DAILY_LIMIT_MINS * (formData.efficiency / 100)) / 60).toFixed(1)} / day
              </p>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-slate-900 hover:bg-orange-600 text-white py-5 rounded-[2rem] font-black text-lg transition-all flex items-center justify-center gap-3 mt-4 active:scale-95">
              {loading ? <CgSpinner className="animate-spin" size={24} /> : (isEditing ? "Save Changes" : "Activate Access")}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
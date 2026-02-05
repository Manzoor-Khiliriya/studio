import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineXMark, HiOutlineUser,
  HiOutlineBriefcase, HiOutlineLockClosed, HiOutlineChartBar,
  HiOutlineEye, HiOutlineEyeSlash, HiOutlineShieldCheck,
  HiOutlineClock,
  HiOutlineCalendarDays
} from "react-icons/hi2";
import { CgSpinner } from "react-icons/cg";
import { toast } from "react-hot-toast";
import { HiOutlineMail } from "react-icons/hi";

// RTK Query Hooks
import { useCreateUserMutation, useUpdateUserMutation } from "../services/userApi";

export default function EmployeeModal({ isOpen, onClose, editData = null, onSubmit }) {
  const isEditing = !!editData;
  const [showPassword, setShowPassword] = useState(false);

  // 1. API PROTOCOLS
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();

  const getToday = () => new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    designation: "",
    efficiency: 100,
    joinedDate: getToday(),
    dailyWorkLimit: 9, // Default hours from backend
  });

  // 2. DATA SYNCHRONIZATION
  useEffect(() => {
    setShowPassword(false);
    if (editData && isOpen) {
      // Syncing with the nested structure returned by populate('user')
      setFormData({
        name: editData.user?.name || "",
        email: editData.user?.email || "",
        designation: editData.designation || "",
        efficiency: editData.efficiency || 100,
        dailyWorkLimit: editData.dailyWorkLimit || 9,
        joinedDate: editData.joinedDate
          ? editData.joinedDate.split('T')[0]
          : "",
      });
    } else if (isOpen) {
      setFormData({
        name: "",
        email: "",
        password: "",
        designation: "",
        efficiency: 100,
        joinedDate: getToday(),
        dailyWorkLimit: 9,
      });
    }
  }, [editData, isOpen]);

  // 3. SUBMISSION HANDLER
  const handleSubmit = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading(isEditing ? "Syncing profile updates..." : "Initializing operator access...");

    try {
      const payload = {
        name: formData.name,
        email: formData.email.toLowerCase(),
        designation: formData.designation,
        efficiency: Number(formData.efficiency),
        dailyWorkLimit: Number(formData.dailyWorkLimit),
        joinedDate: formData.joinedDate,
      };

      if (isEditing) {
        // Your backend updateUser expects the USER ID (from editData.user._id)
        await updateUser({
          id: editData.user._id,
          payload: payload
        }).unwrap();
        toast.success("Personnel dossier updated", { id: loadingToast });
      } else {
        // Create user requires a password
        await createUser({
          ...payload,
          password: formData.password,
        }).unwrap();
        toast.success("New talent onboarded to sector", { id: loadingToast });
      }
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || "Protocol override failed", { id: loadingToast });
    }
  };

  const loading = isCreating || isUpdating;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 40 }}
            className="relative bg-white w-full max-w-xl rounded-[4rem] shadow-[0_30px_100px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* HEADER */}
            <div className="p-10 pb-6 flex justify-between items-start bg-white border-b border-slate-50">
              <div>
                <p className="text-orange-500 font-black text-[10px] uppercase tracking-[0.4em] mb-2">Sector Registry</p>
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">
                  {isEditing ? "Edit Operator" : "Add Talent"}
                </h2>
              </div>
              <button onClick={onClose} className="p-4 bg-slate-50 hover:bg-rose-50 hover:text-rose-500 rounded-3xl transition-all">
                <HiOutlineXMark size={24} strokeWidth={2} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-10 pt-8 overflow-y-auto custom-scrollbar space-y-8">

              {/* BASIC IDENTITY */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Legal Name</label>
                  <div className="relative group">
                    <HiOutlineUser className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-500 transition-colors" size={20} />
                    <input
                      required
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent rounded-[1.8rem] focus:bg-white focus:border-orange-500 outline-none transition-all font-bold text-slate-800"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Operational Role</label>
                  <div className="relative group">
                    <HiOutlineBriefcase className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-500 transition-colors" size={20} />
                    <input
                      required
                      type="text"
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent rounded-[1.8rem] focus:bg-white focus:border-orange-500 outline-none transition-all font-bold text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* CONTACT & CREDENTIALS */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Work Email</label>
                  <div className="relative group">
                    <HiOutlineMail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-500 transition-colors" size={20} />
                    <input
                      required
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent rounded-[1.8rem] focus:bg-white focus:border-orange-500 outline-none transition-all font-bold text-slate-800"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    Joining Date
                  </label>
                  <div className="relative group">
                    <HiOutlineCalendarDays
                      className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-500 transition-colors"
                      size={20}
                    />
                    <input
                      required
                      type="date"
                      value={formData.joinedDate}
                      onChange={(e) => setFormData({ ...formData, joinedDate: e.target.value })}
                      className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent rounded-[1.8rem] focus:bg-white focus:border-orange-500 outline-none transition-all font-bold text-slate-800"
                    />
                  </div>
                </div>

                {!isEditing && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Access Password</label>
                    <div className="relative group">
                      <HiOutlineLockClosed className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-500 transition-colors" size={20} />
                      <input
                        required
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full pl-14 pr-16 py-5 bg-slate-50 border-2 border-transparent rounded-[1.8rem] focus:bg-white focus:border-orange-500 outline-none transition-all font-bold text-slate-800"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400">
                        {showPassword ? <HiOutlineEyeSlash size={22} /> : <HiOutlineEye size={22} />}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* OPERATIONAL LIMITS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-50">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Daily Hour Limit</label>
                  <div className="relative group">
                    <HiOutlineClock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-500 transition-colors" size={20} />
                    <input
                      required
                      type="number"
                      value={formData.dailyWorkLimit}
                      onChange={(e) => setFormData({ ...formData, dailyWorkLimit: e.target.value })}
                      className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent rounded-[1.8rem] focus:bg-white focus:border-orange-500 outline-none transition-all font-bold text-slate-800"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Efficiency (%)</label>
                  <div className="relative group">
                    <HiOutlineChartBar className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-500 transition-colors" size={20} />
                    <input
                      required
                      type="number"
                      value={formData.efficiency}
                      onChange={(e) => setFormData({ ...formData, efficiency: e.target.value })}
                      className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent rounded-[1.8rem] focus:bg-white focus:border-orange-500 outline-none transition-all font-bold text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* ACTION BUTTON */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 hover:bg-orange-600 text-white py-6 rounded-[2.2rem] font-black text-xl transition-all flex items-center justify-center gap-4 mt-6 active:scale-95 shadow-2xl shadow-orange-600/10 disabled:opacity-70"
              >
                {loading ? <CgSpinner className="animate-spin" size={28} /> : (isEditing ? "Update Personnel" : "Onboard Operator")}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
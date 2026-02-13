import { useState, useEffect } from "react";
import {
  HiOutlineUser, HiOutlineBriefcase, HiOutlineLockClosed,
  HiOutlineChartBar, HiOutlineEye, HiOutlineEyeSlash,
  HiOutlineClock, HiOutlineCalendarDays
} from "react-icons/hi2";
import { CgSpinner } from "react-icons/cg";
import { toast } from "react-hot-toast";
import CommonModal, { InputGroup } from "./CommonModal";
import { useCreateUserMutation, useUpdateUserMutation } from "../services/userApi";
import { HiOutlineMail } from "react-icons/hi";

export default function EmployeeModal({ isOpen, onClose, editData = null }) {
  const isEditing = !!editData;
  const [showPassword, setShowPassword] = useState(false);
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();

  const getToday = () => new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState({
    name: "", email: "", password: "", designation: "",
    efficiency: "100", joinedDate: getToday(), dailyWorkLimit: "9"
  });

  useEffect(() => {
    setShowPassword(false);
    if (editData && isOpen) {
      setFormData({
        name: editData.user?.name || "",
        email: editData.user?.email || "",
        designation: editData.designation || "",
        efficiency: String(editData.efficiency ?? 100),
        dailyWorkLimit: String(editData.dailyWorkLimit ?? 9),
        joinedDate: editData.joinedDate ? editData.joinedDate.split('T')[0] : ""
      });
    } else if (isOpen) {
      setFormData({
        name: "", email: "", password: "", designation: "",
        efficiency: "100", joinedDate: getToday(), dailyWorkLimit: "9"
      });
    }
  }, [editData, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let finalValue = (name === "efficiency" || name === "dailyWorkLimit")
      ? value.replace(/\D/g, "")
      : value;
    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading(isEditing ? "Updating profile..." : "Onboarding talent...");
    try {
      const payload = {
        ...formData,
        efficiency: Number(formData.efficiency),
        dailyWorkLimit: Number(formData.dailyWorkLimit),
        email: formData.email.toLowerCase(),
      };

      if (isEditing) {
        await updateUser({ id: editData.user._id, payload }).unwrap();
      } else {
        await createUser(payload).unwrap();
      }

      toast.success(isEditing ? "Profile updated" : "Member onboarded", { id: loadingToast });
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || "Operation failed", { id: loadingToast });
    }
  };

  return (
    <CommonModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Update Personnel" : "Authorize New Entry"}
      subtitle="Operational Identity Management"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputGroup label="Full Name">
            <HiOutlineUser className="input-icon" />
            <input required name="name" value={formData.name} onChange={handleChange} className="form-input" />
          </InputGroup>
          <InputGroup label="Job Title">
            <HiOutlineBriefcase className="input-icon" />
            <input required name="designation" value={formData.designation} onChange={handleChange} className="form-input" />
          </InputGroup>
        </div>

        <InputGroup label="Work Email">
          <HiOutlineMail className="input-icon" />
          <input required type="email" name="email" value={formData.email} onChange={handleChange} className="form-input" />
        </InputGroup>

        {!isEditing && (
          <InputGroup label="Access Credentials">
            <HiOutlineLockClosed className="input-icon" />
            <input 
              required 
              name="password" 
              type={showPassword ? "text" : "password"} 
              value={formData.password} 
              onChange={handleChange} 
              className="form-input pr-12" 
              placeholder="Set initial password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showPassword ? <HiOutlineEyeSlash size={18} /> : <HiOutlineEye size={18} />}
            </button>
          </InputGroup>
        )}

        <div className="pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputGroup label="Onboarding Date">
            <HiOutlineCalendarDays className="input-icon" />
            <input required type="date" name="joinedDate" value={formData.joinedDate} onChange={handleChange} className="form-input" />
          </InputGroup>
          <InputGroup label="Daily Ops Limit (Hrs)">
            <HiOutlineClock className="input-icon" />
            <input required name="dailyWorkLimit" value={formData.dailyWorkLimit} onChange={handleChange} className="form-input" />
          </InputGroup>
        </div>

        <InputGroup label="Personnel Efficiency (%)">
          <HiOutlineChartBar className="input-icon" />
          <input required name="efficiency" value={formData.efficiency} onChange={handleChange} className="form-input" />
        </InputGroup>

        <button
          disabled={isCreating || isUpdating}
          type="submit"
          className="w-full bg-slate-900 hover:bg-orange-600 text-white py-4 rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-200"
        >
          {(isCreating || isUpdating) ? (
            <CgSpinner className="animate-spin" size={20} />
          ) : (
            isEditing ? "Synchronize Updates" : "Validate Onboarding"
          )}
        </button>
      </form>
    </CommonModal>
  );
}
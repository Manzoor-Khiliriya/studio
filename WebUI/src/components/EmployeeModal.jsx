import { useState, useEffect } from "react";
import {
  HiOutlineUser, HiOutlineBriefcase, HiOutlineLockClosed,
  HiOutlineChartBar, HiOutlineEye, HiOutlineEyeSlash,
  HiOutlineClock, HiOutlineCalendarDays, HiOutlineTrash, HiPlus
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
    efficiency: "100", joinedDate: getToday(), dailyWorkLimit: "9",
    leaves: []
  });

  const [leaveInput, setLeaveInput] = useState("");

  useEffect(() => {
    setShowPassword(false);
    if (editData && isOpen) {
      setFormData({
        name: editData.user?.name || "",
        email: editData.user?.email || "",
        designation: editData.designation || "",
        efficiency: String(editData.efficiency ?? 100),
        dailyWorkLimit: String(editData.dailyWorkLimit ?? 9),
        joinedDate: editData.joinedDate ? editData.joinedDate.split('T')[0] : "",
        leaves: editData.leaves || []
      });
    } else if (isOpen) {
      setFormData({
        name: "", email: "", password: "", designation: "",
        efficiency: "100", joinedDate: getToday(), dailyWorkLimit: "9",
        leaves: []
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

  // 🔹 ADD LEAVE LOGIC
  const addLeave = () => {
    if (!leaveInput) return;
    const exists = formData.leaves.find(l => {
      const d = typeof l.date === 'string' ? l.date.split('T')[0] : new Date(l.date).toISOString().split('T')[0];
      return d === leaveInput;
    });

    if (exists) return toast.error("Date already marked as leave");

    setFormData(prev => ({
      ...prev,
      leaves: [...prev.leaves, { date: leaveInput, reason: "Manual Entry" }]
        .sort((a, b) => new Date(a.date) - new Date(b.date))
    }));
    setLeaveInput("");
  };

  // 🔹 REMOVE LEAVE LOGIC
  const removeLeave = (index) => {
    setFormData(prev => ({
      ...prev,
      leaves: prev.leaves.filter((_, i) => i !== index)
    }));
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
        // Remove leaves from payload if creating new user as per requirement
        const { leaves, ...createPayload } = payload;
        await createUser(createPayload).unwrap();
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
      title={isEditing ? "Update Profile" : "Add New Member"}
      subtitle="Sector Resource Management"
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
          <InputGroup label="Initial Password">
            <HiOutlineLockClosed className="input-icon" />
            <input required name="password" type={showPassword ? "text" : "password"} value={formData.password} onChange={handleChange} className="form-input pr-12" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer flex items-center justify-center"
            >
              {showPassword ? <HiOutlineEyeSlash size={18} /> : <HiOutlineEye size={18} />}
            </button>
          </InputGroup>
        )}

        {/* 🔹 PROJECT AVAILABILITY (LEAVES) - ONLY SHOW ON EDIT */}
        {isEditing && (
          <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-4 ml-1">Project Blackout Dates</label>
            <div className="flex gap-2 mb-4">
              <input
                type="date"
                value={leaveInput}
                onChange={(e) => setLeaveInput(e.target.value)}
                className="form-input py-2.5 bg-white shadow-sm"
              />
              <button
                type="button"
                onClick={addLeave}
                className="bg-slate-900 text-white px-5 rounded-xl hover:bg-orange-600 transition-all flex items-center justify-center shrink-0"
              >
                <HiPlus size={20} strokeWidth={2.5} />
              </button>
            </div>

            <div className="flex flex-wrap gap-2 min-h-[40px] items-center">
              {formData.leaves.map((leave, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-white border border-slate-200 pl-3 pr-2 py-1.5 rounded-xl shadow-sm group hover:border-orange-200 transition-colors">
                  <span className="text-[11px] font-black text-slate-600 uppercase tracking-tight">
                    {new Date(leave.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeLeave(idx)}
                    className="text-slate-300 hover:text-rose-500 p-0.5 rounded-md hover:bg-rose-50 transition-all"
                  >
                    <HiOutlineTrash size={14} />
                  </button>
                </div>
              ))}
              {formData.leaves.length === 0 && (
                <p className="text-[10px] font-bold italic text-slate-400 uppercase tracking-widest ml-1">No blackouts scheduled</p>
              )}
            </div>
          </div>
        )}

        <div className="pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputGroup label="Joining Date">
            <HiOutlineCalendarDays className="input-icon" />
            <input required type="date" name="joinedDate" value={formData.joinedDate} onChange={handleChange} className="form-input" />
          </InputGroup>
          <InputGroup label="Daily Hour Limit">
            <HiOutlineClock className="input-icon" />
            <input required name="dailyWorkLimit" value={formData.dailyWorkLimit} onChange={handleChange} className="form-input" />
          </InputGroup>
        </div>

        <InputGroup label="Efficiency Rating (%)">
          <HiOutlineChartBar className="input-icon" />
          <input required name="efficiency" value={formData.efficiency} onChange={handleChange} className="form-input" />
        </InputGroup>

        <button
          disabled={isCreating || isUpdating}
          type="submit"
          className="w-full bg-slate-900 hover:bg-orange-600 text-white py-4 rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-200"
        >
          {(isCreating || isUpdating) ? <CgSpinner className="animate-spin" size={20} /> : (isEditing ? "Update Personnel" : "Authorize Onboarding")}
        </button>
      </form>
    </CommonModal>
  );
}
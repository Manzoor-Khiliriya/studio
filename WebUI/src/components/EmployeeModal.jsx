import { useState, useEffect } from "react";
import {
  HiOutlineUser, HiOutlineBriefcase, HiOutlineLockClosed,
  HiOutlineChartBar, HiOutlineEye, HiOutlineEyeSlash,
  HiOutlineClock, HiOutlineCalendarDays,
  HiOutlinePhone, // New Icon
  HiOutlineCake, // New Icon for DOB
  HiOutlineIdentification
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
    name: "", employee_code: "", email: "", password: "", designation: "",
    efficiency: "100", joinedDate: getToday(), dailyWorkLimit: "9",
    mobileNumber: "",
    dateOfBirth: ""  
  });

  useEffect(() => {
    setShowPassword(false);
    if (editData && isOpen) {
      const rawDob = editData.dateOfBirth || editData.employee?.dateOfBirth;
      const rawJoined = editData.joinedDate || editData.employee?.joinedDate;

      setFormData({
        name: editData.user?.name || editData.name || "",
        employee_code: editData?.employee_code || "",
        email: editData.user?.email || editData.email || "",
        designation: editData.designation || editData.employee?.designation || "",
        efficiency: String(editData.efficiency ?? editData.employee?.efficiency ?? 100),
        dailyWorkLimit: String(editData.dailyWorkLimit ?? editData.employee?.dailyWorkLimit ?? 9),
        joinedDate: rawJoined ? new Date(rawJoined).toISOString().split('T')[0] : "",
        mobileNumber: editData.mobileNumber || editData.employee?.mobileNumber || "",
        dateOfBirth: rawDob ? new Date(rawDob).toISOString().split('T')[0] : ""
      });
    } else if (isOpen) {
      setFormData({
        name: "", email: "", password: "", designation: "",
        efficiency: "100", joinedDate: getToday(), dailyWorkLimit: "9",
        mobileNumber: "", dateOfBirth: ""
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InputGroup label="Full Name">
            <HiOutlineUser className="input-icon" />
            <input required name="name" value={formData.name} onChange={handleChange} className="form-input" placeholder="e.g. John Doe" />
          </InputGroup>
          <InputGroup label="Employee Code">
            <HiOutlineIdentification className="input-icon" />
            <input required name="employee_code" value={formData.employee_code} onChange={handleChange} className="form-input" placeholder="e.g. EMP001" />
          </InputGroup>
          <InputGroup label="Job Title">
            <HiOutlineBriefcase className="input-icon" />
            <input required name="designation" value={formData.designation} onChange={handleChange} className="form-input" placeholder="e.g. Lead Developer" />
          </InputGroup>
        </div>

        {/* ROW 2: EMAIL & MOBILE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputGroup label="Work Email">
            <HiOutlineMail className="input-icon" />
            <input required type="email" name="email" value={formData.email} onChange={handleChange} className="form-input" placeholder="john@company.com" />
          </InputGroup>
          <InputGroup label="Mobile Number">
            <HiOutlinePhone className="input-icon" />
            <input name="mobileNumber" value={formData.mobileNumber} onChange={handleChange} className="form-input" placeholder="+1 234 567 890" />
          </InputGroup>
        </div>

        {/* PASSWORD FIELD (Only for Create) */}
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

        {/* ROW 3: DATE OF BIRTH & ONBOARDING DATE */}
        <div className="pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputGroup label="Date of Birth">
            <HiOutlineCake className="input-icon" />
            <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className="form-input" />
          </InputGroup>
          <InputGroup label="Onboarding Date">
            <HiOutlineCalendarDays className="input-icon" />
            <input required type="date" name="joinedDate" value={formData.joinedDate} onChange={handleChange} className="form-input" />
          </InputGroup>
        </div>

        {/* ROW 4: WORK LIMIT & EFFICIENCY */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputGroup label="Daily Ops Limit (Hrs)">
            <HiOutlineClock className="input-icon" />
            <input required name="dailyWorkLimit" value={formData.dailyWorkLimit} onChange={handleChange} className="form-input" placeholder="9" />
          </InputGroup>
          <InputGroup label="Personnel Efficiency (%)">
            <HiOutlineChartBar className="input-icon" />
            <input required name="efficiency" value={formData.efficiency} onChange={handleChange} className="form-input" placeholder="100" />
          </InputGroup>
        </div>

        <button
          disabled={isCreating || isUpdating}
          type="submit"
          className="w-full bg-slate-900 hover:bg-orange-600 text-white py-4 rounded-xl font-black text-sm uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-200 cursor-pointer"
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
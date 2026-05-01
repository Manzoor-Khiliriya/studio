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
    name: "", employeeCode: "", email: "", password: "", designation: "",
    proficiency: "100", joinedDate: getToday(), dailyWorkLimit: "9",
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
        employeeCode: editData?.employeeCode || "",
        email: editData.user?.email || editData.email || "",
        designation: editData.designation || editData.employee?.designation || "",
        proficiency: String(editData.proficiency ?? editData.employee?.proficiency ?? 100),
        dailyWorkLimit: String(editData.dailyWorkLimit ?? editData.employee?.dailyWorkLimit ?? 9),
        joinedDate: rawJoined ? new Date(rawJoined).toISOString().split('T')[0] : "",
        mobileNumber: editData.mobileNumber || editData.employee?.mobileNumber || "",
        dateOfBirth: rawDob ? new Date(rawDob).toISOString().split('T')[0] : ""
      });
    } else if (isOpen) {
      setFormData({
        name: "", email: "", password: "", designation: "",
        proficiency: "100", joinedDate: getToday(), dailyWorkLimit: "9",
        mobileNumber: "", dateOfBirth: ""
      });
    }
  }, [editData, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let finalValue = (name === "proficiency" || name === "dailyWorkLimit")
      ? value.replace(/\D/g, "")
      : value;
    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleSubmit = async () => {
    const loadingToast = toast.loading(isEditing ? "Updating profile..." : "Onboarding talent...");
    try {
      const payload = {
        ...formData,
        proficiency: Number(formData.proficiency),
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
      title={isEditing ? "Update Employee" : "Create New Employee"}
      maxWidth="max-w-xl"
      onSubmit={handleSubmit}
      isLoading={isCreating || isUpdating}
      submitText={isEditing ? "Update" : "Create"}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
        }}
        className="space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputGroup label="Full Name">
            <HiOutlineUser className="input-icon" />
            <input required name="name" value={formData.name} onChange={handleChange} className="form-input capitalize" placeholder="Enter Full Name" />
          </InputGroup>
          <InputGroup label="Employee Code">
            <HiOutlineIdentification className="input-icon" />
            <input required name="employeeCode" value={formData.employeeCode} onChange={handleChange} className="form-input" placeholder="Enter Employee Code" />
          </InputGroup>
        </div>

        {/* ROW 2: EMAIL & MOBILE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputGroup label="Job Title">
            <HiOutlineBriefcase className="input-icon" />
            <input required name="designation" value={formData.designation} onChange={handleChange} className="form-input" placeholder="Enter Job Title" />
          </InputGroup>
          <InputGroup label="Mobile Number">
            <HiOutlinePhone className="input-icon" />
            <input name="mobileNumber" value={formData.mobileNumber} onChange={handleChange} className="form-input" placeholder="+1 234 567 890" />
          </InputGroup>
        </div>

        <div className={isEditing ? "w-full" : "grid grid-cols-1 md:grid-cols-2 gap-4"}>
          <InputGroup label="Work Email">
            <HiOutlineMail className="input-icon" />
            <input required type="email" name="email" value={formData.email} onChange={handleChange} className="form-input" placeholder="john@company.com" />
          </InputGroup>
          {!isEditing && (
            <InputGroup label="Password">
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
                className="absolute cursor-pointer right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <HiOutlineEyeSlash size={18} /> : <HiOutlineEye size={18} />}
              </button>
            </InputGroup>
          )}

        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputGroup label="Date of Birth">
            <HiOutlineCake className="input-icon" />
            <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className="form-input" />
          </InputGroup>
          <InputGroup label="Onboarding Date">
            <HiOutlineCalendarDays className="input-icon" />
            <input required type="date" name="joinedDate" value={formData.joinedDate} onChange={handleChange} className="form-input" />
          </InputGroup>
        </div>

        {/* ROW 4: WORK LIMIT & proficiency */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputGroup label="Daily Work Limit (Hrs)">
            <HiOutlineClock className="input-icon" />
            <input required name="dailyWorkLimit" value={formData.dailyWorkLimit} onChange={handleChange} className="form-input" placeholder="Enter Daily Work Limit" />
          </InputGroup>
          <InputGroup label="Proficiency (%)">
            <HiOutlineChartBar className="input-icon" />
            <input required name="proficiency" value={formData.proficiency} onChange={handleChange} className="form-input" placeholder="Enter Proficiency" />
          </InputGroup>
        </div>
      </form>
    </CommonModal>
  );
}
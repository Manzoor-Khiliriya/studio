import { useState, useEffect } from "react";
import {
  HiOutlineUser, HiOutlineBriefcase, HiOutlineLockClosed,
  HiOutlineChartBar, HiOutlineEye, HiOutlineEyeSlash,
  HiOutlineClock, HiOutlineCalendarDays,
  HiOutlinePhone,
  HiOutlineCake,
  HiOutlineIdentification
} from "react-icons/hi2";
import { CgSpinner } from "react-icons/cg";
import { toast } from "react-hot-toast";
import CommonModal, { InputGroup } from "./CommonModal";
import { useCreateUserMutation, useUpdateUserMutation } from "../services/userApi";
import { HiOutlineMail } from "react-icons/hi";
import CustomDropdown from "./CustomDropdown";
import { useGetDepartmentsQuery, useGetDesignationsQuery } from "../services/settingsApi";

export default function EmployeeModal({ isOpen, onClose, editData = null, role = "Employee" }) {
  const isEditing = !!editData;
  const [showPassword, setShowPassword] = useState(false);
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const { data: departments = [] } =
    useGetDepartmentsQuery();

  const { data: designations = [] } =
    useGetDesignationsQuery();

  const activeDepartments = departments.filter(
    (dept) => dept.status === "Enable"
  );

  const activeDesignations = designations.filter(
    (designation) => designation.status === "Enable"
  );

  const getToday = () => new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState({
    name: "", employeeCode: "", role,
    email: "", password: "", designation: "", departments: [],
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
        role: editData.user?.role || role,
        email: editData.user?.email || editData.email || "",
        designation: editData?.user?.designation?._id || "",
        departments:
          editData.departments?.map((d) => d._id) || [],
        proficiency: String(editData.proficiency ?? editData.employee?.proficiency ?? 100),
        dailyWorkLimit: String(editData.dailyWorkLimit ?? editData.employee?.dailyWorkLimit ?? 9),
        joinedDate: rawJoined ? new Date(rawJoined).toISOString().split('T')[0] : "",
        mobileNumber: editData.mobileNumber || editData.employee?.mobileNumber || "",
        dateOfBirth: rawDob ? new Date(rawDob).toISOString().split('T')[0] : ""
      });
    } else if (isOpen) {
      setFormData({
        name: "", employeeCode: "", role,
        email: "", password: "", designation: "", departments: [],
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
    if (!formData.designation) {
      return toast.error("Please select a designation");
    }

    if (
      ["Employee", "HR"].includes(role) &&
      !formData.departments.length
    ) {
      return toast.error("Please select a department");
    }

    if (
      role === "Manager" &&
      !formData.departments.length
    ) {
      return toast.error("Please select at least one department");
    }

    try {
      const payload =
        role === "Admin"
          ? {
            name: formData.name,
            role: formData.role,
            email: formData.email.toLowerCase(),
            password: formData.password,
            designation: formData.designation,
            mobileNumber: formData.mobileNumber,
            dateOfBirth: formData.dateOfBirth,
            proficiency: 100,
          }
          : {
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

      toast.success(
        isEditing
          ? `${role} updated`
          : `${role} created successfully`
      );
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || "Operation failed");
    }
  };

  return (
    <CommonModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isEditing
          ? `Update ${role}`
          : `Create New ${role}`
      }
      maxWidth="max-w-2xl"
      onSubmit={handleSubmit}
      isLoading={isCreating || isUpdating}
      submitText={isEditing ? "Update" : "Create"}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
        }}
        className="space-y-4"
      >
        <div className={`grid grid-cols-1 gap-4 md:grid-cols-2`}>
          <InputGroup label="Full Name *">
            <HiOutlineUser className="input-icon" />
            <input required name="name" value={formData.name} onChange={handleChange} className="form-input" placeholder="Enter Full Name" />
          </InputGroup>
          {role !== "Admin" && (
            <InputGroup label="Employee Code *">
              <HiOutlineIdentification className="input-icon" />
              <input required name="employeeCode" value={formData.employeeCode} onChange={handleChange} className="form-input" placeholder="Enter Employee Code" />
            </InputGroup>
          )}
          {role === "Admin" && (
            <InputGroup label="Date of Birth">
              <HiOutlineCake className="input-icon" />
              <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className="form-input" />
            </InputGroup>
          )}
        </div>

        {/* ROW 2: EMAIL & MOBILE */}
        <div className={`grid grid-cols-1 gap-4 ${role !== "Admin" ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
          <InputGroup label="Designation *">
            <HiOutlineBriefcase className="input-icon" />
            <CustomDropdown
              value={formData.designation}
              onChange={(val) =>
                setFormData({
                  ...formData,
                  designation: val,
                })
              }
              searchable
              options={activeDesignations.map((d) => ({
                label: d.name,
                value: d._id,
              }))}
              className="w-full"
              buttonClass="form-input text-xs font-bold pl-10"
              placeholder="Select Designation"
            />
          </InputGroup>
          {["Employee", "HR"].includes(role) && (
            <InputGroup label="Department *">
              <HiOutlineBriefcase className="input-icon" />

              <CustomDropdown
                value={formData.departments[0] || ""}
                onChange={(val) =>
                  setFormData({
                    ...formData,
                    departments: [val],
                  })
                }
                searchable
                options={activeDepartments.map((d) => ({
                  label: d.name,
                  value: d._id,
                }))}
                className="w-full"
                buttonClass="form-input text-xs font-bold pl-10"
                placeholder="Select Department"
              />
            </InputGroup>
          )}

          {role === "Manager" && (
            <InputGroup label="Departments *">
              <HiOutlineBriefcase className="input-icon" />

              <CustomDropdown
                multiSelect
                searchable
                value={formData.departments}
                onChange={(val) =>
                  setFormData({
                    ...formData,
                    departments: val,
                  })
                }
                options={activeDepartments.map((d) => ({
                  label: d.name,
                  value: d._id,
                }))}
                className="w-full"
                buttonClass="form-input text-xs font-bold pl-10"
                placeholder="Select Departments"
              />
            </InputGroup>
          )}

          <InputGroup label="Mobile Number">
            <HiOutlinePhone className="input-icon" />
            <input name="mobileNumber" value={formData.mobileNumber} onChange={handleChange} className="form-input" placeholder="+1 234 567 890" />
          </InputGroup>
        </div>

        <div className={isEditing ? "w-full" : "grid grid-cols-1 md:grid-cols-2 gap-4"}>
          <InputGroup label="Work Email *">
            <HiOutlineMail className="input-icon" />
            <input required type="email" name="email" value={formData.email} onChange={handleChange} className="form-input" placeholder="john@company.com" />
          </InputGroup>
          {!isEditing && (
            <InputGroup label="Password *">
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

        {role !== "Admin" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputGroup label="Date of Birth">
              <HiOutlineCake className="input-icon" />
              <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className="form-input" />
            </InputGroup>
            <InputGroup label="Onboarding Date *">
              <HiOutlineCalendarDays className="input-icon" />
              <input required type="date" name="joinedDate" value={formData.joinedDate} onChange={handleChange} className="form-input" />
            </InputGroup>
          </div>
        )}

        {/* ROW 4: WORK LIMIT & proficiency */}
        {["Employee", "Manager"].includes(role) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputGroup label="Daily Work Limit (Hrs) *">
              <HiOutlineClock className="input-icon" />
              <input required name="dailyWorkLimit" value={formData.dailyWorkLimit} onChange={handleChange} className="form-input" placeholder="Enter Daily Work Limit" />
            </InputGroup>
            <InputGroup label="Proficiency (%) *">
              <HiOutlineChartBar className="input-icon" />
              <input required name="proficiency" value={formData.proficiency} onChange={handleChange} className="form-input" placeholder="Enter Proficiency" />
            </InputGroup>
          </div>
        )}
      </form>
    </CommonModal>
  );
}
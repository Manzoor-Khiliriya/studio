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
import { useCreateUserMutation, useGetDepartmentOptionsQuery, useUpdateUserMutation } from "../services/userApi";
import { HiOutlineMail } from "react-icons/hi";
import CustomDropdown from "./CustomDropdown";
import { useGetDepartmentsQuery, useGetDesignationsQuery } from "../services/settingsApi";
import { useSelector } from "react-redux";

export default function EmployeeModal({ isOpen, onClose, editData = null, role = "Employee" }) {
  const { user } = useSelector((state) => state.auth);
  const getToday = () => new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState({
    name: "", employeeCode: "", role,
    email: "", password: "", designation: "", departments: [],
    proficiency: "100", joinedDate: getToday(), dailyWorkLimit: "9",
    mobileNumber: "",
    dateOfBirth: "", manager: "",
    admin: [], hrManager: ""
  });

  const isEditing = !!editData;
  const [showPassword, setShowPassword] = useState(false);
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const { data: departments = [] } =
    useGetDepartmentsQuery(undefined, {
      skip: !isOpen,
    });

  const { data: designations = [] } =
    useGetDesignationsQuery(undefined, {
      skip: !isOpen,
    });

  const {
    data: departmentUsers = {
      managers: [],
      admins: [],
      hrManagers: []
    },
  } = useGetDepartmentOptionsQuery(
    formData.departments.length ? formData.departments : null,
    {
      skip: !isOpen || (
        ["Employee", "Hr Employee", "GAD Employee"].includes(formData.role)
        && !formData.departments.length
      ),
    }
  );

  const isEmployeeRole = ["Employee", "Hr Employee", "GAD Employee"].includes(formData.role);
  const managers = (isEmployeeRole && !formData.departments.length)
    ? []
    : (departmentUsers.managers || []);
  const admins = (isEmployeeRole && !formData.departments.length)
    ? []
    : (departmentUsers.admins || []);
  const hrManagers = (departmentUsers.hrManagers || []).filter((hr) => {
    return !(
      editData?.user?._id === hr._id &&
      formData.role !== "Hr Manager"
    );
  });

  const activeDepartments = departments.filter(
    (dept) => dept.status === "Enable"
  );

  const activeDesignations = designations.filter(
    (designation) => designation.status === "Enable"
  );


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
        dateOfBirth: rawDob ? new Date(rawDob).toISOString().split('T')[0] : "",
        manager: editData?.manager?._id || "",
        admin: editData?.admin?.map(a => a._id) || [],
        hrManager: editData?.hrManager?._id || "",
      });
    } else if (isOpen) {
      setFormData({
        name: "", employeeCode: "", role,
        email: "", password: "", designation: "", departments: [],
        proficiency: "100", joinedDate: getToday(), dailyWorkLimit: "9",
        mobileNumber: "", dateOfBirth: "", manager: "",
        admin: [], hrManager: ""
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

    if (["Employee", "Hr Employee", "GAD Employee"].includes(formData.role) && !formData.departments.length) {
      return toast.error("Please select at least one department");
    }

    if (
      formData.role !== "Admin" &&
      !formData.admin.length
    ) {
      return toast.error("Please select at least one admin");
    }

    if (
      !["Admin", "Hr Manager"].includes(formData.role) &&
      !formData.hrManager
    ) {
      return toast.error("Please select a hr manager");
    }

    try {
      const payload =
        formData.role === "Admin"
          ? {
            name: formData.name,
            role: formData.role,
            email: formData.email.toLowerCase(),
            password: formData.password,
            designation: formData.designation,
            departments: formData.departments,
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
          ? `${formData.role} updated`
          : `${formData.role} created successfully`
      );
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || "Operation failed");
    }
  };

  const isOwnAdmin =
    editData?.user?.role === "Admin" &&
    editData?.user?._id === user?._id;

  const isOtherAdmin =
    editData?.user?.role === "Admin" &&
    editData?.user?._id !== user?._id;

  return (
    <CommonModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isEditing
          ? `Update ${formData.role}`
          : `Create New ${formData.role}`
      }
      maxWidth="max-w-3xl"
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
        <div className={`grid grid-cols-1 gap-4 ${isEditing ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
          <InputGroup label="Full Name *">
            <HiOutlineUser className="input-icon" />
            <input required name="name" value={formData.name} onChange={handleChange} disabled={isOtherAdmin} className="form-input disabled:opacity-75 disabled:cursor-not-allowed" placeholder="Enter Full Name" />
          </InputGroup>
          {formData.role !== "Admin" && (
            <InputGroup label="Employee Code *">
              <HiOutlineIdentification className="input-icon" />
              <input required name="employeeCode" value={formData.employeeCode} onChange={handleChange} className="form-input" placeholder="Enter Employee Code" />
            </InputGroup>
          )}

          {isEditing && (
            <InputGroup label="Role *">
              <HiOutlineUser className="input-icon" />

              <CustomDropdown
                value={formData.role}
                onChange={(val) =>
                  setFormData((prev) => ({
                    ...prev,
                    role: val,
                    departments: [],
                    designation: "",
                    manager: "",
                    admin: [],
                    hrManager: "",
                    proficiency: "",
                  }))
                }
                options={[
                  { label: "Employee", value: "Employee" },
                  { label: "Manager", value: "Manager" },
                  { label: "Hr Employee", value: "Hr Employee" },
                  { label: "Hr Manager", value: "Hr Manager" },
                  { label: "GAD Employee", value: "GAD Employee" },
                  { label: "GAD Manager", value: "GAD Manager" },
                  { label: "Admin", value: "Admin" },
                ]}
                className="w-full"
                disabled={editData?.user?.role === "Admin"}
                buttonClass="form-input text-xs font-bold pl-10"
                placeholder="Select Role"
              />
            </InputGroup>
          )}

          {formData.role === "Admin" && (
            <InputGroup label="Date of Birth">
              <HiOutlineCake className="input-icon" />
              <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} disabled={isOtherAdmin} className="form-input disabled:opacity-75 disabled:cursor-not-allowed" />
            </InputGroup>
          )}
        </div>

        {/* ROW 2: EMAIL & MOBILE */}
        <div className={`grid grid-cols-1 gap-4 md:grid-cols-3`}>
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

          <InputGroup label={["Employee", "Hr Employee", "GAD Employee"].includes(formData.role) ? "Departments *" : "Departments"}>
            <HiOutlineBriefcase className="input-icon" />

            <CustomDropdown
              multiSelect
              searchable
              value={formData.departments}
              onChange={(val) =>
                setFormData({
                  ...formData,
                  departments: val,
                  manager: "",
                  admin: [],
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

          <InputGroup label="Mobile Number">
            <HiOutlinePhone className="input-icon" />
            <input name="mobileNumber" value={formData.mobileNumber} onChange={handleChange} disabled={isOtherAdmin} className="form-input disabled:opacity-75 disabled:cursor-not-allowed" placeholder="+1 234 567 890" />
          </InputGroup>
        </div>

        {formData.role !== "Admin" && (
          <div
            className={`grid grid-cols-1 gap-4 ${formData.role === "Hr Manager"
              ? "md:grid-cols-1"
              : ["Manager", "GAD Manager"].includes(formData.role)
                ? "md:grid-cols-2"
                : "md:grid-cols-3"
              }`}
          >
            {["Employee", "Hr Employee", "GAD Employee"].includes(formData.role) && (
              <InputGroup label="Manager">
                <HiOutlineUser className="input-icon" />

                <CustomDropdown
                  value={formData.manager}
                  onChange={(val) =>
                    setFormData({
                      ...formData,
                      manager: val,
                    })
                  }
                  options={managers.map((m) => ({
                    label: m.name,
                    value: m._id,
                  }))}
                  className="w-full"
                  buttonClass="form-input text-xs font-bold pl-10"
                  placeholder="Select Manager"
                />
              </InputGroup>
            )}
            {/* {formData.role !== "GAD Employee" && (
          
          )} */}
            <InputGroup label="Admins *">
              <HiOutlineUser className="input-icon" />

              <CustomDropdown
                multiSelect
                searchable
                value={formData.admin}
                onChange={(val) =>
                  setFormData({
                    ...formData,
                    admin: val,
                  })
                }
                options={admins.map((a) => ({
                  label: a.name,
                  value: a._id,
                }))}
                className="w-full"
                buttonClass="form-input text-xs font-bold pl-10"
                placeholder="Select Admins"
              />
            </InputGroup>

            {formData.role !== "Hr Manager" && (
              <InputGroup label="Hr Manager *">
                <HiOutlineUser className="input-icon" />

                <CustomDropdown
                  value={formData.hrManager}
                  onChange={(val) =>
                    setFormData({
                      ...formData,
                      hrManager: val,
                    })
                  }
                  options={hrManagers.map((m) => ({
                    label: m.name,
                    value: m._id,
                  }))}
                  className="w-full"
                  buttonClass="form-input text-xs font-bold pl-10"
                  placeholder="Select Hr Manager"
                />
              </InputGroup>
            )}
          </div>
        )}

        <div className={isEditing ? "w-full" : "grid grid-cols-1 md:grid-cols-2 gap-4"}>
          <InputGroup label="Work Email *">
            <HiOutlineMail className="input-icon" />
            <input required type="email" name="email" value={formData.email} onChange={handleChange} disabled={isOtherAdmin} className="form-input disabled:opacity-75 disabled:cursor-not-allowed" placeholder="john@company.com" />
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

        {formData.role !== "Admin" && (
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
        {["Employee", "Manager"].includes(formData.role) && (
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
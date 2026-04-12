import React, { useState } from "react";
import { HiOutlineCalendarDays, HiOutlineShieldCheck, HiOutlineIdentification, HiOutlineEnvelope, HiOutlineEyeSlash, HiOutlineEye } from "react-icons/hi2";
import { FiEdit, FiTrash2 } from "react-icons/fi";

const PasswordCell = ({ emp }) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between bg-slate-50 px-2 rounded border border-slate-100 group/pass w-32">
        <span className="font-mono text-[11px] font-bold text-slate-600 truncate">
          {showPassword ? (emp.user?.plainPassword || "********") : "••••••••"}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowPassword(!showPassword);
          }}
          className="text-slate-400 hover:text-orange-500 transition-colors cursor-pointer"
        >
          {showPassword ? <HiOutlineEyeSlash size={14} /> : <HiOutlineEye size={14} />}
        </button>
      </div>
    </div>
  );
};

export const getEmployeeColumns = ({ onEdit, onDelete, onToggle }) => [
  {
    header: "Employee",
    render: (emp) => (
      <div className="flex items-start gap-3">
        <div className="relative">
          <div className="w-6 h-6 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-[10px] shadow-md group-hover:bg-orange-600 transition-all duration-300">
            {emp.user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${emp.user?.status === "Enable" ? "bg-emerald-500" : "bg-rose-500"}`} />
        </div>
        <p className="font-bold text-slate-800 text-[12px] uppercase tracking-tight">
          {emp.user?.name || "Unknown"}
        </p>
      </div>
    )
  },
  {
    header: "Employee Code",
    render: (emp) => (
      <p className="text-[11px] font-black text-slate-600 tracking-wider">
        {emp?.employeeCode?.toUpperCase() || "N/A"}
      </p>
    )
  },
  {
    header: "Designation",
    render: (emp) => (
      <div className="flex items-center gap-2">
        <HiOutlineIdentification size={14} className="text-orange-500" />
        <span className="text-[10px] font-bold text-slate-500 capitalize tracking-widest">
          {emp.designation || "Field Staff"}
        </span>
      </div>
    )
  },
  {
    header: "Email Address",
    render: (emp) => (
      <div className="flex items-center gap-2 group cursor-pointer">
        <HiOutlineEnvelope size={14} />
        <span className="text-[11px] font-bold text-slate-500 lowercase">
          {emp.user?.email}
        </span>
      </div>
    )
  },
  {
    header: "Password",
    render: (emp) => <PasswordCell emp={emp} />
  },
  {
    header: "Joining Date",
    render: (emp) => (
      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
        <HiOutlineCalendarDays size={15} className="text-slate-400" />
        <span>{emp.joinedDate ? new Date(emp.joinedDate).toLocaleDateString('en-IN') : "---"}</span>
      </div>
    )
  },
  {
    header: "Proficiency",
    className: "text-center",
    render: (emp) => {
      const score = emp.proficiency || "";
      return (
        <p className={`text-xs text-center font-black ${score > 80 ? 'text-emerald-600' : 'text-orange-500'}`}>
          {score}%
        </p>
      );
    }
  },
  {
    header: "Status",
    render: (emp) => {
      const isActive = emp.user?.status === "Enable";
      return (
        <span className={`block items-center gap-1.5 text-[9px] font-black uppercase tracking-tighter  ${isActive ? " text-emerald-700" : "text-rose-700 "
          }`}>
          <span className={`w-1 h-1 rounded-full ${isActive ? "bg-emerald-600" : "bg-rose-600"}`} />
          {isActive ? "Active" : "Disabled"}
        </span>
      );
    }
  },
  {
    header: "Actions",
    className: "",
    render: (emp) => (
      <div className="flex items-center gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(emp); }}
          className={`rounded-lg transition-all duration-200 active:scale-90 cursor-pointer ${emp.user?.status === "Enable"
            ? "text-emerald-500 hover:text-rose-600"
            : "text-rose-500 hover:text-emerald-600"
            }`}
          title={emp.user?.status === "Enable" ? "Disable Access" : "Grant Access"}
        >
          <HiOutlineShieldCheck size={18} strokeWidth={2} />
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); onEdit(emp); }}
          className="text-yellow-500 hover:text-yellow-600 rounded-lg transition-all duration-200 active:scale-90 cursor-pointer"
          title="Edit Employee"
        >
          <FiEdit size={18} />
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); onDelete(emp); }}
          className="text-rose-500 hover:text-rose-700 rounded-lg transition-all duration-200 active:scale-90 cursor-pointer"
          title="Delete Employee"
        >
          <FiTrash2 size={18} />
        </button>
      </div>
    )
  }
];
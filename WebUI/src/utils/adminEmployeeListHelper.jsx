import React from "react";
import { HiOutlineCalendarDays, HiOutlineShieldCheck, HiOutlineIdentification, HiOutlineEnvelope } from "react-icons/hi2";
import { FiEdit, FiTrash2 } from "react-icons/fi";

export const getEmployeeColumns = ({ onEdit, onDelete, onToggle }) => [
  {
    header: "Employee",
    render: (emp) => (
      <div className="flex items-center gap-3 py-1">
        <div className="relative">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-md group-hover:bg-orange-600 transition-all duration-300">
            {emp.user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${emp.user?.status === "Enable" ? "bg-emerald-500" : "bg-rose-500"}`} />
        </div>
        <p className="font-bold text-slate-800 text-sm uppercase tracking-tight">
          {emp.user?.name || "Unknown"}
        </p>
      </div>
    )
  },
  {
    header: "Employee Code",
    render: (emp) => (
      <span className="font-mono text-[11px] font-black bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200 tracking-wider">
        {emp?.employee_code?.toUpperCase() || "N/A"}
      </span>
    )
  },
  {
    header: "Designation",
    render: (emp) => (
      <div className="flex items-center gap-1.5">
        <HiOutlineIdentification size={14} className="text-orange-500" />
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          {emp.designation || "Field Staff"}
        </span>
      </div>
    )
  },
  {
    header: "Email Address",
    render: (emp) => (
      <div className="flex items-center gap-2 group cursor-pointer">
        <div className="p-1.5 rounded-md bg-blue-50 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
          <HiOutlineEnvelope size={12} />
        </div>
        <span className="text-[12px] font-medium text-slate-500 lowercase">
          {emp.user?.email}
        </span>
      </div>
    )
  },
  {
    header: "Joining Date",
    render: (emp) => (
      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
        <HiOutlineCalendarDays size={15} className="text-slate-400" />
        <span>{emp.joinedDate ? new Date(emp.joinedDate).toLocaleDateString('en-GB') : "---"}</span>
      </div>
    )
  },
  {
    header: "Efficiency",
    className: "text-center",
    render: (emp) => {
      const score = emp.efficiency || 100;
      return (
        <div className="flex flex-col items-center gap-1">
          <span className={`text-xs font-black ${score > 80 ? 'text-emerald-600' : 'text-orange-500'}`}>
            {score}%
          </span>
          <div className="w-10 h-1 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full ${score > 80 ? 'bg-emerald-500' : 'bg-orange-500'}`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
      );
    }
  },
  {
    header: "Status",
    render: (emp) => {
      const isActive = emp.user?.status === "Enable";
      return (
        <span className={`inline-flex items-center gap-1.5 text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-tighter border ${isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"
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
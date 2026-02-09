import React from "react";
import { HiOutlineCalendarDays, HiOutlineShieldCheck, HiOutlineIdentification } from "react-icons/hi2";
import { FiEdit, FiTrash2 } from "react-icons/fi";

export const getEmployeeColumns = ({ onEdit, onDelete, onToggle }) => [
  {
    header: "Agent",
    render: (emp) => (
      <div className="flex items-center gap-4 py-1">
        <div className="h-11 w-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 font-black text-lg italic shadow-sm">
          {emp.user?.name?.charAt(0)?.toUpperCase() || "U"}
        </div>
        <div>
          <p className="font-black text-slate-900 text-sm uppercase tracking-tight leading-tight">
            {emp.user?.name || "Unknown"}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <HiOutlineIdentification size={12} className="text-orange-500" />
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              {emp.designation || "Field Staff"}
            </p>
          </div>
        </div>
      </div>
    )
  },
  {
    header: "Contact Protocol",
    render: (emp) => (
      <span className="font-black text-[10px] text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 lowercase tracking-tight">
        {emp.user.email}
      </span>
    )
  },
  {
    header: "Onboarding",
    render: (emp) => (
      <div className="flex items-center gap-2 text-[9px] font-black text-slate-500 uppercase">
        <HiOutlineCalendarDays size={16} className="text-slate-300" />
        <span>{emp.joinedDate ? new Date(emp.joinedDate).toLocaleDateString() : "N/A"}</span>
      </div>
    )
  },
  {
    header: "Efficiency",
    className: "text-center",
    cellClassName: "text-center",
    render: (emp) => (
      <div className="flex flex-col items-center">
        <span className={`text-lg font-black leading-none ${emp.efficiency > 80 ? 'text-emerald-600' : 'text-orange-500'}`}>
          {emp.efficiency || 100}%
        </span>
        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Performance</span>
      </div>
    )
  },
  {
    header: "Status",
    className: "text-center",
    cellClassName: "text-center",
    render: (emp) => {
      const isActive = emp.user?.status === "Enable";
      return (
        <span className={`inline-block text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border shadow-sm transition-colors ${
          isActive ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
        }`}>
          {isActive ? "Authorized" : "Revoked"}
        </span>
      );
    }
  },
  {
    header: "Operations",
    className: "text-right",
    cellClassName: "text-right",
    render: (emp) => (
      <div className="flex justify-end gap-3 pr-4">
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(emp); }}
          className={`transition-all active:scale-90 cursor-pointer ${emp.user?.status === "Enable" ? "text-slate-300 hover:text-rose-500" : "text-emerald-500 hover:text-emerald-600"}`}
          title="Toggle Access"
        >
          <HiOutlineShieldCheck size={20} strokeWidth={2} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(emp); }}
          className="text-yellow-500 hover:text-yellow-600 transition-all active:scale-90 cursor-pointer"
        >
          <FiEdit size={18} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(emp); }}
          className="text-rose-500 hover:text-rose-700 transition-all active:scale-90 cursor-pointer"
        >
          <FiTrash2 size={18} />
        </button>
      </div>
    )
  }
];
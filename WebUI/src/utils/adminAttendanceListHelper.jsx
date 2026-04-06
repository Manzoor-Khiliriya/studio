import React from "react";
import { HiOutlineLogin, HiOutlineLogout, HiOutlineClock, HiOutlineUser } from "react-icons/hi";

export const getAdminAttendanceColumns = () => [
  {
    header: "Employee Profile",
    className: "text-left pl-6",
    render: (row) => (
      <div className="flex items-center gap-3 py-1">
        <div className="w-8 h-8 rounded-lg bg-slate-900 text-orange-500 flex items-center justify-center font-black text-[10px] shadow-sm uppercase italic">
          {row.user?.name?.charAt(0) || "U"}
        </div>
        <div className="flex flex-col">
          <p className="font-black text-slate-800 text-[11px] uppercase tracking-tight">
            {row.user?.name || "Unknown User"}
          </p>
          <p className="text-[9px] text-slate-400 font-bold uppercase italic">
            {new Date(row.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
        </div>
      </div>
    )
  },
  {
    header: "Clocked Date",
    className: "text-left",
    render: (row) => (
      <div className="flex items-center gap-3 py-1">
          <p className="text-[11px] text-slate-800 font-bold uppercase italic">
            {new Date(row.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
        </div>
    )
  },
  {
    header: "Clock In",
    className: "text-center",
    cellClassName: "text-center",
    render: (row) => (
      <div className="inline-flex items-center gap-1.5 text-emerald-600 font-black text-[10px] uppercase tracking-tighter">
        <HiOutlineLogin size={12} />
        {row.clockIn ? new Date(row.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "---"}
      </div>
    )
  },
  {
    header: "Clock Out",
    className: "text-center",
    cellClassName: "text-center",
    render: (row) => (
      <div className={`inline-flex items-center gap-1.5 font-black text-[10px] px-2 py-1 rounded border uppercase tracking-tighter ${row.clockOut
        ? "text-rose-600 bg-rose-50 border-rose-100"
        : "text-blue-600 bg-blue-50 border-blue-100 animate-pulse"
        }`}>
        <HiOutlineLogout size={12} />
        {row.clockOut ? new Date(row.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "ON-SHIFT"}
      </div>
    )
  },
  {
    header: "Total Clocked Time",
    className: "text-right pr-6",
    cellClassName: "text-right pr-6",
    render: (row) => {
      const totalSecs = row.totalSecondsWorked || 0;
      const h = Math.floor(totalSecs / 3600);
      const m = Math.floor((totalSecs % 3600) / 60);
      const s = totalSecs % 60;

      return (
        <div className="flex items-center justify-end gap-2 font-black text-slate-800 text-[10px] tabular-nums">
          <HiOutlineClock className="text-slate-600" size={14} />
          <span className="bg-slate-50 border border-slate-100 px-2 py-1 rounded shadow-sm">
            {h > 0 && <span>{h}h </span>}
            {m > 0 || h > 0 ? <span>{m}m </span> : null}
            <span className="text-slate-800 font-black">{s}s</span>
          </span>
        </div>
      );
    }
  }
];
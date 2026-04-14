import React from "react";
import { HiOutlineLogin, HiOutlineLogout, HiOutlineClock } from "react-icons/hi";

export const getAdminAttendanceColumns = () => [
  {
    header: "Employee Profile",
    className: "text-left pl-6",
    render: (row) => (
      <div className="flex items-center gap-3 py-1">
        <div className="flex flex-col">
          <p className="font-black text-slate-800 text-[11px] uppercase tracking-tight">
            {row.user?.name || "Unknown User"} {row.user?.employee?.employeeCode ? `(${row.user?.employee?.employeeCode})` : ""}
          </p>
        </div>
      </div>
    )
  },
  {
    header: "Date",
    className: "text-left",
    render: (row) => (
      <div className="flex items-center gap-3 py-1">
          <p className="text-[10px] text-slate-800 font-black uppercase italic">
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
      <div className={`inline-flex items-center gap-1.5 font-black text-[10px]  uppercase tracking-tighter ${row.clockOut
        ? "text-rose-600"
        : "text-blue-600"
        }`}>
        <HiOutlineLogout size={12} />
        {row.clockOut ? new Date(row.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "ON-SHIFT"}
      </div>
    )
  },
  {
    header: "Total Clocked Time",
    render: (row) => {
      const totalSecs = row.totalSecondsWorked || 0;
      const h = Math.floor(totalSecs / 3600);
      const m = Math.floor((totalSecs % 3600) / 60);
      const s = totalSecs % 60;

      return (
        <div className="flex items-center gap-2 font-black text-slate-800 text-[10px] tabular-nums">
          <HiOutlineClock className="text-slate-600" size={12} />
          <>
            {h > 0 && <span>{h} Hrs </span>}
            {m > 0 || h > 0 ? <span>{m} Mins </span> : null}
            <span className="text-slate-800 font-black">{s} Secs</span>
          </>
        </div>
      );
    }
  }
];
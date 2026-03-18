import React from "react";
import {
  HiOutlineCalendar,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineClock
} from "react-icons/hi2";

/**
 * StatusBadge Component for the Registry Status column
 */
export const StatusBadge = ({ status }) => {
  const styles = {
    Pending: "text-orange-600 border-orange-100",
    Approved: "text-emerald-600 border-emerald-100",
    Rejected: "text-rose-600 border-rose-100",
  };

  const label = {
    Pending: "Under Review",
    Approved: "Approved",
    Rejected: "Declined",
  };

  return (
    <span
      className={`px-2 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] inline-flex items-center gap-2 ${styles[status]}`}
    >
      <div className={`w-1.5 h-1.5 rounded-full bg-current`} />
      {label[status]}
    </span>
  );
};

/**
 * Helper to calculate business days on the frontend for display
 */
const calculateBusinessDays = (start, end) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  let count = 0;
  let cur = new Date(startDate);
  while (cur <= endDate) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
};

/**
 * Generates columns for the Admin Leave Table
 */
export const getAdminLeaveColumns = (onAction) => [
  {
    header: "Employee",
    className: "text-left",
    render: (req) => (
      <div className="flex items-center group">
        <p className="font-black text-slate-800 group-hover:text-orange-600 text-[11px] uppercase tracking-tight transition-colors">
          {req.user?.name || "Unknown"}
          <span className="ml-1.5 text-slate-400 font-bold lowercase tracking-normal italic">
            ({req?.user?.employee?.employee_code || "no-code"})
          </span>
        </p>
      </div>
    ),
  },
  {
    header: "Leave Type",
    className: "text-left",
    render: (req) => (
      <div className="flex flex-col">
        <span className="text-[10px] text-slate-700 font-black uppercase tracking-widest inline-block">
          {req.type}
        </span>
      </div>
    ),
  },
  {
    header: "Leave Timeline",
    className: "text-left",
    render: (req) => {
      const days = calculateBusinessDays(req.startDate, req.endDate);
      return (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <HiOutlineCalendar className="text-orange-500" size={13} />
            <p className="text-[10px] text-slate-900 font-black tracking-widest tabular-nums uppercase">
              {new Date(req.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              <span className="text-slate-300 mx-2">—</span>
              {new Date(req.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </p>
          </div>
          {/* WORKING DAYS BADGE */}
          <div className="flex items-center gap-1.5">
             <HiOutlineClock className="text-slate-400" size={11} />
             <span className="text-[9px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full uppercase italic">
               {days} {days === 1 ? 'Working Day' : 'Working Days'}
             </span>
          </div>
        </div>
      );
    },
  },
  {
    header: "Status",
    className: "text-center",
    cellClassName: "text-center",
    render: (req) => <StatusBadge status={req.status} />,
  },
  {
    header: "Actions",
    className: "",
    cellClassName: "",
    render: (req) => (
      <div className="flex items-center gap-2">
        {req.status === "Pending" ? (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAction(req._id, "Approved", req);
              }}
              className="text-emerald-500 hover:text-emerald-600 transition-all active:scale-90 cursor-pointer"
              title="Approve Leave"
            >
              <HiOutlineCheckCircle size={22} strokeWidth={2} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAction(req._id, "Rejected", req);
              }}
              className="text-rose-500 hover:text-rose-600 transition-all active:scale-90 cursor-pointer"
              title="Reject Leave"
            >
              <HiOutlineXCircle size={22} strokeWidth={2} />
            </button>
          </>
        ) : (
          <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic pr-2">
            Processed
          </span>
        )}
      </div>
    ),
  },
];
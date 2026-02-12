import React from "react";
import {
  HiOutlineClock,
  HiOutlineCalendar,
  HiOutlineCheckCircle,
  HiOutlineXCircle
} from "react-icons/hi2";

/**
 * StatusBadge Component for the Registry Status column
 */
export const StatusBadge = ({ status }) => {
  const styles = {
    Pending: "bg-orange-50 text-orange-600 border-orange-100",
    Approved: "bg-emerald-50 text-emerald-600 border-emerald-100",
    Rejected: "bg-rose-50 text-rose-600 border-rose-100",
  };

  const label = {
    Pending: "Under Review",
    Approved: "Approved",
    Rejected: "Declined",
  };

  const dotColors = {
    Pending: "bg-orange-500 animate-pulse",
    Approved: "bg-emerald-500",
    Rejected: "bg-rose-500",
  };

  return (
    <span
      className={`px-6 py-2 rounded-2xl text-[9px] font-black uppercase tracking-[0.25em] border-2 shadow-sm inline-flex items-center gap-2 ${styles[status]}`}
    >
      <div className={`w-1.5 h-1.5 rounded-full ${dotColors[status]}`} />
      {label[status]}
    </span>
  );
};

/**
 * Generates columns for the Admin Leave Table
 * @param {Function} onAction - Callback for handling status updates (processLeave)
 */
export const getAdminLeaveColumns = (onAction) => [
  {
    header: "Employee / Classification",
    render: (req) => (
      <div className="flex items-center gap-4 py-2 group">
        <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-sm shadow-lg group-hover:bg-orange-600 transition-colors duration-300 uppercase">
          {req.user?.name?.charAt(0)}
        </div>
        <div className="flex flex-col">
          <p className="font-black text-slate-900 uppercase text-sm tracking-tight">
            {req.user?.name}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.15em]">
              {req.type}
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    header: "Operational Absence",
    render: (req) => (
      <div className="flex items-center gap-2 mt-1 italic">
        <HiOutlineCalendar className="text-slate-300" size={12} />
        <p className="text-[10px] text-slate-400 font-bold tracking-tighter tabular-nums">
          {new Date(req.startDate).toLocaleDateString()} —{" "}
          {new Date(req.endDate).toLocaleDateString()}
        </p>
      </div>
    ),
  },
  {
    header: "Registry Status",
    className: "text-left",
    render: (req) => <StatusBadge status={req.status} />,
  },
  {
    header: "Command Action",
    className: "text-right pr-10",
    render: (req) => (
      <div className="flex justify-end gap-2">
        {req.status === "Pending" ? (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAction(req._id, "Approved");
              }}
              className="group flex items-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-600 rounded-[1rem] hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100 active:scale-95 cursor-pointer"
            >
              <HiOutlineCheckCircle size={18} />
              <span className="text-[10px] font-black uppercase">Approve</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAction(req._id, "Rejected");
              }}
              className="group flex items-center gap-2 px-5 py-2.5 bg-rose-50 text-rose-600 rounded-[1rem] hover:bg-rose-600 hover:text-white transition-all border border-rose-100 active:scale-95 cursor-pointer"
            >
              <HiOutlineXCircle size={18} />
              <span className="text-[10px] font-black uppercase">Decline</span>
            </button>
          </>
        ) : (
          <div className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-100 opacity-60">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              Closed Log
            </span>
          </div>
        )}
      </div>
    ),
  },
];
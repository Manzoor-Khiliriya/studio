import React from "react";
import {
  HiOutlineCalendar,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineClock,
  HiOutlinePencilSquare,
  HiOutlineTrash
} from "react-icons/hi2";

/**
 * StatusBadge Component
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
    <span className={`px-2 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] inline-flex items-center gap-2 ${styles[status]}`}>
      <div className={`w-1.5 h-1.5 rounded-full bg-current`} />
      {label[status]}
    </span>
  );
};

const renderQuotaCell = (balance, colorClass = "text-slate-900", isAccrual = false) => {
  if (!balance) return <span className="text-[10px] text-slate-300 italic">N/A</span>;
  return (
    <div className="flex flex-col gap-1 min-w-[80px]">
      <div className="flex items-center justify-between border-b border-slate-50 pb-0.5">
        <span className="text-[8px] font-black text-slate-400 uppercase">Rem</span>
        <span className={`text-xs font-black ${colorClass}`}>{balance.remaining}d</span>
      </div>
      <div className="flex flex-col text-[8px] font-bold text-slate-500 uppercase">
        <span>Used: {balance.taken}d</span>
        <span>Total: {isAccrual ? balance.earned : balance.quota}d</span>
      </div>
    </div>
  );
};

/**
 * MAIN REQUESTS COLUMNS
 */
export const getAdminLeaveColumns = (onAction, onEdit, onDelete) => [
  {
    header: "Employee",
    render: (req) => (
      <div className="flex flex-col">
        <p className="font-black text-slate-800 text-[11px] uppercase tracking-tight">
          {req.user?.name || "Unknown"}
        </p>
        <span className="text-[9px] text-slate-400 font-bold lowercase italic">
          {req?.user?.employee?.employeeCode || "no-code"}
        </span>
      </div>
    ),
  },
  {
    header: "Type",
    render: (req) => (
      <span className="text-[10px] text-slate-700 font-black uppercase tracking-widest">
        {req.type}
      </span>
    ),
  },
  {
    header: "Timeline",
    render: (req) => (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <HiOutlineCalendar className="text-orange-500" size={13} />
          <p className="text-[10px] text-slate-900 font-black tracking-widest tabular-nums uppercase">
            {new Date(req.startDate).toLocaleDateString('en-IN')} — {new Date(req.endDate).toLocaleDateString('en-IN')}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
           <span className="text-[8px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase italic">
             {req.businessDays || 0} Working Days
           </span>
        </div>
      </div>
    ),
  },
  {
    header: "Status",
    render: (req) => <StatusBadge status={req.status} />,
  },
  {
    header: "Actions",
    render: (req) => (
      <div className="flex items-center gap-3">
        {req.status === "Pending" && (
          <>
            <button onClick={() => onAction(req._id, "Approved", req)} className="text-emerald-500 hover:scale-110 transition-transform cursor-pointer" title="Approve">
              <HiOutlineCheckCircle size={20} />
            </button>
            <button onClick={() => onAction(req._id, "Rejected", req)} className="text-rose-500 hover:scale-110 transition-transform cursor-pointer" title="Reject">
              <HiOutlineXCircle size={20} />
            </button>
          </>
        )}
        <button onClick={() => onEdit(req)} className="text-blue-500 hover:scale-110 transition-transform cursor-pointer" title="Edit Details">
          <HiOutlinePencilSquare size={18} />
        </button>
        <button onClick={() => onDelete(req._id)} className="text-slate-300 hover:text-red-600 hover:scale-110 transition-transform cursor-pointer" title="Delete Permanent">
          <HiOutlineTrash size={18} />
        </button>
      </div>
    ),
  },
];

/**
 * QUOTA COLUMNS
 */
export const getQuotaColumns = () => [
  {
    header: "Employee",
    render: (r) => (
      <div className="flex flex-col">
        <span className="font-black text-slate-900 text-sm uppercase">{r.employee?.user?.name || r.user?.name}</span>
        <span className="text-[9px] font-bold text-slate-400 uppercase italic">{r.employee?.designation || "Staff"}</span>
      </div>
    ),
  },
  { header: "Annual Leave", render: (r) => renderQuotaCell(r.balances?.["Annual Leave"], "text-emerald-600", true) },
  { header: "Sick Leave", render: (r) => renderQuotaCell(r.balances?.["Sick Leave"], "text-orange-600") },
  { header: "Bereavement", render: (r) => renderQuotaCell(r.balances?.["Bereavement Leave"], "text-blue-600") },
  { header: "Paternity", render: (r) => renderQuotaCell(r.balances?.["Paternity Leave"], "text-indigo-600") },
  { header: "Maternity", render: (r) => renderQuotaCell(r.balances?.["Maternity Leave"], "text-pink-600") },
];

/**
 * CASUAL & LOP COLUMNS
 */
export const getCasualLopColumns = (onEdit, onDelete) => [
  {
    header: "Employee",
    render: (r) => (
      <div className="flex flex-col">
        <span className="font-black text-slate-900 text-[11px] uppercase">{r.user?.name} {`(${r.user?.employee?.employeeCode ? r.user?.employee?.employeeCode : ''})`}</span>
        <span className="text-[8px] font-bold text-slate-400 uppercase italic">{r.user?.employee?.designation}</span>
      </div>
    ),
  },
  {
    header: "Type",
    render: (r) => (
      <span className={`text-[9px] font-black py-0.5 rounded uppercase ${r.type === 'LOP' ? 'text-red-600' : 'text-orange-600'}`}>
        {r.type}
      </span>
    ),
  },
  {
    header: "Dates",
    render: (r) => (
      <div className="text-[10px] font-bold text-slate-700 uppercase tabular-nums">
        {new Date(r.startDate).toLocaleDateString()} - {new Date(r.endDate).toLocaleDateString()}
      </div>
    ),
  },
  { header: "Days", render: (r) => <b className="text-slate-900 text-[10px] uppercase font-black">{r.duration}d</b> },
  { 
    header: "Actions", 
    render: (r) => (
      <div className="flex items-center gap-3">
        <button onClick={() => onEdit(r)} className="text-blue-500 hover:scale-110 cursor-pointer"><HiOutlinePencilSquare size={16} /></button>
        <button onClick={() => onDelete(r._id)} className="text-slate-300 hover:text-red-600 cursor-pointer"><HiOutlineTrash size={16} /></button>
      </div>
    )
  }
];
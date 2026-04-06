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
    <p className={`text-[9px] font-black uppercase tracking-[0.2em] ${styles[status]}`}>
      {label[status]}
    </p>
  );
};

const renderQuotaCell = (balance, colorClass = "text-slate-900", isAccrual = false) => {
  if (!balance) return <span className="text-[10px] text-slate-300 italic tracking-widest">—</span>;

  const total = isAccrual ? balance.earned : balance.quota;
  
  return (
    <div className="flex flex-col py-1 group">
      {/* Primary Info: Remaining Days */}
      <div className="flex items-baseline gap-1">
        <span className={`text-[11px] font-black tracking-tighter ${colorClass}`}>
          {balance.remaining}
        </span>
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Days Remaining</span>
      </div>

      {/* Secondary Info: Tiny high-density metadata */}
      <div className="flex items-center gap-2 mt-0.5 border-t border-slate-100 pt-0.5 opacity-80 group-hover:opacity-100 transition-opacity">
        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tight">
          Used: <span className="text-slate-900 font-black">{balance.taken}</span>
        </span>
        <span className="text-slate-200 text-[8px]">|</span>
        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tight">
          Total: <span className="text-slate-900 font-black">{total}</span>
        </span>
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
      <p className="font-black text-slate-900 text-[11px] uppercase">{req.user?.name} {`(${req.user?.employee?.employeeCode ? req.user?.employee?.employeeCode : ''})`}</p>
    ),
  },
  {
    header: "Leave Type",
    className: "text-center",
    render: (req) => (
      <p className="text-[10px] text-center text-slate-700 font-black uppercase tracking-widest">
        {req.type}
      </p>
    ),
  },
  {
    header: "Leave Reason",
    className: "text-left",
    render: (req) => (
      <p className="text-[10px] text-slate-700 font-black uppercase truncate max-w-[280px] italic">
        {req.reason || "No operational context provided"}
      </p>
    )
  },
  {
    header: "Requested On",
    className: "text-center",
    render: (req) => (
      <div className="flex items-center justify-center gap-2">
        <HiOutlineCalendar className="text-orange-500" size={13} />
        <p className="text-[10px] text-slate-700 font-black tracking-widest uppercase">
          {new Date(req.createdAt).toLocaleDateString('en-IN')}
        </p>
      </div>
    ),
  },
  {
    header: "Leave Timeline",
    className: "text-center",
    render: (req) => (
      <div className="flex items-center justify-center gap-2">
        <HiOutlineCalendar className="text-orange-500" size={13} />
        <p className="text-[10px] text-slate-700 font-black tracking-widest uppercase">
          {new Date(req.startDate).toLocaleDateString('en-IN')} — {new Date(req.endDate).toLocaleDateString('en-IN')}
        </p>
      </div>
    ),
  },
  {
    header: "No Of Days",
    className: "text-center",
    render: (req) => <p className=" text-center text-slate-700 text-[10px] uppercase font-black">{req.duration || 0} days</p>
  },
  {
    header: "Status",
    className: "text-center",
    render: (req) => <div className="text-center"><StatusBadge status={req.status} /></div>,
  },
  {
    header: "Actions",
    render: (req) => (
      <div className="flex items-start gap-2">
        {req.status === "Pending" && (
          <>
            <button onClick={() => onAction(req._id, "Approved", req)} className="text-emerald-500 hover:scale-110 transition-transform cursor-pointer" title="Approve Leave">
              <HiOutlineCheckCircle size={20} />
            </button>
            <button onClick={() => onAction(req._id, "Rejected", req)} className="text-rose-500 hover:scale-110 transition-transform cursor-pointer" title="Reject Leave">
              <HiOutlineXCircle size={20} />
            </button>
          </>
        )}
        <button onClick={() => onEdit(req)} className="text-yellow-500 hover:text-yellow-600 hover:scale-110 transition-transform cursor-pointer" title="Update Leave Details">
          <HiOutlinePencilSquare size={18} />
        </button>
        <button onClick={() => onDelete(req._id)} className="text-red-500 hover:text-red-600 hover:scale-110 transition-transform cursor-pointer" title="Delete Permanent">
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
      <span className="font-black text-slate-900 text-[11px] uppercase">{r?.employee?.user?.name} {`(${r?.employee?.employeeCode ? r?.employee?.employeeCode : ''})`}</span>
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
      <p className="font-black text-slate-900 text-[11px] uppercase">{r.user?.name} {`(${r.user?.employee?.employeeCode ? r.user?.employee?.employeeCode : ''})`}</p>
    ),
  },
  {
    header: "Leave Type",
    className: "text-center",
    render: (req) => (
      <p className="text-[10px] text-center text-slate-700 font-black uppercase tracking-widest">
        {req.type}
      </p>
    ),
  },
  {
    header: "Leave Reason",
    className: "text-left",
    render: (req) => (
      <p className="text-[10px] text-slate-700 font-black uppercase truncate max-w-[280px] italic">
        {req.reason || "No operational context provided"}
      </p>
    )
  },
  {
    header: "Requested On",
    className: "text-center",
    render: (req) => (
      <div className="flex items-center justify-center gap-2">
        <HiOutlineCalendar className="text-orange-500" size={13} />
        <p className="text-[10px] text-slate-700 font-black tracking-widest uppercase">
          {new Date(req.createdAt).toLocaleDateString('en-IN')}
        </p>
      </div>
    ),
  },
  {
    header: "Leave Timeline",
    className: "text-center",
    render: (req) => (
      <div className="flex items-center justify-center gap-2">
        <HiOutlineCalendar className="text-orange-500" size={13} />
        <p className="text-[10px] text-slate-700 font-black tracking-widest uppercase">
          {new Date(req.startDate).toLocaleDateString('en-IN')} — {new Date(req.endDate).toLocaleDateString('en-IN')}
        </p>
      </div>
    ),
  },
  {
    header: "No Of Days",
    className: "text-center",
    render: (req) => <p className=" text-center text-slate-700 text-[10px] uppercase font-black">{req.duration || 0} days</p>
  },
  {
    header: "Status",
    className: "text-center",
    render: (req) => <div className="text-center"><StatusBadge status={req.status} /></div>,
  },
];
import React from "react";
import { HiOutlineLockClosed } from "react-icons/hi";
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

const renderQuotaCell = (balance, colorClass = "text-slate-900", isAccrual = false, onAdjust) => {
  if (!balance) return <span className="text-[10px] text-slate-300 italic tracking-widest">—</span>;

  const total = isAccrual
    ? balance.earned + (balance.carryForward || 0) + (balance.adjustment || 0)
    : balance.quota;

  return (
    <div className="flex flex-col py-1 group relative">
      <div className="flex items-baseline gap-1">
        <span className={`text-[11px] font-black tracking-tighter ${colorClass}`}>
          {balance.remaining}
        </span>
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Days Remaining</span>
      </div>

      <div className="flex items-center gap-2 mt-0.5 border-t border-slate-100 pt-0.5 opacity-80 group-hover:opacity-100 transition-opacity">
        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tight">
          Used: <span className="text-slate-900 font-black">{balance.taken}</span>
        </span>
        <span className="text-slate-200 text-[8px]">|</span>
        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tight">
          Total: <span className="text-slate-900 font-black">{total}</span>
        </span>
      </div>

      {onAdjust && (
        <button
          onClick={onAdjust}
          className="text-[8px] font-black text-orange-500 hover:underline text-left mt-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        >
          Adjust
        </button>
      )}
    </div>
  );
};

export const getAdminLeaveColumns = (role, userId, onAction, onEdit, onDelete) => [
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
    header: "Approval Flow",
    className: "text-center",
    render: (req) => (
      <div className="flex flex-col gap-1 text-left">
        {req.approvalFlow?.map((step, index) => (
          <div
            key={index}
            className="flex items-center gap-2 text-[9px] font-black uppercase"
          >
            <span className="min-w-[90px]">
              {step.role}
            </span>

            {step.status === "Approved" && (
              <>
                <span className="text-emerald-600">
                  Approved
                </span>

                {step.approvedAt && (
                  <span className="text-slate-700">
                    {new Date(step.approvedAt).toLocaleDateString('en-IN')}
                  </span>
                )}
              </>
            )}

            {step.status === "Rejected" && (
              <span className="text-red-600">
                Rejected
              </span>
            )}

            {step.status === "Pending" && (
              <span className="text-orange-600">
                Pending
              </span>
            )}

            {step.status === "Waiting" && (
              <span className="text-slate-400">
                Waiting
              </span>
            )}
          </div>
        ))}
      </div>
    ),
  },
  {
    header: "Status",
    className: "text-center",
    render: (req) => <div className="text-center"><StatusBadge status={req.status} /></div>,
  },
  {
    header: "Actions",
    render: (req) => {
      const currentStep = req.approvalFlow?.[req.currentLevel];

      const isMyTurn = currentStep && (
        (currentStep.approver && String(currentStep.approver) === String(userId)) ||
        (currentStep.approvers?.length && currentStep.approvers.some(id => String(id) === String(userId))) ||
        (!currentStep.approver && !currentStep.approvers?.length && currentStep.role === role)
      );

      const canAct = req.status === "Pending" && isMyTurn;

      const isAssignedAdmin = role === "Admin" && req.approvalFlow?.some(step =>
        (step.approver && String(step.approver) === String(userId)) ||
        (step.approvers?.length && step.approvers.some(id => String(id) === String(userId)))
      );

      const canManage = role === "Hr Manager" || isAssignedAdmin;

      return (
        <div className="flex items-start gap-2">
          {canAct ? (
            <>
              <button
                onClick={() => onAction(req._id, "Approved", req)}
                className="text-emerald-500 hover:scale-110 transition-transform cursor-pointer"
                title="Approve Leave"
              >
                <HiOutlineCheckCircle size={20} />
              </button>

              <button
                onClick={() => onAction(req._id, "Rejected", req)}
                className="text-rose-500 hover:scale-110 transition-transform cursor-pointer"
                title="Reject Leave"
              >
                <HiOutlineXCircle size={20} />
              </button>


            </>
          ) : (
            <button
              className="text-slate-500 hover:text-slate-600 transition-all cursor-not-allowed"
              title={
                req.status !== "Pending"
                  ? `Already ${req.status}`
                  : `Awaiting ${currentStep?.role || "another approver"}'s decision`
              }
            >
              <HiOutlineLockClosed size={18} />
            </button>
          )}

          {canManage && (
            <>
              <button onClick={() => onEdit(req)} className="text-yellow-500 hover:text-yellow-600 hover:scale-110 transition-transform cursor-pointer" title="Update Leave Details">
                <HiOutlinePencilSquare size={18} />
              </button>
              <button onClick={() => onDelete(req._id)} className="text-red-500 hover:text-red-600 hover:scale-110 transition-transform cursor-pointer" title="Delete Permanent">
                <HiOutlineTrash size={18} />
              </button>
            </>
          )}

        </div>
      )
    }
  },
];

export const getQuotaColumns = (onAdjust) => [
  {
    header: "Employee",
    render: (r) => (
      <span className="font-black text-slate-900 text-[11px] uppercase">{r?.employee?.user?.name} {`(${r?.employee?.employeeCode ? r?.employee?.employeeCode : ''})`}</span>
    ),
  },
  { header: "Earned Leave", render: (r) => renderQuotaCell(r.balances?.["Earned Leave"], "text-emerald-600", true, () => onAdjust(r, "Earned Leave")) },
  { header: "Casual Leave", render: (r) => renderQuotaCell(r.balances?.["Casual Leave"], "text-yellow-600", false, () => onAdjust(r, "Casual Leave")) },
  { header: "Sick Leave", render: (r) => renderQuotaCell(r.balances?.["Sick Leave"], "text-orange-600", false, () => onAdjust(r, "Sick Leave")) },
  { header: "Bereavement", render: (r) => renderQuotaCell(r.balances?.["Bereavement Leave"], "text-blue-600", false, () => onAdjust(r, "Bereavement Leave")) },
  { header: "Paternity", render: (r) => renderQuotaCell(r.balances?.["Paternity Leave"], "text-indigo-600", false, () => onAdjust(r, "Paternity Leave")) },
  { header: "Maternity", render: (r) => renderQuotaCell(r.balances?.["Maternity Leave"], "text-pink-600", false, () => onAdjust(r, "Maternity Leave")) },
];

/**
 * CASUAL & LOP COLUMNS
 */
export const getCasualLopColumns = () => [
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

export const getCompensatoryOffColumns = () => [
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
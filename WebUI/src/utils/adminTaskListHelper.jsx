import React from "react";
import { FiEdit } from "react-icons/fi";
import { HiOutlineArrowPath, HiOutlineUserPlus } from "react-icons/hi2";

/* ---------------------------------- */
/* SHARED HEADER STYLE */
/* ---------------------------------- */

const headerClass =
  "text-[10px] font-black uppercase tracking-widest text-slate-400";

/* ---------------------------------- */
/* STATUS BADGE */
/* ---------------------------------- */

const renderStatusBadge = (status) => {
  const themes = {
    completed: "text-emerald-600",
    "on hold": "text-blue-600",
    "feedback pending": "text-yellow-600",
    "final rendering": "text-orange-600",
    postproduction: "text-purple-600",
  };

  const themeClass =
    themes[status?.toLowerCase()] || "text-slate-500";

  return (
    <span className={`inline-block text-[9px] font-black px-3 py-1 rounded-full tracking-widest ${themeClass}`}>
      {status}
    </span>
  );
};

/* ---------------------------------- */
/* ACTIVE STATUS */
/* ---------------------------------- */

const renderActiveStatus = (status) => {
  const isFinal = status === "Final";
  const isPreFinal = status === "Pre-Final";

  let textColor = "text-slate-500";
  if (isFinal) textColor = "text-emerald-600";
  else if (isPreFinal) textColor = "text-orange-600";

  return (
    <div className="flex justify-center">
      <span className={`text-[10px] font-black tracking-tighter ${textColor}`}>
        {status || "DRAFT-1"}
      </span>
    </div>
  );
};

/* ---------------------------------- */
/* UTILIZATION BAR */
/* ---------------------------------- */

const renderUtilization = (task) => {
  const progress = Math.min(task.progressPercent || 0, 100);
  const isWarning = task.isOverBudget || progress > 90;

  return (
    <div className="flex flex-col min-w-[180px]">
      <div className="flex justify-between items-end mb-1">
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
          <span className="text-slate-900">
            {(task.totalConsumedHours || 0).toFixed(1)}h
          </span>{" "}
          / {(task.allocatedTime || 0).toFixed(1)}h
        </span>

        <span className={`text-[10px] font-black ${isWarning ? "text-rose-600" : "text-emerald-600"}`}>
          {progress}%
        </span>
      </div>

      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-700 rounded-full ${isWarning ? "bg-rose-500 animate-pulse" : "bg-emerald-500"
            }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

const getStatusColor = (status) => {
  const statusMap = {
    "in progress": "text-green-600",
    "started": "text-blue-600",
  };

  return statusMap[status?.toLowerCase()] || "text-yellow-600";
};

/* ---------------------------------- */
/* FINAL COLUMN CONFIG */
/* ---------------------------------- */

export const getAdminTaskColumns = (onEdit, onStatusUpdate, onAssignTeam) => [
  {
    header: <span className={headerClass}>Task Title</span>,
    className: "text-left",
    render: (task) => (
      <p className="font-black text-slate-900 text-[11px] uppercase tracking-tight group-hover:text-orange-600 transition-colors">
        {task.title}
      </p>
    ),
  },

  {
    header: <span className={headerClass}>Task Details</span>,
    className: "text-left",
    render: (task) => (
      <p className="text-[9px] font-bold text-slate-400 line-clamp-1 italic">
        {task.description || "No task details."}
      </p>
    ),
  },

  {
    header: <span className={headerClass}>Team Members</span>,
    className: "text-center",
    cellClassName: "text-center",
    render: (task) => {
      const employeeCodes = task.assignedTo
        ?.map((emp) => {
          const name = emp.user?.name
            ? emp.user.name.charAt(0).toUpperCase() + emp.user.name.slice(1).toLowerCase()
            : "Unknown";

          const code = emp.employeeCode?.trim();

          // Only show (CODE) if code actually exists
          return code ? `${name} (${code.toUpperCase()})` : name;
        })
        .join(", ");

      return (
        <div className="flex justify-center">
          <span
            title={employeeCodes || "No members assigned"}
            className="text-orange-500 text-[11px] font-black cursor-pointer transition-transform hover:scale-110"
          >
            {task.assignedTo?.length || 0}
          </span>
        </div>
      );
    },
  },
  {
    header: <span className={headerClass}>Resource Usage</span>,
    className: "text-left",
    render: (task) => renderUtilization(task),
  },
  {
    header: <span className={headerClass}>Live Status</span>,
    className: "text-center",
    cellClassName: "text-center",
    render: (task) => (
      <span className={`text-[9px] font-black ${getStatusColor(task.liveStatus)}`}>
        {task.liveStatus || "To Be Started"}
      </span>
    ),
  },
  {
    header: <span className={headerClass}>Initiative Status</span>,
    className: "text-center",
    cellClassName: "text-center",
    render: (task) => renderStatusBadge(task.status),
  },
  {
    header: <span className={headerClass}>Active Status</span>,
    className: "text-center",
    cellClassName: "text-center",
    render: (task) => renderActiveStatus(task.activeStatus),
  },
  {
    header: <span className={headerClass}>Actions</span>,
    className: "text-center",
    cellClassName: "text-center",
    render: (task) => (
      <div className="flex justify-center gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAssignTeam(task);
          }}
          title="Assign Team"
          className="text-orange-500 hover:text-orange-600 transition-all active:scale-90 cursor-pointer"
        >
          <HiOutlineUserPlus size={18} />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onStatusUpdate(task);
          }}
          title="Update Status"
          className="text-emerald-500 hover:text-emerald-600 transition-all active:scale-90 cursor-pointer"
        >
          <HiOutlineArrowPath size={18} />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(task);
          }}
          title="Update Task"
          className="text-amber-500 hover:text-amber-600 transition-all active:scale-90 cursor-pointer"
        >
          <FiEdit size={18} />
        </button>
      </div>
    ),
  },
];
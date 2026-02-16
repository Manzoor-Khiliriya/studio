import React from "react";
import { FiEdit } from "react-icons/fi";
import { HiOutlineArrowPath } from "react-icons/hi2"; // New Sync Icon

const renderStatusBadge = (status, onStatusClick, task) => {
  const themes = {
    "completed": "bg-emerald-50 text-emerald-600 border-emerald-100",
    "in progress": "bg-blue-50 text-blue-600 border-blue-100",
    "on hold": "bg-slate-100 text-slate-600 border-slate-300",
    "to be started": "bg-indigo-50 text-indigo-500 border-indigo-100",
    "feedback pending": "bg-yellow-50 text-yellow-600 border-yellow-200",
    "final rendering": "bg-orange-50 text-orange-600 border-orange-200",
    "postproduction": "bg-purple-50 text-purple-600 border-purple-200",
  };

  const normalizedStatus = status?.toLowerCase() || "";
  const themeClass = themes[normalizedStatus] || "bg-slate-50 text-slate-500 border-slate-200";

  return (
    <div 
      onClick={(e) => { e.stopPropagation(); onStatusClick(task); }}
      className="group/stat cursor-pointer flex items-center justify-center gap-2"
    >
      <span className={`inline-block text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border shadow-sm transition-all group-hover/stat:border-orange-300 ${themeClass}`}>
        {status}
      </span>
      <HiOutlineArrowPath className="text-slate-300 group-hover/stat:text-orange-500 transition-colors opacity-0 group-hover/stat:opacity-100" size={12} />
    </div>
  );
};

const renderActiveStatus = (status, onStatusClick, task) => {
  const isFinal = status === "Final";
  const isPreFinal = status === "Pre-Final";

  let textColor = "text-slate-500";
  let bgColor = "bg-slate-50";

  if (isFinal) {
    textColor = "text-emerald-600";
    bgColor = "bg-emerald-50";
  } else if (isPreFinal) {
    textColor = "text-orange-600";
    bgColor = "bg-orange-50";
  }

  return (
    <div 
      onClick={(e) => { e.stopPropagation(); onStatusClick(task); }}
      className="group/act cursor-pointer flex items-center justify-center gap-2"
    >
      <div className={`flex items-center justify-center px-3 py-1 rounded-lg border border-slate-100 ${bgColor} shadow-sm inline-flex transition-all group-hover/act:border-orange-300`}>
        <span className={`text-[10px] font-black uppercase tracking-tighter ${textColor}`}>
          {status || "DRAFT-1"}
        </span>
      </div>
      <HiOutlineArrowPath className="text-slate-300 group-hover/act:text-orange-500 transition-colors opacity-0 group-hover/act:opacity-100" size={12} />
    </div>
  );
};

const renderUtilization = (task) => {
  const progress = Math.min(task.progressPercent || 0, 100);
  const isWarning = task.isOverBudget || progress > 90;

  return (
    <div className="flex flex-col min-w-[200px] pr-8">
      <div className="flex justify-between items-end mb-2">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          <span className="text-slate-900">{(task.totalConsumedTime / 60 || 0).toFixed(1)}h</span> / {(task.allocatedTime || 0).toFixed(1)}h
        </span>
        <span className={`text-[10px] font-black ${isWarning ? 'text-rose-600' : 'text-emerald-600'}`}>
          {progress}%
        </span>
      </div>
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
        <div
          className={`h-full transition-all duration-700 rounded-full ${isWarning ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)] animate-pulse' : 'bg-emerald-500'}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

/**
 * Updated Columns with separate Status Trigger
 */
export const getAdminTaskColumns = (onEdit, onStatusUpdate) => [
  {
    header: "Project Code",
    render: (task) => (
      <span className="font-black text-[10px] text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 uppercase tracking-tighter">
        {task.projectNumber || task._id.slice(-5)}
      </span>
    )
  },
  {
    header: "Created Date",
    render: (task) => (
      <span className="font-black text-[10px] text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 uppercase tracking-tighter">
        {new Date(task.createdAt).toLocaleDateString() || "NA"}
      </span>
    )
  },
  {
    header: "Project Title",
    render: (task) => (
      <p className="font-black text-slate-900 text-[11px] uppercase tracking-tight leading-tight group-hover:text-orange-600">
        {task.title}
      </p>
    )
  },
  {
    header: "Project Details",
    render: (task) => (
      <p className="text-[10px] font-bold text-slate-600 line-clamp-2 leading-relaxed">
        {task.projectDetails || "No protocol details provided."}
      </p>
    )
  },
  {
    header: "No Of Employees",
    className: "text-center",
    cellClassName: "text-center",
    render: (task) => (
      <div className="flex flex-col items-center">
        <span className="text-lg font-black text-slate-900 leading-none">
          {task.assignedTo?.length || 0}
        </span>
      </div>
    )
  },
  {
    header: "Resource Utilization",
    render: (task) => renderUtilization(task)
  },
  {
    header: "Estimate Time",
    className: "text-center",
    cellClassName: "text-center",
    render: (task) => (
      <span className="text-[11px] font-black text-slate-700">
        {task.allocatedTime || 0} HRS
      </span>
    )
  },
  {
    header: "Timeline",
    render: (task) => (
      <div className="text-[9px] font-black text-slate-500 uppercase flex flex-col gap-0.5">
        <span className="flex justify-between">Start: <span className="text-slate-900 ml-2">{new Date(task.startDate).toLocaleDateString()}</span></span>
        <span className="flex justify-between">End: <span className="text-slate-900 ml-2">{new Date(task.endDate).toLocaleDateString()}</span></span>
      </div>
    )
  },
  {
    header: "Initiative Status",
    className: "text-center",
    cellClassName: "text-center",
    render: (task) => renderStatusBadge(task.status, onStatusUpdate, task)
  },
  {
    header: "Active Status",
    className: "text-center",
    cellClassName: "text-center",
    render: (task) => renderActiveStatus(task.activeStatus || "Draft-1", onStatusUpdate, task)
  },
  {
    header: "Actions",
    render: (task) => (
      <button
        onClick={(e) => { e.stopPropagation(); onEdit(task); }}
        className="text-yellow-500 hover:text-yellow-600 transition-all active:scale-90 cursor-pointer"
      >
        <FiEdit size={18} />
      </button>
    )
  }
];
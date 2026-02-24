import React from "react";
import { FiEdit } from "react-icons/fi";
import { HiOutlineArrowPath } from "react-icons/hi2";

// 1. Move helper functions to the top
const renderStatusBadge = (status) => {
  const themes = {
    "completed": "bg-emerald-50 text-emerald-600 border-emerald-100",
    "on hold": "bg-slate-100 text-slate-600 border-slate-300",
    "feedback pending": "bg-yellow-50 text-yellow-600 border-yellow-200",
    "final rendering": "bg-orange-50 text-orange-600 border-orange-200",
    "postproduction": "bg-purple-50 text-purple-600 border-purple-200",
  };
  const themeClass = themes[status?.toLowerCase()] || "bg-slate-50 text-slate-500 border-slate-200";
  return (
    <span className={`inline-block text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border shadow-sm ${themeClass}`}>
      {status}
    </span>
  );
};

const renderActiveStatus = (status) => {
  const isFinal = status === "Final";
  const isPreFinal = status === "Pre-Final";
  let textColor = "text-slate-500", bgColor = "bg-slate-50";

  if (isFinal) { textColor = "text-emerald-600"; bgColor = "bg-emerald-50"; }
  else if (isPreFinal) { textColor = "text-orange-600"; bgColor = "bg-orange-50"; }

  return (
    <div className={`flex items-center justify-center px-3 py-1 rounded-lg border border-slate-100 ${bgColor} shadow-sm inline-flex`}>
      <span className={`text-[10px] font-black uppercase tracking-tighter ${textColor}`}>
        {status || "DRAFT-1"}
      </span>
    </div>
  );
};

const renderUtilization = (task) => {
  const progress = Math.min(task.progressPercent || 0, 100);
  const isWarning = task.isOverBudget || progress > 90;

  return (
    <div className="flex flex-col min-w-[180px]">
      <div className="flex justify-between items-end mb-1">
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
          <span className="text-slate-900">{(task.totalConsumedHours || 0).toFixed(1)}h</span> / {(task.allocatedTime || 0).toFixed(1)}h
        </span>
        <span className={`text-[10px] font-black ${isWarning ? 'text-rose-600' : 'text-emerald-600'}`}>
          {progress}%
        </span>
      </div>
      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
        <div
          className={`h-full transition-all duration-700 rounded-full ${isWarning ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

// 2. Export the column definition at the bottom
export const getAdminTaskColumns = (onEdit, onStatusUpdate) => [
  {
    header: "Task Objective",
    render: (task) => (
      <div className="flex flex-col">
        <p className="font-black text-slate-900 text-[11px] uppercase tracking-tight group-hover:text-orange-600 transition-colors">
          {task.title}
        </p>
        <p className="text-[9px] font-bold text-slate-400 line-clamp-1 italic text-wrap">
          {task.projectDetails || "No protocol details."}
        </p>
      </div>
    )
  },
  {
    header: "Team",
    className: "text-center",
    cellClassName: "text-center",
    render: (task) => (
      <div className="flex -space-x-2 justify-center">
        <span className="w-8 h-8 rounded-full bg-slate-900 text-white border-2 border-white flex items-center justify-center text-[11px] font-black shadow-sm">
          {task.assignedTo?.length || 0}
        </span>
      </div>
    )
  },
  {
    header: "Resource Usage",
    render: (task) => renderUtilization(task) // This will now find the function
  },
  {
    header: "Timeline",
    render: (task) => (
      <div className="text-[9px] font-black text-slate-500 uppercase flex flex-col">
        <span className="flex justify-between gap-2">S: <span className="text-slate-900">{new Date(task.startDate).toLocaleDateString()}</span></span>
        <span className="flex justify-between gap-2">E: <span className="text-slate-900">{new Date(task.endDate).toLocaleDateString()}</span></span>
      </div>
    )
  },
  {
    header: "Live / Status",
    className: "text-center",
    cellClassName: "text-center",
    render: (task) => (
      <div className="flex flex-col items-center gap-1.5">
        <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${
          task.liveStatus?.toLowerCase() === "in progress" 
          ? "bg-blue-50 text-blue-600 border-blue-100" 
          : "bg-slate-50 text-slate-400 border-slate-200"
        }`}>
          {task.liveStatus || "TO BE STARTED"}
        </span>
        {renderStatusBadge(task.status)}
      </div>
    )
  },
  {
    header: "Version",
    className: "text-center",
    cellClassName: "text-center",
    render: (task) => renderActiveStatus(task.activeStatus)
  },
  {
    header: "Actions",
    className: "text-right",
    cellClassName: "text-right",
    render: (task) => (
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={(e) => { e.stopPropagation(); onStatusUpdate(task); }}
          className="text-emerald-500 hover:text-emerald-600 transition-all active:scale-90 cursor-pointer"
          title="Update Status"
        >
          <HiOutlineArrowPath size={20} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(task); }}
          className="text-amber-500 hover:text-amber-600 transition-all active:scale-90 cursor-pointer"
          title="Edit Task"
        >
          <FiEdit size={18} />
        </button>
      </div>
    )
  }
];
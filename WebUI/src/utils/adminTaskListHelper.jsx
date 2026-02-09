import React from "react";
import { FiEdit } from "react-icons/fi";

/**
 * UI Renderers for specific cell types
 */
const renderStatusBadge = (status) => {
  const themes = {
    Completed: "bg-emerald-50 text-emerald-600 border-emerald-100",
    "In Progress": "bg-orange-50 text-orange-600 border-orange-200",
    Overdue: "bg-rose-50 text-rose-600 border-rose-100",
    Pending: "bg-yellow-50 text-yellow-500 border-yellow-100",
  };
  return (
    <span className={`inline-block text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border shadow-sm ${themes[status] || themes.Pending}`}>
      {status}
    </span>
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
 * Your Original Columns Reconstructed
 */
export const getAdminTaskColumns = (onEdit) => [
  {
    header: "Project No",
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
      <p className="font-black text-slate-900 text-[11px] uppercase tracking-tight leading-tight">
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
    header: "Timeline",
    render: (task) => (
      <div className="text-[9px] font-black text-slate-500 uppercase flex flex-col gap-0.5">
        <span className="flex justify-between">Start: <span className="text-slate-900 ml-2">{new Date(task.startDate).toLocaleDateString()}</span></span>
        <span className="flex justify-between">End: <span className="text-slate-900 ml-2">{new Date(task.endDate).toLocaleDateString()}</span></span>
      </div>
    )
  },
  {
    header: "Status",
    className: "text-center",
    cellClassName: "text-center",
    render: (task) => renderStatusBadge(task.status)
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
import React from "react";
import { FiEdit } from "react-icons/fi";
import { HiOutlineArrowPath } from "react-icons/hi2";

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

/* ---------------------------------- */
/* FINAL COLUMN CONFIG */
/* ---------------------------------- */

export const getAdminTaskColumns = (onEdit, onStatusUpdate) => [
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
        {task.projectDetails || "No protocol details."}
      </p>
    ),
  },

  {
  header: <span className={headerClass}>Team</span>,
  className: "text-center",
  cellClassName: "text-center",
  render: (task) => {
    const employeeCodes = task.assignedTo
      ?.map((emp) => {
        const name = emp.user?.name
          ? emp.user.name.charAt(0).toUpperCase() + emp.user.name.slice(1).toLowerCase()
          : "Unknown";
        
        const code = emp.employee_code?.toUpperCase() ?? "N/A";
        
        return `${name} (${code})`;
      })
      .join(", ");

    return (
      <div className="flex justify-center">
        <span
          title={employeeCodes || "No members assigned"}
          className="w-8 h-8 rounded-lg bg-slate-900 text-orange-500 border-2 border-white flex items-center justify-center text-[11px] font-black shadow-sm cursor-pointer transition-transform hover:scale-110"
        >
          {task.assignedTo?.length || 0}
        </span>
      </div>
    );
  },
},
  // {
  //   header: <span className={headerClass}>Team</span>,
  //   className: "text-center",
  //   cellClassName: "text-center",
  //   render: (task) => (
  //     <div className="flex justify-center group relative cursor-pointer">
  //       {/* THE NUMBER BOX */}
  //       <span className="w-8 h-8 flex items-center justify-center text-[10px] font-black shadow-lg rounded-xl border-[1.5px] border-white/20 bg-gradient-to-br from-slate-800 to-slate-950 text-orange-400 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-orange-500/20">
  //         {task.assignedTo?.length || 0}
  //       </span>

  //       {/* COMPACT HOVER CARD */}
  //       <div className="absolute top-full left-1/2 -translate-x-1/2 w-max min-w-[140px] bg-slate-900 border border-white/10 p-1.5 rounded-xl shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 translate-y-2 transition-all duration-200 z-50">
  //         <div className="flex flex-col gap-1">
  //           {task.assignedTo?.length > 0 ? (
  //             task.assignedTo.map((emp, i) => (
  //               <div key={i} className="flex items-center justify-between gap-4 px-2 py-1 rounded-lg bg-white/5 border border-white/5">
  //                 <span className="text-[10px] font-bold text-slate-100 uppercase tracking-tighter">
  //                   {emp.user?.name || "Member"}
  //                 </span>
  //                 <span className="text-[9px] font-black text-orange-500 px-1.5 py-0.5 rounded bg-orange-500/10">
  //                   {emp.employeeCode || "TBD"}
  //                 </span>
  //               </div>
  //             ))
  //           ) : (
  //             <p className="text-[9px] text-slate-500 p-2 font-black uppercase text-center italic tracking-widest">Unassigned</p>
  //           )}
  //         </div>
          
  //         {/* Arrow */}
  //         <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
  //       </div>
  //     </div>
  //   ),
  // },
  // {
  //   header: <span className={headerClass}>Team</span>,
  //   className: "text-left", // Changed to left to accommodate the stack + button
  //   render: (task) => (
  //     <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
  //       {/* AVATAR STACK */}
  //       <div className="flex -space-x-2 overflow-hidden">
  //         {task.assignedTo?.length > 0 ? (
  //           <div className="h-7 w-7 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-[10px] font-bold text-slate-400">
  //             {task.assignedTo?.length}
  //           </div>
  //         ) : (
  //           <div className="h-7 w-7 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-[10px] font-bold text-slate-400">
  //             0
  //           </div>
  //         )}
  //       </div>

  //       {/* THE QUICK ASSIGN COMPONENT */}
  //       <QuickAssign task={task} />
  //     </div>
  //   ),
  // },

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
      <span
        className={`text-[10px] font-black ${task.liveStatus?.toLowerCase() === "in progress"
          ? "text-green-600"
          : "text-yellow-600"
          }`}
      >
        {task.liveStatus || "TO BE STARTED"}
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
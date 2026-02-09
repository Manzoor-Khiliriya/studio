import React from "react";
import { FiEdit, FiTrash2 } from "react-icons/fi";

/**
 * Generates columns for the Admin Holiday Table
 * @param {Function} onEdit - Callback for editing
 * @param {Function} onDelete - Callback for deleting
 */
export const getAdminHolidayColumns = (onEdit, onDelete) => [
  {
    header: "Registry Date",
    render: (r) => {
      const d = new Date(r.date);
      return (
        <div className="flex items-center gap-4 py-1">
          <div className="flex flex-col items-center justify-center bg-slate-900 text-white w-10 h-10 rounded-lg shadow-lg">
            <span className="text-[9px] font-black leading-none uppercase opacity-60">
              {d.toLocaleDateString("en-US", { month: "short" })}
            </span>
            <span className="text-base font-black leading-none">{d.getDate()}</span>
          </div>
          <div>
            <p className="font-black text-slate-900 text-[11px] uppercase tracking-tight">
              {d.toLocaleDateString("en-US", { weekday: "long" })}
            </p>
            <p className="text-[9px] font-bold text-slate-400 uppercase italic">
              {d.getFullYear()}
            </p>
          </div>
        </div>
      );
    },
  },
  {
    header: "Holiday Title",
    render: (r) => (
      <span className="font-black text-slate-900 text-sm uppercase tracking-tight group-hover:text-orange-600 transition-colors">
        {r.name}
      </span>
    ),
  },
  {
    header: "Protocol Notes",
    className: "hidden md:table-cell",
    render: (r) => (
      <span className="text-xs font-bold text-slate-400 italic max-w-xs truncate block">
        {r.description || "No specific instructions provided."}
      </span>
    ),
  },
  {
    header: "Actions",
    className: "text-right pr-10",
    render: (r) => (
      <div className="flex justify-end gap-3">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(r); }}
          className="p-2 text-amber-500 hover:bg-amber-50 rounded-xl transition-all active:scale-90 cursor-pointer"
          title="Update Holiday"
        >
          <FiEdit size={18} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(r._id); }}
          className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all active:scale-90 cursor-pointer"
          title="Delete Holiday"
        >
          <FiTrash2 size={18} />
        </button>
      </div>
    ),
  },
];
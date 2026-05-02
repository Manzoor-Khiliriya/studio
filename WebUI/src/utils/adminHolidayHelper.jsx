import React from "react";
import { FiEdit, FiTrash2 } from "react-icons/fi";

/**
 * Generates columns for the Admin Holiday Table
 * @param {Function} onEdit - Callback for editing
 * @param {Function} onDelete - Callback for deleting
 */
export const getAdminHolidayColumns = (onEdit, onDelete) => [
  {
    header: "Holiday Name",
    render: (r) => (
      <p className="font-black text-slate-900 text-[11px] uppercase tracking-tight group-hover:text-orange-600 transition-colors">
        {r.name}
      </p>
    ),
  },
  {
    header: "Holiday Date",
    render: (r) => {
      const d = new Date(r.date);
      return (
        <p className="text-[11px] text-slate-800 font-black uppercase italic">
          {new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
        </p>
      );
    },
  },
  {
    header: "Day",
    render: (r) => {
      const d = new Date(r.date);
      return (
        <p className="font-black text-slate-900 text-[11px] uppercase tracking-tight">
          {d.toLocaleDateString("en-IN", { weekday: "long" })}
        </p>
      );
    },
  },
  {
    header: "Description",
    className: "hidden md:table-cell",
    render: (r) => (
      <p className="text-xs font-bold text-slate-400 italic max-w-xs truncate block">
        {r.description || "No specific instructions provided."}
      </p>
    ),
  },
  {
    header: "Actions",
    render: (r) => (
      <div className="flex items-center gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(r); }}
          className="text-yellow-500 hover:text-yellow-600 transition-all active:scale-90 cursor-pointer"
          title="Update Holiday"
        >
          <FiEdit size={18} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(r); }}
          className="text-rose-500 hover:text-rose-600 transition-all active:scale-90 cursor-pointer"
          title="Delete Holiday"
        >
          <FiTrash2 size={18} />
        </button>
      </div>
    ),
  },
];
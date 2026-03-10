import React from 'react';

export default function GroupedTaskTable({ tasks, columns, onRowClick, emptyMessage = "No records found" }) {

  return (
    <div className="overflow-x-auto custom-scrollbar rounder-b-lg">
      <table className="w-full text-left border-separate border-spacing-0 ">
        <thead>
          <tr className="bg-slate-50/80 backdrop-blur-sm sticky top-0 z-20">
            {columns.map((col, idx) => (
              <th
                key={idx}
                className={`px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 ${col.className || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {tasks.length > 0 ? (
            tasks.map((task, idx) => (
              <tr
                key={task._id || idx}
                onClick={() => onRowClick && onRowClick(task)}
                className="group hover:bg-orange-100/20 cursor-pointer"
              >
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className={`px-6 py-4 border-b border-slate-50 ${col.cellClassName || ""}`}>
                    {col.render ? col.render(task) : task[col.key]}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length}>{emptyMessage}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
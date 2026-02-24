import React from 'react';

export default function GroupedTaskTable({ tasks, columns, onRowClick, emptyMessage = "No records found" }) {
  const grouped = tasks.reduce((acc, task) => {
    const pCode = task.project?.projectNumber || "UNASSIGNED";
    if (!acc[pCode]) {
      acc[pCode] = { 
        projectNumber: pCode, 
        projectTitle: task.project?.title || "Unknown Project", 
        taskList: [] 
      };
    }
    acc[pCode].taskList.push(task);
    return acc;
  }, {});

  const projectGroups = Object.values(grouped);

  return (
    <div className="overflow-x-auto custom-scrollbar">
      <table className="w-full text-left border-separate border-spacing-0">
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
          {projectGroups.length > 0 ? (
            projectGroups.map((group) => (
              <React.Fragment key={group.projectNumber}>
                {/* --- STICKY PROJECT HEADER --- */}
                <tr className="sticky top-[52px] z-10 shadow-sm">
                  <td colSpan={columns.length} className="px-6 py-3 bg-slate-900 border-y border-slate-800">
                    <div className="flex items-center gap-4">
                      <span className="bg-orange-500 text-white px-2 py-0.5 rounded text-[10px] font-black tracking-tighter shadow-sm">
                        {group.projectNumber}
                      </span>
                      <span className="text-white text-[11px] font-bold uppercase tracking-widest">
                        {group.projectTitle}
                      </span>
                      <div className="h-[1px] flex-grow bg-white/10"></div>
                      <span className="text-white/40 text-[9px] font-black uppercase tracking-tighter">
                        {group.taskList.length} Tasks assigned
                      </span>
                    </div>
                  </td>
                </tr>

                {/* --- TASK ROWS --- */}
                {group.taskList.map((task, idx) => (
                  <tr
                    key={task._id || idx}
                    onClick={() => onRowClick && onRowClick(task)}
                    className="group transition-all hover:bg-orange-50/40 cursor-pointer"
                  >
                    {columns.map((col, colIdx) => (
                      <td key={colIdx} className={`px-6 py-4 border-b border-slate-50 transition-colors ${col.cellClassName || ''}`}>
                        {col.render ? col.render(task) : task[col.key]}
                      </td>
                    ))}
                  </tr>
                ))}
                
                {/* Spacer row between groups */}
                <tr className="h-6 bg-white"><td colSpan={columns.length}></td></tr>
              </React.Fragment>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="py-24 text-center">
                <p className="text-slate-300 font-black uppercase italic text-lg tracking-tighter">
                  {emptyMessage}
                </p>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
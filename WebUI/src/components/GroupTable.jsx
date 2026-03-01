import React from 'react';

export default function GroupedTaskTable({ tasks, columns, onRowClick, emptyMessage = "No records found" }) {
  const grouped = tasks.reduce((acc, task) => {
    const pCode = task.project?.project_code || "UNASSIGNED";
    if (!acc[pCode]) {
      acc[pCode] = { 
        project_code: pCode, 
        projectTitle: task.project?.title || "Unknown Project", 
        taskList: [] 
      };
    }
    acc[pCode].taskList.push(task);
    return acc;
  }, {});

  const projectGroups = Object.values(grouped);

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
          {projectGroups.length > 0 ? (
            projectGroups.map((group) => (
              <React.Fragment key={group.project_code}>

                {/* --- TASK ROWS --- */}
                {group.taskList.map((task, idx) => (
                  <tr
                    key={task._id || idx}
                    onClick={() => onRowClick && onRowClick(task)}
                    className="group transition-all hover:bg-orange-100/20 cursor-pointer"
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
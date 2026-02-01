import React from 'react';

export default function Table({ columns, data, onRowClick, emptyMessage = "No records found" }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50/50 border-b-2 border-slate-100">
            {columns.map((col, idx) => (
              <th 
                key={idx} 
                className={`px-6 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest ${col.className || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {data.length > 0 ? (
            data.map((row, rowIdx) => (
              <tr
                key={row._id || rowIdx}
                onClick={() => onRowClick && onRowClick(row)}
                className={`group transition-all ${onRowClick ? 'hover:bg-orange-50/20 cursor-pointer' : ''}`}
              >
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className={`px-6 py-5 ${col.cellClassName || ''}`}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="py-20 text-center">
                <p className="text-slate-300 font-black italic text-lg uppercase tracking-tighter">
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
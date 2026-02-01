import React from "react";

const DateFilter = ({ label, value, onChange, colorClass }) => (
    <div className="relative group">
        <input
            type="date"
            className="pl-4 pr-10 py-3.5 bg-white border-2 border-slate-100 rounded-2xl focus:border-orange-500 outline-none font-bold text-[11px] uppercase shadow-sm transition-all"
            value={value}
            onChange={(e) => onChange(e.target.value)}
        />
        <span className={`absolute -top-2 left-3 bg-white px-1 text-[8px] font-black uppercase tracking-tighter ${colorClass}`}>
            {label}
        </span>
    </div>
);

export default DateFilter
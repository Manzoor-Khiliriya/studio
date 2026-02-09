import React from "react";
import { HiOutlinePlus } from "react-icons/hi2";

const PageHeader = ({ title, subtitle, iconText = "T", actionLabel, onAction }) => {
  return (
    <header className="bg-white border-b border-slate-200 pt-10 pb-12">
      <div className="max-w-[1600px] mx-auto px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white font-black text-2xl italic shadow-lg shadow-orange-200">
                {iconText}
              </span>
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">
                {title}
              </h1>
            </div>
            {subtitle && (
              <p className="text-slate-500 text-sm font-medium ml-1">
                {subtitle}
              </p>
            )}
          </div>

          {actionLabel && (
            <button
              onClick={onAction}
              className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-orange-600 text-white px-7 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-slate-200 active:scale-95 cursor-pointer"
            >
              <HiOutlinePlus strokeWidth={3} size={18} />
              <span className="uppercase tracking-tight text-sm">{actionLabel}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default PageHeader;
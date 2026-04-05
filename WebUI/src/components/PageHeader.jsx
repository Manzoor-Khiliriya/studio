import React from "react";
import { HiOutlinePlus } from "react-icons/hi2";

const PageHeader = ({
  title,
  subtitle,
  iconText = "P",
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  tabs,
  activeTab,
  onTabChange,
}) => {

  const displayIcon = title?.charAt(0).toUpperCase() || iconText || "P";

  return (
    <header className="bg-white border-b border-slate-200 pt-10 pb-12">
      <div className="max-w-[1700px] mx-auto px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          {/* LEFT — Icon + Title + Subtitle */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white font-black text-2xl italic shadow-lg shadow-orange-200">
                {displayIcon}
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

          {/* RIGHT — Tabs (above) + Buttons (below) */}
          <div className="flex flex-col items-end gap-3">

            {/* TABS */}
            {tabs?.length > 0 && (
              <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-sm">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange?.(tab.id)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                      activeTab === tab.id
                        ? "bg-orange-600 text-white shadow-lg"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}

            {/* ACTION BUTTONS */}
            <div className="flex items-center gap-4">
              {secondaryActionLabel && (
                <button
                  onClick={onSecondaryAction}
                  className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-orange-600 text-white px-7 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-slate-200 active:scale-95 cursor-pointer"
                >
                  <HiOutlinePlus strokeWidth={3} size={18} />
                  <span className="uppercase tracking-tight text-sm">{secondaryActionLabel}</span>
                </button>
              )}

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
        </div>
      </div>
    </header>
  );
};

export default PageHeader;
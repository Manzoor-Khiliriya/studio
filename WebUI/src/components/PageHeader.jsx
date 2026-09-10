import React from "react";
import { HiOutlinePlusCircle } from "react-icons/hi2";

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
    <header className="bg-white border-b border-slate-200 pt-6 sm:pt-8 lg:pt-10 pb-8 sm:pb-10 lg:pb-12">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 sm:gap-6">

          {/* LEFT — Icon + Title + Subtitle */}
          <div className="min-w-0">
            <div className="flex items-start gap-2 sm:gap-3 mb-2">
              <span className="shrink-0 w-9 h-9 sm:w-10 sm:h-10 bg-orange-500 rounded-lg sm:rounded-xl flex items-center justify-center text-white font-black text-xl sm:text-2xl italic shadow-lg shadow-orange-200">
                {displayIcon}
              </span>

              <h1 className="min-w-0 text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tighter uppercase break-words">
                {title}
              </h1>
            </div>

            {subtitle && (
              <p className="text-slate-500 text-xs sm:text-sm font-medium ml-1">
                {subtitle}
              </p>
            )}
          </div>

          {/* RIGHT — Tabs + Buttons */}
          <div className="flex flex-col items-stretch lg:items-end gap-3 w-full lg:w-auto">

            {/* TABS */}
            {tabs?.length > 0 && (
              <div className="flex bg-slate-100 p-1 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm w-full lg:w-auto overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange?.(tab.id)}
                    className={`flex-1 lg:flex-none whitespace-nowrap flex items-center justify-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${activeTab === tab.id
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
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">

              {secondaryActionLabel && (
                <button
                  onClick={onSecondaryAction}
                  className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-orange-600 text-white px-4 sm:px-7 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold transition-all shadow-xl shadow-slate-200 active:scale-95 cursor-pointer w-full sm:w-auto"
                >
                  <span className="uppercase tracking-tight text-xs sm:text-sm">
                    {secondaryActionLabel}
                  </span>
                </button>
              )}

              {actionLabel && (
                <button
                  onClick={onAction}
                  className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-slate-50 border border-slate-100 text-[9px] sm:text-[10px] font-black hover:bg-orange-600 hover:text-white rounded-xl transition-all uppercase tracking-widest shadow-lg shadow-orange-200 cursor-pointer active:scale-95 w-full sm:w-auto"
                >
                  <HiOutlinePlusCircle size={18} />
                  <span>{actionLabel}</span>
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
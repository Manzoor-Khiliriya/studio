import { HiChevronLeft, HiChevronRight } from "react-icons/hi2";

/**
 * @param {Object} pagination - { current: number, total: number, count: number }
 * @param {Function} onPageChange - Callback function (pageNumber)
 * @param {boolean} loading - Disable state
 * @param {string} label - Text label (e.g., "Tasks", "Operators")
 */
export default function Pagination({ pagination, onPageChange, loading, label = "Items" }) {
  if (!pagination || pagination.total <= 1) return null;

  return (
    <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
        Page {pagination.current} of {pagination.total} — {pagination.count} {label} Total
      </p>
      
      <div className="flex items-center gap-2">
        {/* Previous Button */}
        <button
          disabled={pagination.current === 1 || loading}
          onClick={() => onPageChange(pagination.current - 1)}
          className="p-3 rounded-xl bg-white border border-slate-200 text-slate-600 hover:border-orange-500 hover:text-orange-600 disabled:opacity-30 transition-all shadow-sm active:scale-90"
        >
          <HiChevronLeft size={20} />
        </button>

        {/* Page Numbers */}
        <div className="flex gap-1 overflow-x-auto max-w-[200px] sm:max-w-none no-scrollbar">
          {[...Array(pagination.total)].map((_, i) => {
            const pageNum = i + 1;
            const isCurrent = pagination.current === pageNum;
            
            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                disabled={loading}
                className={`min-w-[40px] h-10 rounded-xl font-black text-xs transition-all active:scale-95 ${
                  isCurrent
                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30'
                    : 'bg-white text-slate-400 hover:bg-slate-100 border border-slate-100'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          disabled={pagination.current === pagination.total || loading}
          onClick={() => onPageChange(pagination.current + 1)}
          className="p-3 rounded-xl bg-white border border-slate-200 text-slate-600 hover:border-orange-500 hover:text-orange-600 disabled:opacity-30 transition-all shadow-sm active:scale-90"
        >
          <HiChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
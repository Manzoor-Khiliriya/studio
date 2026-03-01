import { HiChevronLeft, HiChevronRight } from "react-icons/hi2";

export default function Pagination({ pagination, onPageChange, loading, label = "Items" }) {
  // 1. Safe Destructuring with fallbacks to match your API metadata
  const current = pagination?.current || 1;
  const totalPages = pagination?.total || 1; // Assuming you passed meta.totalPages as 'total'
  const totalItems = pagination?.count || 0;
  const limit = pagination?.limit || 10;

  // 2. Only hide if there's truly only one page
  if (!pagination || totalPages <= 1) return null;

  const getPages = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (current <= 4) {
        pages.push(1, 2, 3, 4, 5, "...", totalPages);
      } else if (current > totalPages - 4) {
        pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", current - 1, current, current + 1, "...", totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-end w-full gap-4">
      {/* INFO TEXT (Optional) */}
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
        Page {current} of {totalPages} ({totalItems} {label})
      </p>
      
      <div className="flex items-center gap-2">
        <button
          disabled={current === 1 || loading}
          onClick={() => onPageChange(current - 1)}
          className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-400 hover:border-orange-500 hover:text-orange-600 disabled:opacity-20 transition-all shadow-sm active:scale-95 cursor-pointer"
        >
          <HiChevronLeft size={18} strokeWidth={2} />
        </button>

        <div className="flex items-center gap-1">
          {getPages().map((page, index) => (
            <button
              key={`${page}-${index}`}
              disabled={loading || page === "..."}
              onClick={() => page !== "..." && onPageChange(page)}
              className={`min-w-[36px] h-9 rounded-lg font-black text-[11px] transition-all ${
                current === page
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-200'
                  : page === "..." 
                    ? 'bg-transparent text-slate-300 cursor-default'
                    : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100 cursor-pointer'
              }`}
            >
              {page}
            </button>
          ))}
        </div>

        <button
          disabled={current === totalPages || loading}
          onClick={() => onPageChange(current + 1)}
          className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-400 hover:border-orange-500 hover:text-orange-600 disabled:opacity-20 transition-all shadow-sm active:scale-95 cursor-pointer"
        >
          <HiChevronRight size={18} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
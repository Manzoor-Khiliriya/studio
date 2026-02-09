import { HiChevronLeft, HiChevronRight } from "react-icons/hi2";

export default function Pagination({ pagination, onPageChange, loading, label = "Items" }) {
  // --- THE LOGIC CHANGE ---
  // Only render if we have pagination data AND total items exceed the current limit
  if (!pagination || pagination.count <= pagination.limit) return null;

  const { current, total, count } = pagination;

  const getPages = () => {
    const pages = [];
    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      if (current <= 4) {
        pages.push(1, 2, 3, 4, 5, "...", total);
      } else if (current > total - 4) {
        pages.push(1, "...", total - 4, total - 3, total - 2, total - 1, total);
      } else {
        pages.push(1, "...", current - 1, current, current + 1, "...", total);
      }
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-4">
      {/* INFO TEXT */}
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
        Showing <span className="text-slate-900">{current}</span> of{" "}
        <span className="text-slate-900">{total}</span> Pages
        <span className="mx-2 text-slate-200">|</span> 
        Total <span className="text-slate-900">{count}</span> {label}
      </p>
      
      <div className="flex items-center gap-2">
        <button
          disabled={current === 1 || loading}
          onClick={() => onPageChange(current - 1)}
          className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-400 hover:border-orange-500 hover:text-orange-600 disabled:opacity-20 transition-all shadow-sm active:scale-90 cursor-pointer"
        >
          <HiChevronLeft size={18} strokeWidth={2} />
        </button>

        <div className="flex items-center gap-1">
          {getPages().map((page, index) => (
            <button
              key={index}
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
          disabled={current === total || loading}
          onClick={() => onPageChange(current + 1)}
          className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-400 hover:border-orange-500 hover:text-orange-600 disabled:opacity-20 transition-all shadow-sm active:scale-90 cursor-pointer"
        >
          <HiChevronRight size={18} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
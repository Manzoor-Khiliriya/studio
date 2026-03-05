import React, { useState, useMemo, useEffect } from "react";
import { 
  HiOutlineUsers, 
  HiOutlineAdjustmentsHorizontal,
  HiOutlineXMark,
  HiOutlineArrowRight,
  HiOutlineFunnel,
  HiOutlineMagnifyingGlass
} from "react-icons/hi2";
import { 
  startOfToday, endOfToday, startOfYesterday, endOfYesterday, 
  startOfWeek, endOfWeek, subWeeks, startOfMonth, endOfMonth, 
  subMonths, format 
} from "date-fns";

// Services & Helpers
import { useGetAllAttendanceQuery } from "../../services/attendanceApi";
import { getAdminAttendanceColumns } from "../../utils/adminAttendanceListHelper";

// Components
import PageHeader from "../../components/PageHeader";
import Table from "../../components/Table";
import Loader from "../../components/Loader";
import Pagination from "../../components/Pagination";

export default function AttendanceManagement() {
  // --- STATE ---
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [rangeType, setRangeType] = useState("today");
  const [rangeLabel, setRangeLabel] = useState("Today");
  const [dateFilter, setDateFilter] = useState({
    startDate: format(startOfToday(), "yyyy-MM-dd"),
    endDate: format(endOfToday(), "yyyy-MM-dd"),
  });

  // --- SEARCH DEBOUNCE LOGIC ---
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to first page when search changes
    }, 500); // 500ms delay

    return () => clearTimeout(handler);
  }, [search]);

  // --- DATA FETCHING ---
  const { data, isLoading, isFetching } = useGetAllAttendanceQuery({
    startDate: dateFilter.startDate,
    endDate: dateFilter.endDate,
    page: page,
    limit: limit,
    search: debouncedSearch // Passes the name search to backend
  });

  const attendanceData = data?.records || [];
  const pagination = data?.pagination || { total: 0, pages: 1 };

  // --- HANDLERS ---
  const handleRangeChange = (e) => {
    const value = e.target.value;
    setRangeType(value);
    setPage(1);

    if (value === "custom") {
      setRangeLabel("Custom Range");
      return; 
    }

    let start = startOfToday();
    let end = endOfToday();

    switch (value) {
      case "today": setRangeLabel("Today"); break;
      case "yesterday": start = startOfYesterday(); end = endOfYesterday(); setRangeLabel("Yesterday"); break;
      case "current_week": start = startOfWeek(new Date(), { weekStartsOn: 1 }); end = endOfToday(); setRangeLabel("Current Week"); break;
      case "last_week": 
        const lastW = subWeeks(new Date(), 1); 
        start = startOfWeek(lastW, { weekStartsOn: 1 }); 
        end = endOfWeek(lastW, { weekStartsOn: 1 }); 
        setRangeLabel("Last Week"); 
        break;
      case "current_month": start = startOfMonth(new Date()); end = endOfMonth(new Date()); setRangeLabel("Current Month"); break;
      case "last_month": 
        const lastM = subMonths(new Date(), 1); 
        start = startOfMonth(lastM); 
        end = endOfMonth(lastM); 
        setRangeLabel("Last Month"); 
        break;
      default: break;
    }

    setDateFilter({ startDate: format(start, "yyyy-MM-dd"), endDate: format(end, "yyyy-MM-dd") });
  };

  const handleManualDateChange = (type, value) => {
    setRangeType("custom");
    setRangeLabel("Custom Range");
    setDateFilter(prev => ({ ...prev, [type]: value }));
    setPage(1);
  };

  const resetFilters = () => {
    setSearch("");
    setRangeType("today");
    setRangeLabel("Today");
    setDateFilter({
      startDate: format(startOfToday(), "yyyy-MM-dd"),
      endDate: format(endOfToday(), "yyyy-MM-dd"),
    });
    setPage(1);
  };

  const columns = useMemo(() => getAdminAttendanceColumns(), []);

  if (isLoading) return <Loader message="Accessing Personnel Logs..." />;

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Personnel Logs"
        subtitle="Real-time monitoring and historical tracking of workforce attendance."
      />

      <main className="mx-auto px-8 -mt-10 space-y-8">
        {/* TACTICAL FILTER BAR */}
        <div className="bg-white/90 backdrop-blur-xl border border-slate-200 p-5 rounded-[2.5rem] shadow-xl shadow-slate-200/50 flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-4">
            
            {/* Search Input for Employee Name */}
            <div className="relative flex-1 min-w-[300px] group">
              <HiOutlineMagnifyingGlass
                className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors"
                size={20}
              />
              <input
                type="text"
                placeholder="Search employee by name..."
                className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/5 outline-none font-bold text-sm transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Quick Range Selector */}
            <div className="relative group">
              <select
                value={rangeType}
                onChange={handleRangeChange}
                className="appearance-none pl-6 pr-14 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-orange-500 outline-none font-black text-[11px] uppercase cursor-pointer transition-all text-slate-700 shadow-sm"
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="current_week">This Week</option>
                <option value="last_week">Last Week</option>
                <option value="current_month">This Month</option>
                <option value="last_month">Last Month</option>
                <option value="custom">Custom Range</option>
              </select>
              <HiOutlineAdjustmentsHorizontal
                className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                size={18}
              />
            </div>

            {/* Manual Date Inputs */}
            <div className="flex items-center gap-3 bg-slate-50 p-2 px-4 rounded-2xl border border-slate-100">
              <input 
                type="date" 
                value={dateFilter.startDate}
                onChange={(e) => handleManualDateChange("startDate", e.target.value)}
                className="bg-transparent text-[11px] font-black uppercase outline-none cursor-pointer text-slate-600"
              />
              <HiOutlineArrowRight className="text-slate-300" size={14}/>
              <input 
                type="date" 
                value={dateFilter.endDate}
                onChange={(e) => handleManualDateChange("endDate", e.target.value)}
                className="bg-transparent text-[11px] font-black uppercase outline-none cursor-pointer text-slate-600"
              />
            </div>

            {(rangeType !== "today" || search) && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-2 px-6 py-3 text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-2xl transition-all font-bold text-xs cursor-pointer"
              >
                <HiOutlineXMark size={18} strokeWidth={2.5} />
                <span>RESET</span>
              </button>
            )}
          </div>
        </div>

        {/* STATS SUMMARY BAR */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Filtered Logs</p>
              <span className="text-3xl font-black text-slate-900">{pagination.total}</span>
            </div>
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
              <HiOutlineUsers size={24} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Now</p>
              <span className="text-3xl font-black text-blue-600">
                {attendanceData?.filter(a => !a.clockOut).length}
              </span>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
              </span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Completed</p>
              <span className="text-3xl font-black text-emerald-600">
                {attendanceData?.filter(a => a.clockOut).length}
              </span>
            </div>
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500">
              <HiOutlineFunnel size={24} />
            </div>
          </div>
        </div>

        {/* MAIN DATA TABLE */}
        <div className="bg-white rounded-[3rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col mb-10">
          <div className={`${isFetching ? "opacity-40" : "opacity-100"} transition-opacity duration-200`}>
            <Table 
              columns={columns} 
              data={attendanceData} 
              rowClassName="hover:bg-slate-50/50 transition-colors"
              emptyMessage="No activity logs found matching your criteria."
            />
          </div>

          {/* PAGINATION FOOTER */}
          <div className="bg-slate-50/50 p-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100 pr-4">Limit</span>
                <select 
                  value={limit} 
                  onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }} 
                  className="bg-transparent text-xs font-black outline-none cursor-pointer text-slate-700"
                >
                  {[10, 20, 50, 100].map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {pagination.total} Records Found
              </span>
            </div>

            <Pagination 
              pagination={{ 
                current: page, 
                total: pagination.pages, 
                count: pagination.total, 
                limit: limit 
              }} 
              onPageChange={setPage} 
              loading={isFetching} 
              label="Logs" 
            />
          </div>
        </div>
      </main>
    </div>
  );
}
import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  HiOutlineUsers,
  HiOutlineAdjustmentsHorizontal,
  HiOutlineXMark,
  HiOutlineArrowRight,
  HiOutlineMagnifyingGlass,
  HiOutlineCalendarDays,
  HiOutlineListBullet,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiChevronUpDown,
  HiCheck
} from "react-icons/hi2";
import {
  startOfToday, endOfToday, startOfYesterday, endOfYesterday,
  startOfWeek, endOfWeek, subWeeks, startOfMonth, endOfMonth,
  subMonths, format, eachDayOfInterval, startOfISOWeek, endOfISOWeek,
  isSameMonth, addMonths, subMonths as dateFnsSubMonths
} from "date-fns";

// Services & Helpers
import { useGetAllAttendanceQuery } from "../../services/attendanceApi";
import { useGetAllUsersQuery } from "../../services/userApi";
import { getAdminAttendanceColumns } from "../../utils/adminAttendanceListHelper";

// Components
import Table from "../../components/Table";
import Loader from "../../components/Loader";
import Pagination from "../../components/Pagination";
import { useGetLeaveCalendarQuery } from "../../services/leaveApi";

export default function AttendanceManagement() {
  // --- NAVIGATION STATE ---
  const [activeTab, setActiveTab] = useState("logs");

  // --- FILTER STATE ---
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [rangeType, setRangeType] = useState("today");
  const [dateFilter, setDateFilter] = useState({
    startDate: format(startOfToday(), "yyyy-MM-dd"),
    endDate: format(endOfToday(), "yyyy-MM-dd"),
  });

  // --- CALENDAR STATE ---
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // --- SEARCH DEBOUNCE ---
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  // --- DATA FETCHING ---
  const { data, isLoading, isFetching } = useGetAllAttendanceQuery({
    startDate: activeTab === "logs" ? dateFilter.startDate : format(startOfMonth(currentMonth), "yyyy-MM-dd"),
    endDate: activeTab === "logs" ? dateFilter.endDate : format(endOfMonth(currentMonth), "yyyy-MM-dd"),
    page: page,
    limit: limit,
    search: debouncedSearch,
  });

  const { data: leaveCalendar, isLoading: isLeaveLoading } = useGetLeaveCalendarQuery({
    startDate: format(startOfMonth(currentMonth), "yyyy-MM-dd"),
    endDate: format(endOfMonth(currentMonth), "yyyy-MM-dd"),
  });

  const attendanceData = data?.records || [];
  const pagination = data?.pagination || { total: 0, pages: 1 };

  // --- CALENDAR LOGIC ---
  const calendarDays = useMemo(() => {
    const start = startOfISOWeek(startOfMonth(currentMonth));
    const end = endOfISOWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // --- HANDLERS ---
  const handleRangeChange = (e) => {
    const value = e.target.value;
    setRangeType(value);
    setPage(1);
    if (value === "custom") return;

    let start = startOfToday();
    let end = endOfToday();

    switch (value) {
      case "yesterday": start = startOfYesterday(); end = endOfYesterday(); break;
      case "current_week": start = startOfWeek(new Date(), { weekStartsOn: 1 }); end = endOfToday(); break;
      case "last_week":
        const lastW = subWeeks(new Date(), 1);
        start = startOfWeek(lastW, { weekStartsOn: 1 });
        end = endOfWeek(lastW, { weekStartsOn: 1 });
        break;
      case "current_month": start = startOfMonth(new Date()); end = endOfMonth(new Date()); break;
      case "last_month":
        const lastM = subMonths(new Date(), 1);
        start = startOfMonth(lastM);
        end = endOfMonth(lastM);
        break;
      default: break;
    }
    setDateFilter({ startDate: format(start, "yyyy-MM-dd"), endDate: format(end, "yyyy-MM-dd") });
  };

  const resetFilters = () => {
    setSearch("");
    setRangeType("today");
    setDateFilter({
      startDate: format(startOfToday(), "yyyy-MM-dd"),
      endDate: format(endOfToday(), "yyyy-MM-dd"),
    });
    setPage(1);
  };

  const columns = useMemo(() => getAdminAttendanceColumns(), []);

  if (isLoading) return <Loader message="Accessing Attendance Records..." />;

  return (
    <div className="p-8 bg-white min-h-screen">
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center text-white font-black text-2xl italic shadow-lg">
              A
            </span>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">
              Attendance Management
            </h1>
          </div>
          <p className="text-slate-500 text-sm font-medium ml-1">
            {activeTab === 'logs' ? "Detailed operational logs and metrics" : "Global leave and absence overview"}
          </p>
        </div>

        {/* TAB SWITCHER */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all  cursor-pointer ${
              activeTab === 'logs' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <HiOutlineListBullet size={16} />
            Daily Attendance
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
              activeTab === 'calendar' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <HiOutlineCalendarDays size={16} />
            Leave Calendar
          </button>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-slate-50/50 border border-slate-100 p-5 rounded-[2rem] mb-8 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[300px] group">
          <HiOutlineMagnifyingGlass className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by employee name..."
            className="w-full pl-12 pr-6 py-3.5 bg-white border border-slate-200 rounded-2xl focus:border-orange-500 outline-none font-bold text-xs transition-all shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {activeTab === "logs" ? (
          <>
            <div className="relative">
              <select
                value={rangeType}
                onChange={handleRangeChange}
                className="appearance-none pl-6 pr-12 py-3.5 bg-white border border-slate-200 rounded-2xl outline-none font-black text-[10px] uppercase cursor-pointer text-slate-700 shadow-sm"
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="current_week">This Week</option>
                <option value="last_week">Last Week</option>
                <option value="current_month">This Month</option>
                <option value="last_month">Last Month</option>
                <option value="custom">Custom Range</option>
              </select>
              <HiOutlineAdjustmentsHorizontal className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
            </div>

            {rangeType === "custom" && (
              <div className="flex items-center gap-3 bg-white px-4 py-3.5 rounded-2xl border border-orange-100 shadow-sm animate-in fade-in zoom-in-95">
                <input type="date" value={dateFilter.startDate} onChange={(e) => setDateFilter(p => ({ ...p, startDate: e.target.value }))} className="bg-transparent text-[10px] font-black uppercase outline-none" />
                <HiOutlineArrowRight className="text-slate-300" size={12} />
                <input type="date" value={dateFilter.endDate} onChange={(e) => setDateFilter(p => ({ ...p, endDate: e.target.value }))} className="bg-transparent text-[10px] font-black uppercase outline-none" />
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center gap-4 bg-white px-5 py-2 rounded-2xl border border-slate-200 shadow-sm">
            <button onClick={() => setCurrentMonth(dateFnsSubMonths(currentMonth, 1))} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-orange-600 transition-colors"><HiOutlineChevronLeft size={18} /></button>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 w-28 text-center">{format(currentMonth, "MMMM yyyy")}</span>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-orange-600 transition-colors"><HiOutlineChevronRight size={18} /></button>
          </div>
        )}

        {(search || rangeType !== "today") && (
          <button onClick={resetFilters} className="p-3.5 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-100 transition-all">
            <HiOutlineXMark size={20} />
          </button>
        )}
      </div>

      {/* DATA VIEW CONTAINER */}
      <div className="border border-slate-100 rounded-[2rem] overflow-hidden bg-white shadow-sm">
        {activeTab === "logs" ? (
          <>
            <div className={isFetching ? "opacity-50" : ""}>
              <Table columns={columns} data={attendanceData} emptyMessage="No attendance records found for this period." />
            </div>
            <div className="bg-slate-50/50 p-6 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-[9px] font-black text-slate-400 uppercase border-r pr-3">Limit</span>
                  <select value={limit} onChange={(e) => setLimit(Number(e.target.value))} className="bg-transparent text-[9px] font-black outline-none cursor-pointer">
                    {[10, 20, 50, 100].map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight ml-2">Total {pagination.total} records</span>
              </div>
              <Pagination pagination={{ current: page, total: pagination.pages }} onPageChange={setPage} loading={isFetching} label="Logs" />
            </div>
          </>
        ) : (
          <div className="p-4 bg-white min-h-[600px]">
            {isLeaveLoading ? (
              <div className="flex justify-center items-center h-96"><Loader message="Syncing calendar..." /></div>
            ) : (
              <div className="animate-in fade-in duration-500">
                {/* CALENDAR GRID */}
                <div className="grid grid-cols-7 gap-px bg-slate-200 border border-slate-200 rounded-[2rem] overflow-hidden">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => (
                    <div key={day} className="bg-slate-50 py-4 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-200">
                      {day}
                    </div>
                  ))}

                  {calendarDays.map((day, idx) => {
                    const dateStr = format(day, "yyyy-MM-dd");
                    const isCurrentMonth = isSameMonth(day, currentMonth);

                    // Filter ALL leaves for this specific day across all employees
                    const dayLeaves = leaveCalendar?.filter((l) => l.date === dateStr) || [];

                    return (
                      <div
                        key={idx}
                        className={`min-h-[140px] p-3 transition-colors flex flex-col ${
                          isCurrentMonth ? "bg-white" : "bg-slate-50/30 opacity-40"
                        }`}
                      >
                        <span className={`text-xs font-black mb-2 ${isCurrentMonth ? "text-slate-900" : "text-slate-300"}`}>
                          {format(day, "d")}
                        </span>

                        <div className="flex flex-col gap-1 overflow-y-auto max-h-[100px] pr-1">
                          {dayLeaves.map((leave, i) => (
                            <div
                              key={i}
                              title={`${leave.name} - ${leave.type}`}
                              className={`px-2 py-1.5 rounded-lg border flex flex-col gap-0.5 shadow-sm ${
                                leave.type === "Sick Leave"
                                  ? "bg-rose-50 border-rose-100 text-rose-700"
                                  : leave.type === "Annual Leave"
                                  ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                                  : "bg-blue-50 border-blue-100 text-blue-700"
                              }`}
                            >
                              <span className="text-[9px] font-black uppercase truncate leading-none">
                                {leave.name}
                              </span>
                              <span className="text-[7px] font-bold opacity-70 uppercase tracking-tighter">
                                {leave.type}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* LEGEND */}
                <div className="mt-8 flex flex-wrap gap-8 px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-md bg-emerald-100 border border-emerald-200"></div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Annual Leave</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-md bg-rose-100 border border-rose-200"></div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Sick Leave</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-md bg-blue-100 border border-blue-200"></div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Casual / Other</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
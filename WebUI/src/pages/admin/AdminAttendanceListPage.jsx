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

export default function AttendanceManagement() {
  // --- NAVIGATION STATE ---
  const [activeTab, setActiveTab] = useState("logs");

  // --- FILTER STATE ---
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [rangeType, setRangeType] = useState("today");
  const [dateFilter, setDateFilter] = useState({
    startDate: format(startOfToday(), "yyyy-MM-dd"),
    endDate: format(endOfToday(), "yyyy-MM-dd"),
  });

  // --- CALENDAR & EMPLOYEE STATE ---
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedEmployee, setSelectedEmployee] = useState(null);

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
    page: activeTab === "logs" ? page : 1,
    limit: activeTab === "logs" ? limit : 1000,
    search: activeTab === "logs" ? debouncedSearch : "",
    userId: selectedEmployee?._id || ""
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
    setSelectedEmployee(null);
  };

  const columns = useMemo(() => getAdminAttendanceColumns(), []);

  const pageTitle = "Attendance Management";
  const iconText = pageTitle.charAt(0).toUpperCase();

  if (isLoading) return <Loader message="Accessing Attendances..." />;

  return (
    <div className="p-8 bg-white">

      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white font-black text-2xl italic shadow-lg shadow-orange-200">
            {iconText}
            </span>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">
              {pageTitle}
            </h1>
          </div>
          <p className="text-slate-500 text-sm font-medium ml-1">
            {activeTab === 'logs' ? "Operational Activity Logs" : "Each Employee Logs"}
          </p>
        </div>

        {/* TAB SWITCHER */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
          <button
            onClick={() => { setActiveTab('logs'); setPage(1); }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${activeTab === 'logs' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
              }`}
          >
            <HiOutlineListBullet size={16} />
            Daily Attendance Logs
          </button>
          <button
            onClick={() => { setActiveTab('calendar'); setPage(1); }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${activeTab === 'calendar' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
              }`}
          >
            <HiOutlineCalendarDays size={16} />
            Employee Attendance Logs
          </button>
        </div>
      </div>

      {/* TACTICAL FILTER BAR */}
      <div className="bg-slate-50/50 border border-slate-100 p-5 rounded-[2rem] mb-8 flex flex-wrap items-center gap-4">
        {activeTab === "logs" ? (
          <div className="relative flex-1 min-w-[300px] group">
            <HiOutlineMagnifyingGlass className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search employee..."
              className="w-full pl-12 pr-6 py-3.5 bg-white border border-slate-200 rounded-2xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/5 outline-none font-bold text-xs transition-all shadow-sm group"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        ) : (
          <div className="flex-1 min-w-[300px]">
            <EmployeePicker selected={selectedEmployee} onSelect={setSelectedEmployee} />
          </div>
        )}

        {activeTab === "logs" && (
          <div className="relative group">
            <select
              value={rangeType}
              onChange={handleRangeChange}
              className="appearance-none pl-6 pr-12 py-3.5 bg-white border border-slate-200 rounded-2xl outline-none font-black text-[10px] uppercase cursor-pointer transition-all text-slate-700 shadow-sm focus:border-orange-500"
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
        )}

        {activeTab === "logs" && rangeType === "custom" && (
          <div className="flex items-center gap-3 bg-white px-4 py-3.5 rounded-2xl border border-orange-100 shadow-sm animate-in fade-in zoom-in-95">
            <input type="date" value={dateFilter.startDate} onChange={(e) => setDateFilter(p => ({ ...p, startDate: e.target.value }))} className="bg-transparent text-[10px] font-black uppercase outline-none text-slate-600" />
            <HiOutlineArrowRight className="text-slate-300" size={12} />
            <input type="date" value={dateFilter.endDate} onChange={(e) => setDateFilter(p => ({ ...p, endDate: e.target.value }))} className="bg-transparent text-[10px] font-black uppercase outline-none text-slate-600" />
          </div>
        )}

        {activeTab === "calendar" && (
          <div className="flex items-center gap-4 bg-white px-5 py-2 rounded-2xl border border-slate-200 shadow-sm">
            <button onClick={() => setCurrentMonth(dateFnsSubMonths(currentMonth, 1))} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-orange-600 transition-colors"><HiOutlineChevronLeft size={18} /></button>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 w-28 text-center">{format(currentMonth, "MMM yyyy")}</span>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-orange-600 transition-colors"><HiOutlineChevronRight size={18} /></button>
          </div>
        )}

        {(search || selectedEmployee || rangeType !== "today") && (
          <button onClick={resetFilters} className="p-3.5 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-100 transition-all cursor-pointer">
            <HiOutlineXMark size={20} />
          </button>
        )}
      </div>

      {/* DATA VIEW CONTAINER */}
      <div className="border border-slate-100 rounded-[2rem] overflow-hidden bg-white shadow-sm">
        {activeTab === "logs" ? (
          <>
            <div className={isFetching ? "opacity-50" : ""}>
              <Table columns={columns} data={attendanceData} emptyMessage="No attendance records detected." />
            </div>
            <div className="bg-slate-50/50 p-6 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-[9px] font-black text-slate-400 uppercase border-r pr-3">Limit</span>
                  <select value={limit} onChange={(e) => setLimit(Number(e.target.value))} className="bg-transparent text-[9px] font-black outline-none cursor-pointer">
                    {[5, 10, 20, 50].map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight ml-2">Total {pagination.total} results</span>
              </div>
              <Pagination pagination={{ current: page, total: pagination.pages }} onPageChange={setPage} loading={isFetching} label="Logs" />
            </div>
          </>
        ) : (
          <div className="p-2">
            {!selectedEmployee ? (
              <div className="h-96 flex flex-col items-center justify-center bg-slate-50/50 rounded-[1.5rem] border-2 border-dashed border-slate-100">
                <HiOutlineUsers size={40} className="text-slate-200 mb-3" />
                <p className="text-slate-400 font-black text-[9px] uppercase tracking-[0.2em]">Select employee to generate data</p>
              </div>
            ) : (
              <div className="animate-in fade-in duration-500">
                <div className="grid grid-cols-7 gap-px bg-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => (
                    <div key={day} className="bg-slate-50 py-3 text-center text-[9px] font-black uppercase text-slate-400 tracking-widest">{day}</div>
                  ))}
                  {calendarDays.map((day, idx) => {
                    const dateStr = format(day, "yyyy-MM-dd");
                    const log = attendanceData.find(r => r.date === dateStr);
                    const isCurrentMonth = isSameMonth(day, currentMonth);
                    return (
                      <div key={idx} className={`min-h-[100px] p-3 bg-white ${!isCurrentMonth ? "bg-slate-50/30 opacity-30" : ""}`}>
                        <span className={`text-[10px] font-black ${isCurrentMonth ? "text-slate-900" : "text-slate-300"}`}>{format(day, "d")}</span>
                        {log && (
                          <div className="mt-2 p-2 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700">
                            <div className="text-[8px] font-black uppercase leading-tight">
                              {format(new Date(log.clockIn), "HH:mm")} - {log.clockOut ? format(new Date(log.clockOut), "HH:mm") : "..."}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Unified EmployeePicker to match the "InputGroup" aesthetic
function EmployeePicker({ selected, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const dropdownRef = useRef(null);
  const { data: users } = useGetAllUsersQuery();

  const filtered = users?.filter(u => u.name.toLowerCase().includes(query.toLowerCase())) || [];

  useEffect(() => {
    const handleClick = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-2 flex items-center justify-between hover:border-orange-500 transition-all shadow-sm group"
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-orange-600 rounded-lg flex items-center justify-center text-white font-black text-[10px] shadow-lg shadow-orange-100">
            {selected ? selected.name.charAt(0).toUpperCase() : "?"}
          </div>
          <span className="text-xs font-bold text-slate-700">{selected ? selected.name : "Select Employee..."}</span>
        </div>
        <HiChevronUpDown className="text-slate-400 group-hover:text-orange-500" size={18} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-3 bg-white border border-slate-200 rounded-[1.5rem] shadow-2xl z-50 overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="p-3 border-b border-slate-50 bg-slate-50/50">
            <input
              autoFocus
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-[11px] font-bold outline-none focus:border-orange-500"
              placeholder="Filter names..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="max-h-60 overflow-y-auto p-1">
            {filtered.map(user => (
              <button
                key={user._id}
                onClick={() => { onSelect(user); setIsOpen(false); setQuery(""); }}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left"
              >
                <span className={`text-[11px] font-bold ${selected?._id === user._id ? "text-orange-600" : "text-slate-600"}`}>{user.name}</span>
                {selected?._id === user._id && <HiCheck className="text-orange-600" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
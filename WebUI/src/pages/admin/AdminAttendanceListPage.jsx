import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  HiOutlineAdjustmentsHorizontal,
  HiOutlineXMark,
  HiOutlineArrowRight,
  HiOutlineMagnifyingGlass,
  HiOutlineCalendarDays,
  HiOutlineListBullet,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
} from "react-icons/hi2";
import {
  startOfToday,
  endOfToday,
  startOfYesterday,
  endOfYesterday,
  startOfWeek,
  endOfWeek,
  subWeeks,
  startOfMonth,
  endOfMonth,
  subMonths,
  format,
  eachDayOfInterval,
  startOfISOWeek,
  endOfISOWeek,
  isSameMonth,
  addMonths,
  subMonths as dateFnsSubMonths,
} from "date-fns";
import { useGetAllAttendanceQuery } from "../../services/attendanceApi";
import { getAdminAttendanceColumns } from "../../utils/adminAttendanceListHelper";
import Table from "../../components/Table";
import Loader from "../../components/Loader";
import Pagination from "../../components/Pagination";
import { useGetLeaveCalendarQuery } from "../../services/leaveApi";
import { useSocketEvents } from "../../hooks/useSocketEvents";
import CustomDropdown from "../../components/CustomDropdown";
import useDebounce from "../../hooks/useDebounce";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useGetHolidaysQuery } from "../../services/holidayApi";

export default function AttendanceManagement() {
  const [activeTab, setActiveTab] = useState("logs");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [rangeType, setRangeType] = useState("today");
  const [dateFilter, setDateFilter] = useState({
    startDate: format(startOfToday(), "yyyy-MM-dd"),
    endDate: format(endOfToday(), "yyyy-MM-dd"),
  });
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const debouncedSearch = useDebounce(
    search.trim().length > 1 ? search.trim() : "",
    500,
  );

  const { data, isLoading, isFetching, refetch } = useGetAllAttendanceQuery({
    startDate:
      activeTab === "logs"
        ? dateFilter.startDate
        : format(startOfMonth(currentMonth), "yyyy-MM-dd"),
    endDate:
      activeTab === "logs"
        ? dateFilter.endDate
        : format(endOfMonth(currentMonth), "yyyy-MM-dd"),
    page: page,
    limit: limit,
    search: debouncedSearch,
  });

  const {
    data: leaveCalendar,
    isLoading: isLeaveLoading,
    refetch: refetchLeave,
  } = useGetLeaveCalendarQuery(
    {
      startDate: format(startOfMonth(currentMonth), "yyyy-MM-dd"),
      endDate: format(endOfMonth(currentMonth), "yyyy-MM-dd"),
    },
    {
      refetchOnMountOrArgChange: true,
    },
  );
  const { data: holidaysData, refetch: refetchHolidays } = useGetHolidaysQuery();


  useSocketEvents({
    onAttendanceChange: refetch,
    onLeaveChange: refetchLeave,
    onHolidayChange: refetchHolidays,
  });

  const attendanceData = data?.records || [];
  const pagination = data?.pagination || { total: 0, pages: 1 };

  const calendarDays = useMemo(() => {
    const start = startOfISOWeek(startOfMonth(currentMonth));
    const end = endOfISOWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const handleRangeChange = (value) => {
    setRangeType(value);
    setPage(1);

    if (value === "custom") return;

    let start = startOfToday();
    let end = endOfToday();

    switch (value) {
      case "yesterday":
        start = startOfYesterday();
        end = endOfYesterday();
        break;
      case "current_week":
        start = startOfWeek(new Date(), { weekStartsOn: 1 });
        end = endOfToday();
        break;
      case "last_week":
        const lastW = subWeeks(new Date(), 1);
        start = startOfWeek(lastW, { weekStartsOn: 1 });
        end = endOfWeek(lastW, { weekStartsOn: 1 });
        break;
      case "current_month":
        start = startOfMonth(new Date());
        end = endOfMonth(new Date());
        break;
      case "last_month":
        const lastM = subMonths(new Date(), 1);
        start = startOfMonth(lastM);
        end = endOfMonth(lastM);
        break;
      default:
        break;
    }

    setDateFilter({
      startDate: format(start, "yyyy-MM-dd"),
      endDate: format(end, "yyyy-MM-dd"),
    });
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

  const calendarEvents = useMemo(() => {
    // Holiday Backgrounds
    const holidayEvents = (holidaysData || []).map((h) => ({
      start: h.date?.split("T")[0],
      display: "background",
      className: "holiday-bg-highlight",
    }));

    // Leave Events
    const leaveEvents = (leaveCalendar || []).map((leave, index) => ({
      id: index,
      title: leave.name,
      start: leave.date,
      allDay: true,
      extendedProps: {
        employeeCode: leave.employeeCode,
        leaveType: leave.type,
      },
    }));

    return [...leaveEvents, ...holidayEvents];
  }, [leaveCalendar, holidaysData]);

  const leaveTypeColors = {
    "Earned Leave": "bg-violet-500",
    "Sick Leave": "bg-rose-500",
    "Bereavement Leave": "bg-slate-700",
    "Paternity Leave": "bg-green-500",
    "Maternity Leave": "bg-pink-500",
    "Casual Leave": "bg-blue-500",
    "Compensatory Off": "bg-amber-500",
    LOP: "bg-red-700",
  };

  if (isLoading) return <Loader message="Accessing Attendance Records..." />;

  return (
    <div className="max-w-[1750px] mx-auto p-8 bg-slate-100 min-h-screen">
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">
              Attendance Management
            </h1>
          </div>
          <p className="text-slate-500 text-sm font-medium">
            {activeTab === "logs"
              ? "Detailed operational logs and metrics"
              : "Global leave and absence overview"}
          </p>
        </div>

        {/* TAB SWITCHER */}
        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
          <button
            onClick={() => setActiveTab("logs")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all  cursor-pointer ${activeTab === "logs"
              ? "bg-orange-600 text-white shadow-lg"
              : "text-slate-400 hover:text-slate-600"
              }`}
          >
            <HiOutlineListBullet size={16} />
            Daily Attendance
          </button>
          <button
            onClick={() => setActiveTab("calendar")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${activeTab === "calendar"
              ? "bg-orange-600 text-white shadow-lg"
              : "text-slate-400 hover:text-slate-600"
              }`}
          >
            <HiOutlineCalendarDays size={16} />
            Leave Calendar
          </button>
        </div>
      </div>

      {/* FILTER BAR */}

      <div className="bg-slate-50/50 border border-slate-100 rounded-[2rem] mb-8 flex flex-wrap items-center gap-4">
        {activeTab === "logs" && (
          <div className="relative flex-1 min-w-[300px] group">
            <HiOutlineMagnifyingGlass
              className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search by employee name..."
              className="w-full pl-12 pr-6 py-3.5 bg-white border border-slate-200 rounded-2xl focus:border-orange-500 outline-none font-bold text-xs transition-all shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        )}

        {activeTab === "logs" && (
          <>
            <div className="relative">
              <CustomDropdown
                value={rangeType}
                onChange={handleRangeChange}
                options={[
                  { label: "Today", value: "today" },
                  { label: "Yesterday", value: "yesterday" },
                  { label: "This Week", value: "current_week" },
                  { label: "Last Week", value: "last_week" },
                  { label: "This Month", value: "current_month" },
                  { label: "Last Month", value: "last_month" },
                  { label: "Custom Range", value: "custom" },
                ]}
                className="min-w-[180px]"
                buttonClass="pl-6 pr-12 py-3.5 bg-white border border-slate-200 rounded-2xl font-black text-[10px] uppercase text-slate-700 shadow-sm"
              />
            </div>

            {rangeType === "custom" && (
              <div className="flex items-center gap-3 bg-white px-4 py-3.5 rounded-2xl border border-orange-100 shadow-sm animate-in fade-in zoom-in-95">
                <input
                  type="date"
                  value={dateFilter.startDate}
                  onChange={(e) =>
                    setDateFilter((p) => ({ ...p, startDate: e.target.value }))
                  }
                  className="bg-transparent text-[10px] font-black uppercase outline-none"
                />
                <HiOutlineArrowRight className="text-slate-300" size={12} />
                <input
                  type="date"
                  value={dateFilter.endDate}
                  onChange={(e) =>
                    setDateFilter((p) => ({ ...p, endDate: e.target.value }))
                  }
                  className="bg-transparent text-[10px] font-black uppercase outline-none"
                />
              </div>
            )}
          </>
        )}

        {(search || rangeType !== "today") && activeTab === "logs" && (
          <button
            onClick={resetFilters}
            className="p-3.5 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-100 transition-all"
          >
            <HiOutlineXMark size={20} />
          </button>
        )}
      </div>

      {/* DATA VIEW CONTAINER */}
      <div className={` ${activeTab === "logs" ? "rounded-[2rem] overflow-visible border border-slate-100 bg-white shadow-sm" : "overflow-hidden"}`}>
        {activeTab === "logs" ? (
          <div className="rounded-[2rem]">
            <div className={`${isFetching ? "opacity-50" : ""} rounded-t-[2rem] overflow-hidden`}>
              <Table
                columns={columns}
                data={attendanceData}
                emptyMessage="No attendance records found."
              />
            </div>
            <div className="bg-slate-50/50 p-6 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 rounded-b-[2rem]">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-3 bg-white px-5 py-2 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-[9px] font-black text-slate-400 uppercase border-r pr-3">
                    Page Limit
                  </span>
                  <CustomDropdown
                    value={limit.toString()}
                    onChange={(val) => {
                      setLimit(Number(val));
                    }}
                    options={[5, 10, 25, 50].map((v) => ({
                      label: `${v}`,
                      value: v.toString(),
                    }))}
                    className="w-10"
                    buttonClass="w-full p-1 bg-transparent text-[9px] font-black cursor-pointer text-slate-700 flex items-center gap-2"
                  />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight ml-2">
                  Total {pagination.total} records
                </span>
              </div>
              <Pagination
                pagination={{ current: page, total: pagination.pages }}
                onPageChange={setPage}
                loading={isFetching}
                label="Logs"
              />
            </div>
          </div>
        ) : (
          <div className="min-h-[600px]">
            {isLeaveLoading ? (
              <div className="flex justify-center items-center h-96">
                <Loader message="Syncing calendar..." />
              </div>
            ) : (
              <>
                <div className="modern-calendar-wrapper">
                  <FullCalendar
                    plugins={[dayGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    events={calendarEvents}
                    height="auto"
                    fixedWeekCount={false}
                    displayEventTime={false}
                    dayMaxEvents={3}
                    headerToolbar={{
                      left: "prev,next today",
                      center: "title",
                      right: "dayGridMonth,dayGridWeek",
                    }}
                    eventContent={(eventInfo) => {
                      if (eventInfo.event.display === "background") return null;

                      const type = eventInfo.event.extendedProps.leaveType;
                      const employeeCode =
                        eventInfo.event.extendedProps.employeeCode;

                      return (
                        <div className="px-[2px] py-[1px]">
                          <div
                            className={`rounded-lg overflow-hidden transition-all duration-200 hover:scale-[1.02]
         ${leaveTypeColors[type] || "bg-slate-500"}`}
                          >
                            <div className="px-2 py-1 flex items-center justify-center gap-1">
                              <span className="text-[9px] font-black text-white uppercase truncate">
                                {eventInfo.event.title}
                              </span>

                              {employeeCode && (
                                <span className="text-[9px] font-black text-white shrink-0">
                                  ({employeeCode})
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }}
                  />
                </div>
                <div className="flex flex-wrap gap-4 mt-6">
                  {[
                    {
                      label: "Earned Leave",
                      color: "bg-violet-500",
                    },
                    {
                      label: "Sick Leave",
                      color: "bg-rose-500",
                    },
                    {
                      label: "Bereavement Leave",
                      color: "bg-slate-700",
                    },
                    {
                      label: "Paternity Leave",
                      color: "bg-green-500",
                    },
                    {
                      label: "Maternity Leave",
                      color: "bg-pink-500",
                    },
                    {
                      label: "Casual Leave",
                      color: "bg-blue-500",
                    },
                    {
                      label: "Compensatory Off",
                      color: "bg-amber-500",
                    },
                    {
                      label: "LOP",
                      color: "bg-red-700",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 shadow-sm"
                    >
                      <div className={`w-3 h-3 rounded-full ${item.color}`} />

                      <span className="text-[10px] font-black uppercase tracking-wide text-slate-600">
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

        )}
      </div>
    </div>
  );
}

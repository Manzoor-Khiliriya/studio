import React from "react";
import {
  HiOutlineCalendar,
  HiOutlineSparkles,
  HiOutlineArrowRight,
  HiOutlineFire,
  HiOutlineClock,
} from "react-icons/hi2";
import { useNavigate } from "react-router-dom";
import { useGetHolidaysQuery } from "../../services/holidayApi";
import Loader from "../../components/Loader";
import Table from "../../components/Table";
import PageHeader from "../../components/PageHeader";

export default function EmployeeHolidayPage() {
  const navigate = useNavigate();
  const { data: holidays = [], isLoading, isFetching } = useGetHolidaysQuery();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // --- LOGIC: Filter only future holidays and sort by date ---
  const upcomingHolidays = holidays
    .filter((h) => new Date(h.date) >= today)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  // --- REUSABLE TABLE COLUMNS ---
  const columns = [
    {
      header: "Holiday Date",
      className: "text-left",
      render: (h) => {
        const d = new Date(h.date);
        return (
          <div className="flex items-center gap-4 py-3">
            <div className="flex flex-col items-center justify-center bg-slate-900 text-white min-w-[3rem] h-12 rounded-xl shadow-lg shadow-slate-200">
              <span className="text-[10px] font-black leading-none uppercase text-orange-400">
                {d.toLocaleDateString("en-US", { month: "short" })}
              </span>
              <span className="text-lg font-black leading-none">{d.getDate()}</span>
            </div>
            <div>
              <p className="font-black text-slate-900 text-sm uppercase tracking-tight">
                {d.toLocaleDateString("en-US", { weekday: "long" })}
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {d.getFullYear()} Cycle
              </p>
            </div>
          </div>
        );
      },
    },
    {
      header: "Holiday Name",
      render: (h) => (
        <span className="font-black text-slate-900 text-sm uppercase tracking-tight">
          {h.name}
        </span>
      ),
    },
    {
      header: "Strategy",
      className: "text-center",
      cellClassName: "text-center",
      render: (h) => {
        const day = new Date(h.date).getDay();
        const isLongWeekend = [1, 5].includes(day); // Monday or Friday
        return isLongWeekend ? (
          <span className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-600 px-3 py-1.5 rounded-full text-[9px] font-black uppercase border border-orange-100 animate-pulse">
            <HiOutlineFire size={12} /> Long Weekend
          </span>
        ) : (
          <span className="text-slate-300 text-[10px] font-bold">—</span>
        );
      },
    },
    {
      header: "Countdown",
      className: "text-center",
      cellClassName: "text-center",
      render: (h) => {
        const diffTime = new Date(h.date) - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return (
          <div className="flex flex-col items-center">
            <span className={`text-xs font-black uppercase ${diffDays <= 7 ? 'text-orange-500' : 'text-slate-500'}`}>
              {diffDays === 0 ? "Today" : `In ${diffDays} Days`}
            </span>
          </div>
        );
      }
    },
    {
      header: "Description",
      render: (h) => (
        <p className="text-xs font-bold text-slate-500 max-w-[300px] italic leading-relaxed">
          {h.description || "Public observance. All production cycles suspended."}
        </p>
      ),
    },
  ];

  if (isLoading) return <Loader message="Synchronizing Calendar..." />;

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <PageHeader
        title="Upcoming Holidays"
        subtitle="Chronological log of upcoming public observances and system downtime."
      />

      <main className="max-w-[1700px] mx-auto px-8 -mt-10 pb-32">

        {/* TACTICAL SUMMARY STRIP */}
        <div className="flex flex-wrap items-center gap-6 mb-8">
          <div className="bg-white px-8 py-5 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-4">
            <HiOutlineClock className="text-orange-500" size={24} />
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Upcoming Events</p>
              <p className="text-xl font-black text-slate-900">{upcomingHolidays.length} Records</p>
            </div>
          </div>
          {isFetching && (
            <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest animate-pulse flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full" /> Syncing Matrix...
            </span>
          )}
        </div>

        {/* DATA TABLE CONTAINER */}
        <div className="bg-white rounded-[3rem] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden group/table transition-all">
          <Table
            columns={columns}
            data={upcomingHolidays}
            emptyMessage="No upcoming holidays detected in current cycle."
          />
          <div className="bg-slate-50/50 p-6 border-t border-slate-100 flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Data Integrity Protocol Active
            </span>
          </div>
        </div>

      </main>
    </div>
  );
}
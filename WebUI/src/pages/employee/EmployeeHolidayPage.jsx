import React from "react";
import {
  HiOutlineFire,
  HiOutlineClock,
} from "react-icons/hi2";
import { useGetHolidaysQuery } from "../../services/holidayApi";
import Loader from "../../components/Loader";
import Table from "../../components/Table";
import PageHeader from "../../components/PageHeader";
import { useSocketEvents } from "../../hooks/useSocketEvents";

export default function EmployeeHolidayPage() {
  const { data: holidays = [], isLoading, isFetching, refetch } = useGetHolidaysQuery();

  useSocketEvents({
    onHolidayChange: refetch,
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // --- LOGIC: Filter only future holidays and sort by date ---
  const upcomingHolidays = holidays
    .filter((h) => new Date(h.date) >= today)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  // --- REUSABLE TABLE COLUMNS ---
  const columns = [
    {
      header: "Holiday Name",
      render: (r) => (
        <p className="font-black text-slate-900 text-[11px] uppercase tracking-tight group-hover:text-orange-600 transition-colors">
          {r.name}
        </p>
      ),
    },
    {
      header: "Holiday Date",
      render: (r) => {
        const d = new Date(r.date);
        return (
          <p className="text-[11px] text-slate-800 font-black uppercase italic">
            {new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
        );
      },
    },
    {
      header: "Day",
      render: (r) => {
        const d = new Date(r.date);
        return (
          <p className="font-black text-slate-900 text-[11px] uppercase tracking-tight">
            {d.toLocaleDateString("en-IN", { weekday: "long" })}
          </p>
        );
      },
    },
    {
      header: "Countdown",
      render: (h) => {
        const diffTime = new Date(h.date) - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return (
          <p className={`text-xs font-black uppercase ${diffDays <= 7 ? 'text-orange-500' : 'text-slate-500'}`}>
            {diffDays === 0 ? "Today" : `In ${diffDays} Days`}
          </p>
        );
      }
    },
    {
      header: "Description",
      className: "hidden md:table-cell",
      render: (r) => (
        <p className="text-xs font-bold text-slate-400 italic max-w-xs truncate block">
          {r.description || "No specific instructions provided."}
        </p>
      ),
    },
  ];

  if (isLoading) return <Loader message="Synchronizing Calendar..." />;

  return (
    <div className="max-w-[1750px] mx-auto  min-h-screen bg-slate-100">
      <PageHeader
        title="Upcoming Holidays"
        subtitle="Chronological log of upcoming public observances and system downtime."
      />

      <main className="max-w-[1750px] mx-auto px-8 -mt-10 pb-32">

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
            emptyMessage="No upcoming holidays found."
          />
        </div>

      </main>
    </div>
  );
}
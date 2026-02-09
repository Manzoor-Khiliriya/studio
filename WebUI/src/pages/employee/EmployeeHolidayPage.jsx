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
        title="Holiday Registry"
        subtitle="Chronological log of upcoming public observances and system downtime."
      />

      <main className="max-w-[1700px] mx-auto px-8 -mt-10 pb-32">
        
        {/* TACTICAL SUMMARY STRIP */}
        <div className="flex flex-wrap items-center gap-6 mb-8">
           <div className="bg-white px-8 py-5 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-4">
              <HiOutlineClock className="text-orange-500" size={24}/>
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

        {/* STRATEGY CARD */}
        <div className="mt-12 p-12 bg-slate-900 rounded-[4rem] relative overflow-hidden group shadow-2xl shadow-slate-900/20">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:30px_30px]" />
          
          <div className="relative flex flex-col xl:flex-row items-center justify-between gap-10">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="p-6 bg-orange-500 rounded-[2rem] text-white shadow-2xl shadow-orange-500/40 group-hover:rotate-12 transition-transform duration-500">
                <HiOutlineSparkles size={45} />
              </div>
              <div className="text-center md:text-left">
                <h3 className="font-black text-white text-3xl mb-3 uppercase tracking-tight">
                  Optimize Your Recovery
                </h3>
                <p className="text-slate-400 text-sm font-bold max-w-xl leading-relaxed uppercase tracking-wide">
                  Coordinate your leave requests with <span className="text-orange-500">Long Weekend</span> indicators to maximize break duration without depleting your leave balance.
                </p>
              </div>
            </div>
            
            <button 
              onClick={() => navigate("/my-leaves")}
              className="group flex items-center gap-4 bg-orange-500 text-white px-12 py-6 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] hover:bg-orange-600 transition-all active:scale-95 shadow-xl cursor-pointer"
            >
              Apply For Leave 
              <HiOutlineArrowRight strokeWidth={3} className="group-hover:translate-x-2 transition-transform" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
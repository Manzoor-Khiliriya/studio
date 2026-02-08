import React from "react";
import {
  HiOutlineCalendar,
  HiOutlineSparkles,
  HiOutlineArrowRight,
  HiOutlineFire,
} from "react-icons/hi2";
import { useNavigate } from "react-router-dom";
import { useGetHolidaysQuery } from "../services/holidayApi";
import Loader from "../components/Loader";
import Table from "../components/Table";

export default function EmployeeHolidayPage() {
  const navigate = useNavigate();
  const { data: holidays = [], isLoading } = useGetHolidaysQuery();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Filter & Sort
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
          <div className="flex items-center gap-4 py-2">
            <div className="flex flex-col items-center justify-center bg-slate-900 text-white w-12 h-12 rounded-xl shadow-lg shadow-slate-200">
              <span className="text-xs font-black leading-none uppercase">{d.toLocaleDateString('en-US', { month: 'short' })}</span>
              <span className="text-lg font-black leading-none">{d.getDate()}</span>
            </div>
            <div>
              <p className="font-black text-slate-900 text-sm uppercase tracking-tight">
                {d.toLocaleDateString("en-US", { weekday: "long" })}
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Scheduled Break
              </p>
            </div>
          </div>
        );
      },
    },
    {
      header: "Holiday Name",
      render: (h) => (
        <span className="font-black text-slate-900 text-sm uppercase tracking-tight group-hover:text-orange-600 transition-colors">
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
        const isLongWeekend = [1, 5].includes(day); // Mon or Fri
        return isLongWeekend ? (
          <span className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-[9px] font-black uppercase border border-orange-100 animate-pulse">
            <HiOutlineFire size={12} /> Long Weekend
          </span>
        ) : (
          <span className="text-slate-300 text-[10px] font-bold">—</span>
        );
      },
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
    <div className="max-w-[1500px] mx-auto pb-32 px-8 pt-12">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
        <div>
          <div className="flex items-center gap-4 mb-3">
            <div className="w-2 h-10 bg-orange-500 rounded-full shadow-[0_0_15px_rgba(249,115,22,0.3)]" />
            <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase">
              Holiday <span className="text-slate-300">Registry</span>
            </h1>
          </div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <HiOutlineCalendar className="text-orange-500 text-lg" />
            Upcoming Operational Downtime
          </p>
        </div>
      </div>

      {/* REUSABLE TABLE CONTAINER */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden group/table">
        <Table
          columns={columns}
          data={upcomingHolidays}
          emptyMessage="No upcoming holidays detected in current cycle."
        />
      </div>

      {/* STRATEGY CARD */}
      <div className="mt-16 p-10 bg-slate-900 rounded-[3rem] relative overflow-hidden group shadow-2xl shadow-slate-200">
        {/* Decorative Background Pattern */}
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]" />
        
        <div className="relative flex flex-col md:flex-row items-center gap-8">
          <div className="p-5 bg-orange-500 rounded-[1.5rem] text-white shadow-xl shadow-orange-500/20">
            <HiOutlineSparkles size={40} />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="font-black text-white text-2xl mb-2 uppercase tracking-tight">
              Optimize Your Recovery
            </h3>
            <p className="text-slate-400 text-sm font-bold max-w-lg">
              Coordinate your leave requests with the <span className="text-orange-500">Long Weekend</span> indicators to maximize break duration without depleting your leave balance.
            </p>
          </div>
          <button 
            onClick={() => navigate("/my-leaves")}
            className="flex items-center gap-3 bg-orange-500 text-white px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-orange-600 transition-all active:scale-95 shadow-xl cursor-pointer"
          >
            Apply Leave <HiOutlineArrowRight strokeWidth={3} />
          </button>
        </div>
      </div>
    </div>
  );
}
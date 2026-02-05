import React from "react";
import {
  HiOutlineCalendar,
  HiOutlineSparkles,
  HiOutlineArrowRight,
} from "react-icons/hi2";
import { useGetHolidaysQuery } from "../services/holidayApi";
import Loader from "../components/Loader";
import Table from "../components/Table";

export default function EmployeeHolidayPage() {
  const { data: holidays = [], isLoading } = useGetHolidaysQuery();

  // ✅ Normalize today's date
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // ✅ Only future holidays, sorted nearest first
  const upcomingHolidays = holidays
    .filter((h) => new Date(h.date) >= today)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (isLoading) return <Loader message="Synchronizing Calendar..." />;

  const columns = [
    {
      header: "Holiday",
      render: (h) => <span className="font-bold">{h.name}</span>,
    },
    {
      header: "Date",
      render: (h) =>
        new Date(h.date).toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
    },
    {
      header: "Day",
      render: (h) =>
        new Date(h.date).toLocaleDateString("en-US", { weekday: "long" }),
    },
    {
      header: "Long Weekend",
      render: (h) => {
        const day = new Date(h.date).getDay();
        return [1, 5].includes(day) ? "Yes ⭐" : "—";
      },
    },
    {
      header: "Notes",
      render: (h) => h.description || "—",
      className: "w-[30%]",
    },
  ];

  return (
    <div className="max-w-[1400px] mx-auto pb-32 px-8 pt-12">

      {/* HEADER */}
      <div className="mb-14 text-center md:text-left">
        <h1 className="text-6xl font-black text-slate-900 tracking-tight">
          Holiday Registry
        </h1>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-4 flex items-center justify-center md:justify-start gap-2">
          <HiOutlineCalendar className="text-orange-500" />
          Upcoming Public Holidays
        </p>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6">
        <Table
          columns={columns}
          data={upcomingHolidays}
          emptyMessage="No upcoming holidays"
        />
      </div>

      {/* STRATEGY CARD */}
      <div className="mt-20 p-10 bg-white rounded-3xl border border-slate-100 shadow-xl flex flex-col md:flex-row items-center gap-8">
        <div className="p-5 bg-orange-500 rounded-2xl text-white">
          <HiOutlineSparkles size={36} />
        </div>
        <div className="flex-1">
          <h3 className="font-black text-slate-900 text-xl mb-2">
            Maximize Your Time Off
          </h3>
          <p className="text-sm text-slate-500">
            Plan your leave around long weekends to extend breaks while using
            fewer leave days.
          </p>
        </div>
        <button className="flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-xl font-bold text-sm">
          Apply Leave <HiOutlineArrowRight />
        </button>
      </div>

    </div>
  );
}

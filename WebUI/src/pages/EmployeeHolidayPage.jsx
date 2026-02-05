import React from 'react';
import {
  HiOutlineCalendar,
  HiOutlineFlag,
  HiOutlineSun,
  HiOutlineSparkles,
  HiOutlineArrowRight
} from 'react-icons/hi2';
import { useGetHolidaysQuery } from '../services/holidayApi';
import Loader from "../components/Loader";

export default function EmployeeHolidayPage() {
  const { data: holidays = [], isLoading } = useGetHolidaysQuery();

  // FILTER: Only show holidays that haven't passed yet
  // SORT: Closest date first

  const upcomingHolidays = [...holidays]
    .filter(h => new Date(h.date) >= new Date().setHours(0, 0, 0, 0))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  console.log(upcomingHolidays, holidays);


  if (isLoading) return <Loader message="Synchronizing Calendar..." />;

  return (
    <div className="max-w-[1400px] mx-auto pb-32 px-8 pt-12">

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-16">
        <div className="text-center md:text-left">
          <h1 className="text-8xl font-black text-slate-900 tracking-tighter uppercase leading-[0.8] italic">Registry</h1>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mt-6 flex items-center justify-center md:justify-start gap-2">
            <HiOutlineCalendar className="text-orange-500" /> Operational Downtime & Public Observances
          </p>
        </div>

        <div className="bg-slate-50 px-8 py-4 rounded-2xl border border-slate-100 hidden xl:block">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Status</p>
          <p className="text-xs font-black text-slate-900 uppercase italic">Calendar Verified • {upcomingHolidays.length} Events Pending</p>
        </div>
      </div>

      {holidays.length === 0 ? (
        <div className="bg-white rounded-[4rem] p-32 text-center border-4 border-dashed border-slate-50 shadow-sm">
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8">
            <HiOutlineSun size={48} className="text-slate-200 animate-spin-slow" />
          </div>
          <p className="text-sm font-black text-slate-300 uppercase tracking-[0.5em]">The Registry is currently empty</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {holidays.map((holiday, index) => {
            const hDate = new Date(holiday.date);
            const dayOfWeek = hDate.getDay();
            // Long Weekend = Monday (1) or Friday (5)
            const isLongWeekend = [1, 5].includes(dayOfWeek);

            return (
              <div
                key={holiday._id}
                className={`relative group p-10 rounded-[3.5rem] border-2 transition-all duration-500 overflow-hidden ${index === 0
                    ? 'bg-slate-900 border-slate-900 text-white shadow-3xl xl:scale-105 z-10'
                    : 'bg-white border-slate-100 text-slate-800 hover:border-orange-500/30 hover:shadow-2xl hover:-translate-y-2'
                  }`}
              >
                {/* Visual Accent for the "Featured" next holiday */}
                {index === 0 && (
                  <div className="absolute top-0 right-0 p-8">
                    <div className="bg-orange-500 text-[9px] font-black px-4 py-2 rounded-xl uppercase tracking-widest shadow-lg shadow-orange-500/20">
                      Next Event
                    </div>
                  </div>
                )}

                {/* Long Weekend Indicator */}
                {isLongWeekend && (
                  <div className="absolute bottom-10 right-10 flex items-center gap-2 bg-emerald-500/10 text-emerald-500 text-[9px] font-black px-4 py-2 rounded-full uppercase tracking-[0.2em] border border-emerald-500/20">
                    <HiOutlineSparkles /> Long Weekend
                  </div>
                )}

                <div className="flex flex-col h-full relative z-10">
                  {/* DATE BOX */}
                  <div className={`w-16 h-20 rounded-[1.5rem] flex flex-col items-center justify-center font-black mb-10 shadow-lg ${index === 0 ? 'bg-orange-500 text-white shadow-orange-500/20' : 'bg-slate-900 text-white'
                    }`}>
                    <span className="text-[10px] uppercase tracking-tighter opacity-80">{hDate.toLocaleString('default', { month: 'short' })}</span>
                    <span className="text-2xl tabular-nums">{hDate.getDate()}</span>
                  </div>

                  <h3 className={`font-black uppercase text-2xl leading-tight mb-3 tracking-tighter ${index === 0 ? 'text-white' : 'text-slate-900'}`}>
                    {holiday.name}
                  </h3>

                  <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest mb-6 ${index === 0 ? 'text-orange-500' : 'text-slate-400'
                    }`}>
                    <HiOutlineCalendar size={14} />
                    {hDate.toLocaleDateString('en-US', { weekday: 'long' })}
                  </div>

                  {holiday.description ? (
                    <p className={`text-[11px] font-bold leading-relaxed uppercase tracking-wider border-t pt-6 ${index === 0 ? 'border-white/10 text-slate-400' : 'border-slate-50 text-slate-400'
                      }`}>
                      {holiday.description}
                    </p>
                  ) : (
                    <div className={`pt-6 border-t italic text-[10px] font-black uppercase tracking-[0.3em] ${index === 0 ? 'border-white/10 text-slate-700' : 'border-slate-50 text-slate-200'
                      }`}>
                      No Intel Provided
                    </div>
                  )}
                </div>

                {/* Decorative Background Icon */}
                <HiOutlineFlag className={`absolute -bottom-6 -right-6 opacity-5 pointer-events-none transition-transform duration-700 group-hover:scale-110 group-hover:rotate-12 ${index === 0 ? 'text-white' : 'text-slate-900'
                  }`} size={160} />
              </div>
            );
          })}
        </div>
      )}

      {/* STRATEGIC PLANNING TIP */}
      <div className="mt-20 p-12 bg-white rounded-[4rem] border border-slate-100 shadow-2xl flex flex-col xl:flex-row items-center gap-10 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50" />

        <div className="p-6 bg-slate-900 rounded-[2rem] text-orange-500 shadow-xl relative z-10 group-hover:bg-orange-500 group-hover:text-white transition-colors duration-500">
          <HiOutlineSparkles size={40} />
        </div>

        <div className="relative z-10 flex-1">
          <h4 className="font-black text-slate-900 uppercase text-xl italic tracking-tighter mb-2">Strategy: Maximize Downtime</h4>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider leading-relaxed max-w-2xl">
            Combine your <b>Annual Leave</b> requests with "Long Weekend" holidays (noted above).
            By placing requests strategically around these dates, you can secure extended breaks while preserving your balance for later cycles.
          </p>
        </div>

        <button className="relative z-10 flex items-center gap-3 bg-orange-500 hover:bg-slate-900 text-white px-10 py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl shadow-orange-500/20">
          Apply Now <HiOutlineArrowRight />
        </button>
      </div>
    </div>
  );
}
import React from 'react';
import { HiOutlineCalendar, HiOutlineFlag, HiOutlineSun, HiOutlineSparkles } from 'react-icons/hi2';
import { useGetHolidaysQuery } from '../services/holidayApi';
import Loader from "../components/Loader";

export default function EmployeeHolidayPage() {
  const { data: holidays = [], isLoading } = useGetHolidaysQuery();

  // Sort and filter for future holidays
  const upcomingHolidays = [...holidays]
    .filter(h => new Date(h.date) >= new Date().setHours(0,0,0,0))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (isLoading) return <Loader message="Opening Calendar..." />;

  return (
    <div className="max-w-[1200px] mx-auto pb-20 px-6">
      <div className="mb-10 mt-10 text-center md:text-left">
        <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase mb-2 italic">Public Calendar</h1>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
          Plan your downtime • Official Company Holidays
        </p>
      </div>

      {upcomingHolidays.length === 0 ? (
        <div className="bg-white rounded-[3rem] p-20 text-center border-2 border-dashed border-slate-100">
           <HiOutlineSun size={48} className="mx-auto text-slate-200 mb-4 animate-spin-slow" />
           <p className="text-xs font-black text-slate-400 uppercase">No upcoming holidays scheduled.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {upcomingHolidays.map((holiday, index) => {
            const hDate = new Date(holiday.date);
            const isLongWeekend = [1, 5].includes(hDate.getDay()); // Monday (1) or Friday (5)

            return (
              <div 
                key={holiday._id}
                className={`relative group p-8 rounded-[2.5rem] border-2 transition-all duration-300 ${
                    index === 0 
                    ? 'bg-slate-900 border-slate-900 text-white shadow-2xl scale-105 z-10' 
                    : 'bg-white border-slate-50 text-slate-800 hover:border-orange-200 shadow-sm'
                }`}
              >
                {/* Long Weekend Badge */}
                {isLongWeekend && (
                    <div className="absolute top-6 right-6 flex items-center gap-1 bg-orange-500 text-white text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest animate-bounce">
                        <HiOutlineSparkles /> Long Weekend
                    </div>
                )}

                <div className="flex flex-col h-full">
                  <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black mb-6 ${
                    index === 0 ? 'bg-orange-500 text-white' : 'bg-orange-50 text-orange-600'
                  }`}>
                    <span className="text-[10px] uppercase">{hDate.toLocaleString('default', { month: 'short' })}</span>
                    <span className="text-xl">{hDate.getDate()}</span>
                  </div>

                  <h3 className="font-black uppercase text-lg leading-tight mb-2 tracking-tight">
                    {holiday.name}
                  </h3>
                  
                  <div className={`flex items-center gap-2 text-[10px] font-bold uppercase mb-4 ${
                    index === 0 ? 'text-slate-400' : 'text-slate-400'
                  }`}>
                    <HiOutlineCalendar size={14} />
                    {hDate.toLocaleDateString('en-US', { weekday: 'long' })}
                  </div>

                  {holiday.description && (
                    <p className={`text-[10px] font-medium leading-relaxed italic border-t pt-4 ${
                        index === 0 ? 'border-slate-800 text-slate-500' : 'border-slate-50 text-slate-400'
                    }`}>
                        "{holiday.description}"
                    </p>
                  )}
                </div>

                {/* Decorative Icon */}
                <HiOutlineFlag className={`absolute -bottom-4 -right-4 opacity-10 ${
                    index === 0 ? 'text-white' : 'text-orange-500'
                }`} size={100} />
              </div>
            );
          })}
        </div>
      )}

      {/* Planning Tip */}
      <div className="mt-12 p-8 bg-orange-50 rounded-[2.5rem] border border-orange-100 flex flex-col md:flex-row items-center gap-6">
        <div className="p-4 bg-white rounded-2xl text-orange-600 shadow-sm">
            <HiOutlineSparkles size={32} />
        </div>
        <div>
            <h4 className="font-black text-slate-900 uppercase text-sm italic">Pro Planning Tip</h4>
            <p className="text-xs text-slate-600 font-medium">
                Want to extend your break? Use your <b>Annual Leave</b> around "Long Weekend" holidays to get 5+ days off while only using 1 or 2 days of your balance!
            </p>
        </div>
      </div>
    </div>
  );
}
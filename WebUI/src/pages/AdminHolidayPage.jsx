import React, { useState } from 'react';
import { 
  HiOutlineCalendar, 
  HiOutlineTrash, 
  HiOutlinePlusCircle, 
  HiOutlineInformationCircle,
  HiOutlineFlag,
  HiOutlineGlobeAlt
} from 'react-icons/hi';
import { toast, Toaster } from 'react-hot-toast';

import { 
  useGetHolidaysQuery, 
  useAddHolidayMutation, 
  useDeleteHolidayMutation 
} from '../services/holidayApi'; 

import Loader from "../components/Loader";

export default function AdminHolidayPage() {
  const [formData, setFormData] = useState({ name: "", date: "", description: "" });
  
  // --- DATA ACQUISITION ---
  const { data: holidays = [], isLoading, isFetching } = useGetHolidaysQuery();
  const [addHoliday, { isLoading: isAdding }] = useAddHolidayMutation();
  const [deleteHoliday] = useDeleteHolidayMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.date) return toast.error("Deployment requires both a Title and Date.");

    const loadingToast = toast.loading("Injecting calendar event...");
    try {
      await addHoliday(formData).unwrap();
      toast.success(`${formData.name} is now Operational`, { id: loadingToast });
      setFormData({ name: "", date: "", description: "" });
    } catch (err) {
      toast.error(err?.data?.message || "Protocol Interrupted", { id: loadingToast });
    }
  };

  const handleDelete = async (id) => {
    // Custom non-blocking style confirmation could be implemented, but using window for safety
    if (!window.confirm("CRITICAL: Deleting this holiday will trigger a recalculation of all pending leave balances. Proceed?")) return;
    
    const loadingToast = toast.loading("Purging holiday data...");
    try {
      await deleteHoliday(id).unwrap();
      toast.success("Event removed from global registry", { id: loadingToast });
    } catch {
      toast.error("Deletion failed", { id: loadingToast });
    }
  };

  if (isLoading) return <Loader message="Synchronizing Public Holidays..." />;

  return (
    <div className="max-w-[1600px] mx-auto pb-24 px-8 pt-10">
      <Toaster position="bottom-right" />
      
      {/* HEADER COMMAND */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div>
          <h1 className="text-7xl font-black text-slate-900 tracking-tighter uppercase leading-none">Holidays</h1>
          <div className="flex items-center gap-3 mt-4">
            <span className="bg-orange-500 text-white text-[10px] font-black px-4 py-1.5 rounded-lg uppercase tracking-[0.3em] italic">
              Calendar Control
            </span>
            {isFetching && (
              <span className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase animate-pulse">
                <div className="w-2 h-2 bg-slate-900 rounded-full" /> Syncing Registry...
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
        
        {/* SIDEBAR: EVENT INJECTION FORM */}
        <div className="xl:col-span-4">
          <div className="p-10 rounded-[3.5rem] bg-slate-900 text-white shadow-2xl sticky top-10 border-b-[12px] border-orange-500 overflow-hidden relative">
            {/* Visual Flare */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
            
            <div className="flex items-center gap-4 mb-10 relative z-10">
                <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                    <HiOutlinePlusCircle size={24} className="text-orange-500" />
                </div>
                <h3 className="font-black text-2xl uppercase tracking-tighter">Register Event</h3>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 ml-2 tracking-widest">Holiday Title</label>
                <input 
                  type="text"
                  placeholder="e.g. Lunar New Year"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-slate-800/50 border-2 border-transparent focus:border-orange-500/50 rounded-2xl py-5 px-6 text-sm font-bold outline-none transition-all placeholder:text-slate-600"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 ml-2 tracking-widest">Effective Date</label>
                <div className="relative">
                    <HiOutlineCalendar className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-600" size={20} />
                    <input 
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full bg-slate-800/50 border-2 border-transparent focus:border-orange-500/50 rounded-2xl py-5 px-6 text-sm font-black outline-none transition-all"
                    />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 ml-2 tracking-widest">Mission Notes</label>
                <textarea 
                  placeholder="Brief context for the closure..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-slate-800/50 border-2 border-transparent focus:border-orange-500/50 rounded-2xl py-5 px-6 text-sm font-bold outline-none transition-all h-28 resize-none placeholder:text-slate-600"
                />
              </div>

              <button 
                type="submit"
                disabled={isAdding}
                className="group w-full bg-orange-500 hover:bg-white hover:text-slate-900 text-white font-black py-6 rounded-[2rem] text-xs uppercase tracking-[0.3em] transition-all shadow-xl shadow-orange-500/20 disabled:opacity-50 mt-4 flex items-center justify-center gap-3"
              >
                {isAdding ? "UPDATING REGISTRY..." : (
                    <>
                        <HiOutlineGlobeAlt className="text-xl group-hover:rotate-180 transition-transform duration-700" />
                        COMMIT TO CALENDAR
                    </>
                )}
              </button>
            </form>

            <div className="mt-10 p-6 bg-white/5 rounded-[2rem] border border-white/5 relative z-10">
                <div className="flex gap-4">
                    <HiOutlineInformationCircle className="text-orange-500 shrink-0" size={24} />
                    <p className="text-[10px] text-slate-400 font-bold uppercase leading-relaxed tracking-wider">
                        Events registered here are immutable for leave logic. The system ignores these dates when calculating "Working Days."
                    </p>
                </div>
            </div>
          </div>
        </div>

        {/* MAIN HUB: VISUAL CALENDAR CARDS */}
        <div className="xl:col-span-8">
          {holidays.length === 0 ? (
            <div className="py-32 text-center bg-white rounded-[4rem] border-4 border-dashed border-slate-100 flex flex-col items-center">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                 <HiOutlineCalendar size={40} className="text-slate-200" />
              </div>
              <p className="text-sm font-black text-slate-300 uppercase tracking-[0.5em]">Calendar Registry Empty</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {holidays.map((holiday) => (
                <div 
                  key={holiday._id}
                  className="group bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:border-orange-500/20 hover:-translate-y-2 transition-all duration-500 relative overflow-hidden"
                >
                  <div className="flex justify-between items-start mb-8 relative z-10">
                    <div className="flex flex-col gap-1">
                        <div className="p-4 bg-slate-900 text-orange-500 rounded-2xl w-fit shadow-lg shadow-slate-900/10 group-hover:bg-orange-500 group-hover:text-white transition-all duration-500">
                        <HiOutlineFlag size={28} />
                        </div>
                    </div>
                    <button 
                      onClick={() => handleDelete(holiday._id)}
                      className="p-3 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                    >
                      <HiOutlineTrash size={24} />
                    </button>
                  </div>

                  <div className="relative z-10">
                    <h4 className="font-black text-slate-900 uppercase text-2xl tracking-tighter mb-2 group-hover:text-orange-600 transition-colors">
                        {holiday.name}
                    </h4>
                    
                    <div className="flex items-center gap-3 text-slate-400 mb-6">
                        <HiOutlineCalendar size={18} className="text-orange-500" />
                        <span className="text-xs font-black uppercase tracking-[0.1em]">
                        {new Date(holiday.date).toLocaleDateString('en-US', { 
                            weekday: 'long',
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                        })}
                        </span>
                    </div>

                    {holiday.description ? (
                        <p className="text-[11px] text-slate-500 font-bold uppercase leading-relaxed line-clamp-2 pt-6 border-t border-slate-50">
                        {holiday.description}
                        </p>
                    ) : (
                        <div className="pt-6 border-t border-slate-50 italic text-[10px] text-slate-300 font-black uppercase tracking-widest">
                            No additional intel provided
                        </div>
                    )}
                  </div>

                  {/* LARGE BACKGROUND ICON */}
                  <div className="absolute -right-8 -bottom-8 text-slate-50 group-hover:text-orange-50/40 transition-all duration-700 pointer-events-none">
                    <HiOutlineFlag size={180} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
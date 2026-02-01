import React, { useState } from 'react';
import { 
  HiOutlineCalendar, 
  HiOutlineTrash, 
  HiOutlinePlusCircle, 
  HiOutlineInformationCircle,
  HiOutlineFlag
} from 'react-icons/hi';
import { toast, Toaster } from 'react-hot-toast';

// IMPORT FROM YOUR NEW SPLIT API FILE
import { 
  useGetHolidaysQuery, 
  useAddHolidayMutation, 
  useDeleteHolidayMutation 
} from '../services/holidayApi'; 

import Loader from "../components/Loader";

export default function AdminHolidayPage() {
  const [formData, setFormData] = useState({ name: "", date: "", description: "" });
  
  // RTK Query hooks
  const { data: holidays = [], isLoading, isFetching } = useGetHolidaysQuery();
  const [addHoliday, { isLoading: isAdding }] = useAddHolidayMutation();
  const [deleteHoliday] = useDeleteHolidayMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.date) return toast.error("Name and Date are required");

    try {
      await addHoliday(formData).unwrap();
      toast.success(`${formData.name} registered successfully`);
      setFormData({ name: "", date: "", description: "" });
    } catch (err) {
      toast.error(err?.data?.message || "Failed to add holiday");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this holiday? This will re-calculate leave balances.")) return;
    try {
      await deleteHoliday(id).unwrap();
      toast.success("Holiday purged from registry");
    } catch {
      toast.error("Failed to delete holiday");
    }
  };

  if (isLoading) return <Loader message="Fetching Public Calendar..." />;

  return (
    <div className="max-w-[1600px] mx-auto pb-20 px-6">
      <Toaster position="top-right" />
      
      {/* Header Section */}
      <div className="mb-10 mt-10">
        <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase mb-2 italic">Holidays</h1>
        <div className="flex items-center gap-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                System Policy & Calendar Control
            </p>
            {isFetching && <span className="w-2 h-2 bg-orange-500 rounded-full animate-ping" />}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* SIDEBAR: Registration Form */}
        <div className="lg:col-span-4">
          <div className="p-8 rounded-[3rem] bg-slate-900 text-white shadow-2xl sticky top-8 border-b-8 border-orange-500">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-orange-500 rounded-2xl shadow-lg shadow-orange-500/30">
                    <HiOutlinePlusCircle size={24} className="text-white" />
                </div>
                <h3 className="font-black text-xl uppercase italic tracking-tight">Register New</h3>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-[9px] font-black uppercase text-slate-500 ml-2 tracking-widest">Holiday Title</label>
                <input 
                  type="text"
                  placeholder="e.g. Independence Day"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-slate-800 rounded-2xl py-4 px-6 text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500 transition-all border-none mt-1 placeholder:text-slate-600"
                />
              </div>

              <div>
                <label className="text-[9px] font-black uppercase text-slate-500 ml-2 tracking-widest">Effective Date</label>
                <input 
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full bg-slate-800 rounded-2xl py-4 px-6 text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500 transition-all border-none mt-1"
                />
              </div>

              <div>
                <label className="text-[9px] font-black uppercase text-slate-500 ml-2 tracking-widest">Notes (Optional)</label>
                <textarea 
                  placeholder="Brief description..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-slate-800 rounded-2xl py-4 px-6 text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500 transition-all border-none mt-1 h-24 resize-none placeholder:text-slate-600"
                />
              </div>

              <button 
                type="submit"
                disabled={isAdding}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-4 rounded-2xl text-xs uppercase transition-all shadow-xl shadow-orange-500/20 disabled:opacity-50 mt-4 active:scale-95"
              >
                {isAdding ? "Processing..." : "Commit to Calendar"}
              </button>
            </form>

            <div className="mt-8 p-5 bg-slate-800/40 rounded-[2rem] border border-slate-700/50">
                <div className="flex gap-3">
                    <HiOutlineInformationCircle className="text-orange-500 shrink-0" size={20} />
                    <p className="text-[9px] text-slate-400 font-bold uppercase leading-relaxed tracking-wider">
                        Registered dates are automatically excluded from working day calculations in leave requests.
                    </p>
                </div>
            </div>
          </div>
        </div>

        {/* MAIN: Holiday Cards */}
        <div className="lg:col-span-8">
          {holidays.length === 0 ? (
            <div className="py-24 text-center bg-white rounded-[4rem] border-4 border-dashed border-slate-50">
              <HiOutlineCalendar size={60} className="mx-auto text-slate-100 mb-4" />
              <p className="text-xs font-black text-slate-300 uppercase tracking-[0.4em]">Empty Registry</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {holidays.map((holiday) => (
                <div 
                  key={holiday._id}
                  className="group bg-white p-8 rounded-[3rem] border-2 border-slate-50 shadow-sm hover:shadow-2xl hover:border-orange-100 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-4 bg-orange-50 text-orange-600 rounded-[1.5rem] group-hover:bg-orange-500 group-hover:text-white transition-colors duration-300 shadow-sm">
                      <HiOutlineFlag size={24} />
                    </div>
                    <button 
                      onClick={() => handleDelete(holiday._id)}
                      className="p-2 text-slate-200 hover:text-rose-500 transition-colors"
                      title="Remove Holiday"
                    >
                      <HiOutlineTrash size={22} />
                    </button>
                  </div>

                  <h4 className="font-black text-slate-800 uppercase text-xl tracking-tight mb-2">
                    {holiday.name}
                  </h4>
                  
                  <div className="flex items-center gap-2 text-orange-600 mb-4">
                    <HiOutlineCalendar size={16} />
                    <span className="text-[12px] font-black uppercase tracking-widest">
                      {new Date(holiday.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </span>
                  </div>

                  {holiday.description && (
                    <p className="text-[10px] text-slate-400 font-bold uppercase leading-relaxed line-clamp-2 border-t border-slate-50 pt-4">
                      {holiday.description}
                    </p>
                  )}

                  {/* Decorative Background Element */}
                  <div className="absolute -right-6 -bottom-6 text-slate-50/50 group-hover:text-orange-50/50 transition-colors">
                    <HiOutlineFlag size={120} />
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
import React, { useState } from 'react';
import { 
  HiOutlineSearch, HiOutlineShieldCheck, HiOutlineCheckCircle, 
  HiOutlineXCircle, HiOutlineClock, HiOutlineUserGroup 
} from 'react-icons/hi';
import { toast, Toaster } from 'react-hot-toast';
import { useGetAllLeavesQuery, useProcessLeaveMutation } from '../services/leaveApi';

import Table from "../components/Table";
import Loader from "../components/Loader";

export default function AdminLeavePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // --- DATA ACQUISITION ---
  const { data: requests = [], isLoading, isFetching } = useGetAllLeavesQuery({
    search: searchQuery,
    status: statusFilter
  });

  const [processLeave] = useProcessLeaveMutation();

  const handleStatusUpdate = async (id, newStatus) => {
    const toastId = toast.loading(`Updating registry to ${newStatus}...`);
    try {
      await processLeave({ id, status: newStatus }).unwrap();
      toast.success(`Request successfully ${newStatus}`, { id: toastId });
    } catch (err) {
      toast.error(err.data?.message || "Registry update failed", { id: toastId });
    }
  };

  const columns = [
    {
      header: "Employee / Classification",
      render: (req) => (
        <div className="flex items-center gap-4 py-2">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs">
            {req.user?.name?.charAt(0)}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <p className="font-black text-slate-900 uppercase text-sm tracking-tight">{req.user?.name}</p>
              <span className="bg-orange-50 text-orange-600 text-[8px] font-black px-2 py-0.5 rounded-md border border-orange-100 uppercase tracking-tighter">
                {req.employeeBalance || 0}D Remaining
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{req.type}</p>
          </div>
        </div>
      )
    },
    {
      header: "Operational Absence",
      render: (req) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-xs font-black text-slate-700 uppercase">
            <HiOutlineClock className="text-orange-500" /> {req.businessDays} Working Days
          </div>
          <p className="text-[10px] text-slate-400 font-bold mt-0.5">
            {new Date(req.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {new Date(req.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      )
    },
    {
      header: "Registry Status",
      className: "text-center",
      render: (req) => <StatusBadge status={req.status} />
    },
    {
      header: "Command Action",
      className: "text-right pr-10",
      render: (req) => (
        <div className="flex justify-end gap-3">
          {req.status === 'Pending' ? (
            <>
              <button
                onClick={() => handleStatusUpdate(req._id, 'Approved')}
                className="group flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-emerald-100"
              >
                <HiOutlineCheckCircle size={18} className="group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black uppercase">Approve</span>
              </button>
              <button
                onClick={() => handleStatusUpdate(req._id, 'Rejected')}
                className="group flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm border border-rose-100"
              >
                <HiOutlineXCircle size={18} className="group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black uppercase">Reject</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2 opacity-40 grayscale italic">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Archived Log</span>
            </div>
          )}
        </div>
      )
    }
  ];

  if (isLoading) return <Loader message="Decrypting Attendance Logs..." />;

  return (
    <div className="max-w-[1600px] mx-auto pb-24 px-8 pt-10">
      <Toaster position="bottom-right" />
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div>
          <h1 className="text-7xl font-black text-slate-900 tracking-tighter uppercase leading-none">Attendance</h1>
          <div className="flex items-center gap-3 mt-4">
            <span className="bg-slate-900 text-white text-[10px] font-black px-4 py-1.5 rounded-lg uppercase tracking-[0.3em]">
              Central Registry
            </span>
            {isFetching && (
              <span className="flex items-center gap-2 text-orange-600 text-[10px] font-black uppercase animate-pulse">
                <div className="w-2 h-2 bg-orange-500 rounded-full" /> Syncing Data...
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
        
        {/* SIDEBAR INTEL */}
        <div className="xl:col-span-3 space-y-6">
          <div className="p-10 rounded-[3.5rem] bg-slate-900 text-white shadow-2xl sticky top-10 relative overflow-hidden group">
            <HiOutlineShieldCheck size={40} className="text-orange-500 mb-6 relative z-10" />
            <h3 className="font-black text-2xl uppercase tracking-tighter mb-3 relative z-10">Protocol Management</h3>
            <p className="text-[11px] text-slate-400 font-bold leading-relaxed uppercase tracking-widest relative z-10">
              Authorized personnel only. Every decision is logged to the immutable attendance ledger.
            </p>
            <div className="mt-8 pt-8 border-t border-white/10 relative z-10">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-black text-slate-500 uppercase">Pending Review</span>
                    <span className="text-xl font-black text-orange-500">{requests.filter(r => r.status === 'Pending').length}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-500 uppercase">Total Logged</span>
                    <span className="text-xl font-black text-white">{requests.length}</span>
                </div>
            </div>
            {/* Background Decoration */}
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-orange-600/10 rounded-full blur-3xl group-hover:bg-orange-600/20 transition-all duration-700" />
          </div>
        </div>

        {/* DATA HUB */}
        <div className="xl:col-span-9 space-y-8">
          
          {/* FILTER TERMINAL */}
          <div className="flex flex-col lg:flex-row gap-4 bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
            <div className="relative flex-1 group">
              <HiOutlineSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-500 transition-colors" size={20} />
              <input
                placeholder="Search Operator Name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border-2 border-transparent focus:border-orange-500/10 focus:bg-white rounded-[1.5rem] py-5 pl-16 pr-8 text-sm font-bold outline-none transition-all"
              />
            </div>
            
            <div className="flex gap-2">
                <div className="flex items-center gap-3 px-6 bg-slate-50 rounded-[1.5rem] border border-slate-100">
                    <HiOutlineUserGroup className="text-slate-400" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-transparent text-[11px] font-black uppercase outline-none cursor-pointer py-5"
                    >
                        <option value="All">All Categories</option>
                        <option value="Pending">Pending Review</option>
                        <option value="Approved">Authorized</option>
                        <option value="Rejected">Declined</option>
                    </select>
                </div>
            </div>
          </div>

          {/* TABLE CONTAINER */}
          <div className={`bg-white rounded-[4rem] border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden min-h-[600px] transition-all duration-500 ${isFetching ? 'opacity-50 scale-[0.99] grayscale' : 'opacity-100 scale-100'}`}>
            <Table 
                columns={columns} 
                data={requests} 
                emptyMessage="No operational absence records found in the current sector." 
            />
          </div>
        </div>
      </div>
    </div>
  );
}

const StatusBadge = ({ status }) => {
  const styles = { 
    Pending: "bg-orange-50 text-orange-600 border-orange-100 shadow-orange-100/50", 
    Approved: "bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-100/50", 
    Rejected: "bg-rose-50 text-rose-600 border-rose-100 shadow-rose-100/50" 
  };
  
  return (
    <span className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border-2 shadow-sm ${styles[status]}`}>
      {status === 'Approved' && 'Authorized'}
      {status === 'Rejected' && 'Declined'}
      {status === 'Pending' && 'Under Review'}
    </span>
  );
};
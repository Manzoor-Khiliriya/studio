import React, { useState } from 'react';
import { 
  HiOutlineSearch, HiOutlineShieldCheck, HiOutlineCheckCircle, 
  HiOutlineXCircle, HiOutlineClock, HiOutlineUserGroup,
  HiOutlineCalendar
} from 'react-icons/hi';
import { toast, Toaster } from 'react-hot-toast';
import { useGetAllLeavesQuery, useProcessLeaveMutation } from '../services/leaveApi';

import Table from "../components/Table";
import Loader from "../components/Loader";
import Pagination from "../components/Pagination"; // Importing your component

export default function AdminLeavePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  
  // --- PAGINATION STATE ---
  const [page, setPage] = useState(1);
  const limit = 8;

  // --- DATA ACQUISITION ---
  const { data, isLoading, isFetching } = useGetAllLeavesQuery({
    search: searchQuery,
    status: statusFilter === "All" ? "" : statusFilter,
    page,
    limit
  });

  const [processLeave] = useProcessLeaveMutation();

  const leaves = data?.leaves || [];
  const paginationData = data?.pagination || { totalLeaves: 0, totalPages: 1 };

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
        <div className="flex items-center gap-4 py-2 group">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-sm shadow-lg group-hover:bg-orange-600 transition-colors duration-300 uppercase">
            {req.user?.name?.charAt(0)}
          </div>
          <div className="flex flex-col">
            <p className="font-black text-slate-900 uppercase text-sm tracking-tight">{req.user?.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.15em]">{req.type}</p>
            </div>
          </div>
        </div>
      )
    },
    {
      header: "Operational Absence",
      render: (req) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-xs font-black text-slate-700 uppercase tracking-tight">
            <HiOutlineClock className="text-orange-500" size={16} /> 
            <span>{req.businessDays || '—'} Working Days</span>
          </div>
          <div className="flex items-center gap-2 mt-1 italic">
            <HiOutlineCalendar className="text-slate-300" size={12} />
            <p className="text-[10px] text-slate-400 font-bold tracking-tighter tabular-nums">
              {new Date(req.startDate).toLocaleDateString()} — {new Date(req.endDate).toLocaleDateString()}
            </p>
          </div>
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
        <div className="flex justify-end gap-2">
          {req.status === 'Pending' ? (
            <>
              <button
                onClick={() => handleStatusUpdate(req._id, 'Approved')}
                className="group flex items-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-600 rounded-[1rem] hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100 active:scale-95"
              >
                <HiOutlineCheckCircle size={18} />
                <span className="text-[10px] font-black uppercase">Authorize</span>
              </button>
              <button
                onClick={() => handleStatusUpdate(req._id, 'Rejected')}
                className="group flex items-center gap-2 px-5 py-2.5 bg-rose-50 text-rose-600 rounded-[1rem] hover:bg-rose-600 hover:text-white transition-all border border-rose-100 active:scale-95"
              >
                <HiOutlineXCircle size={18} />
                <span className="text-[10px] font-black uppercase">Decline</span>
              </button>
            </>
          ) : (
            <div className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-100 opacity-60">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Closed Log</span>
            </div>
          )}
        </div>
      )
    }
  ];

  if (isLoading) return <Loader message="Accessing Attendance Matrix..." />;

  return (
    <div className="max-w-[1700px] mx-auto pb-24 px-8 pt-10">
      <Toaster position="bottom-right" />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-16">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-8 bg-orange-500 rounded-full" />
            <span className="text-slate-400 font-black text-xs uppercase tracking-[0.4em]">Administration Hub</span>
          </div>
          <h1 className="text-7xl font-black text-slate-900 tracking-tighter uppercase leading-none">Attendance</h1>
        </div>
        
        {isFetching && (
          <div className="flex items-center gap-3 px-6 py-3 bg-white rounded-2xl border border-slate-100 shadow-sm animate-pulse">
            <div className="w-2 h-2 bg-orange-500 rounded-full" />
            <span className="text-orange-600 text-[10px] font-black uppercase tracking-widest">Syncing Registry...</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
        {/* SIDEBAR */}
        <div className="xl:col-span-3 space-y-6">
          <div className="p-10 rounded-[3.5rem] bg-slate-900 text-white shadow-2xl sticky top-10 border border-slate-800">
            <HiOutlineShieldCheck size={44} className="text-orange-500 mb-8" />
            <h3 className="font-black text-2xl uppercase tracking-tighter mb-4">Protocol Control</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
              Global registry management for all organizational leave vectors.
            </p>
            
            <div className="mt-10 pt-8 border-t border-white/10 space-y-5">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Logs</span>
                <span className="text-orange-500 text-2xl font-black">{paginationData.totalLeaves}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Page Depth</span>
                <span className="text-white text-lg font-black">{paginationData.totalPages}</span>
              </div>
            </div>
          </div>
        </div>

        {/* DATA HUB */}
        <div className="xl:col-span-9 space-y-8">
          {/* SEARCH & FILTER BAR */}
          <div className="flex flex-col lg:flex-row gap-4 bg-white p-4 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40">
            <div className="relative flex-1 group">
              <HiOutlineSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-500" size={20} />
              <input
                placeholder="Search operator by name..."
                value={searchQuery}
                onChange={(e) => {setSearchQuery(e.target.value); setPage(1);}}
                className="w-full bg-slate-50 border-2 border-transparent focus:border-orange-500/10 focus:bg-white rounded-[1.8rem] py-5 pl-16 pr-8 text-sm font-bold outline-none transition-all shadow-inner"
              />
            </div>
            
            <div className="flex items-center gap-3 px-8 bg-slate-50 rounded-[1.8rem]">
              <HiOutlineUserGroup className="text-slate-400" size={18} />
              <select
                value={statusFilter}
                onChange={(e) => {setStatusFilter(e.target.value); setPage(1);}}
                className="bg-transparent text-[11px] font-black uppercase outline-none py-5 pr-4 text-slate-700 cursor-pointer"
              >
                <option value="All">All Categories</option>
                <option value="Pending">Under Review</option>
                <option value="Approved">Authorized</option>
                <option value="Rejected">Declined</option>
              </select>
            </div>
          </div>

          {/* TABLE & PAGINATION CONTAINER */}
          <div className={`bg-white rounded-[4rem] border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden transition-all duration-300 ${isFetching ? 'opacity-60 scale-[0.99]' : 'opacity-100'}`}>
            <Table 
              columns={columns} 
              data={leaves} 
              emptyMessage="No operational records found for this sector." 
            />
            
            {/* INTEGRATED YOUR PAGINATION COMPONENT */}
            <Pagination 
              pagination={{
                current: page,
                total: paginationData.totalPages,
                count: paginationData.totalLeaves
              }}
              onPageChange={(newPage) => setPage(newPage)}
              loading={isFetching}
              label="Records"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

const StatusBadge = ({ status }) => {
  const styles = { 
    Pending: "bg-orange-50 text-orange-600 border-orange-100", 
    Approved: "bg-emerald-50 text-emerald-600 border-emerald-100", 
    Rejected: "bg-rose-50 text-rose-600 border-rose-100" 
  };
  
  return (
    <span className={`px-6 py-2 rounded-2xl text-[9px] font-black uppercase tracking-[0.25em] border-2 shadow-sm inline-flex items-center gap-2 ${styles[status]}`}>
        <div className={`w-1.5 h-1.5 rounded-full ${status === 'Approved' ? 'bg-emerald-500' : status === 'Rejected' ? 'bg-rose-500' : 'bg-orange-500 animate-pulse'}`} />
        {status === 'Pending' ? 'Under Review' : status === 'Approved' ? 'Authorized' : 'Declined'}
    </span>
  );
};
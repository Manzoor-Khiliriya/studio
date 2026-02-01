import React, { useState } from 'react';
import { HiOutlineSearch, HiOutlineFilter, HiOutlineShieldCheck, HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineCalendar } from 'react-icons/hi';
import { toast, Toaster } from 'react-hot-toast';
import { useGetAllLeavesQuery, useProcessLeaveMutation } from '../services/leaveApi';

import Table from "../components/Table";
import Loader from "../components/Loader";

export default function AdminLeavePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // RTK Query: Re-fetches automatically when searchQuery or statusFilter changes
  const { data: requests = [], isLoading, isFetching } = useGetAllLeavesQuery({
    search: searchQuery,
    status: statusFilter
  });

  const [processLeave] = useProcessLeaveMutation();

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await processLeave({ id, status: newStatus }).unwrap();
      toast.success(`Request marked as ${newStatus}`);
    } catch {
      toast.error("Failed to process request");
    }
  };

  const columns = [
    {
      header: "Employee / Type",
      render: (req) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <p className="font-black text-slate-800 uppercase text-sm">{req.user?.name}</p>
            <span className="bg-orange-100 text-orange-700 text-[9px] font-black px-2 py-0.5 rounded-md border border-orange-200">
              {req.employeeBalance || 0}D EARNED
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase">{req.type}</p>
        </div>
      )
    },
    {
      header: "Duration",
      render: (req) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            {req.businessDays} Working Days
          </div>
          <p className="text-[9px] text-slate-400 font-medium">
            {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}
          </p>
        </div>
      )
    },
    {
      header: "Status",
      className: "text-center",
      render: (req) => <StatusBadge status={req.status} />
    },
    {
      header: "Decision",
      className: "text-right pr-10",
      render: (req) => (
        <div className="flex justify-end gap-2">
          {req.status === 'Pending' ? (
            <>
              <button
                onClick={() => handleStatusUpdate(req._id, 'Approved')}
                title="Approve"
                className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
              >
                <HiOutlineCheckCircle size={20} />
              </button>
              <button
                onClick={() => handleStatusUpdate(req._id, 'Rejected')}
                title="Reject"
                className="p-2.5 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm"
              >
                <HiOutlineXCircle size={20} />
              </button>
            </>
          ) : (
            <span className="text-[9px] font-black text-slate-300 uppercase px-4 py-2 bg-slate-50 rounded-lg tracking-widest border border-slate-100">
              Processed
            </span>
          )}
        </div>
      )
    }
  ];
  if (isLoading) return <Loader message="Accessing Registry..." />;

  return (
    <div className="max-w-[1800px] mx-auto pb-20 px-6">
      <Toaster position="top-right" />
      <div className="mb-10 mt-10">
        <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase mb-2">Attendance</h1>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
          Central Command {isFetching && <span className="text-orange-500 ml-2 animate-pulse">• Updating</span>}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-3">
          <div className="p-8 rounded-[3rem] bg-slate-900 text-white shadow-2xl sticky top-8">
            <HiOutlineShieldCheck size={32} className="text-orange-500 mb-4" />
            <h3 className="font-black text-xl uppercase mb-2">Management</h3>
            <p className="text-[10px] text-slate-400 font-bold leading-relaxed uppercase tracking-widest">
              Reviewing all employee leave balances and attendance logs.
            </p>
          </div>
        </div>

        <div className="lg:col-span-9 space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-[2.5rem] border-2 border-slate-50 shadow-sm">
            <div className="relative flex-1">
              <HiOutlineSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                placeholder="Search Employee Name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 rounded-2xl py-4 pl-14 pr-6 text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500 transition-all"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 rounded-2xl py-4 px-10 text-[10px] font-black uppercase outline-none cursor-pointer"
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div className={`bg-white rounded-[3.5rem] border-2 border-slate-50 shadow-sm overflow-hidden min-h-[500px] transition-opacity ${isFetching ? 'opacity-60' : 'opacity-100'}`}>
            <Table columns={columns} data={requests} emptyMessage="No leave records found." />
          </div>
        </div>
      </div>
    </div>
  );
}

const StatusBadge = ({ status }) => {
  const styles = { Pending: "bg-orange-50 text-orange-600 border-orange-100", Approved: "bg-emerald-50 text-emerald-600 border-emerald-100", Rejected: "bg-rose-50 text-rose-600 border-rose-100" };
  return <span className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border ${styles[status]}`}>{status}</span>;
};
import React, { useState, useEffect } from "react";
import {
  HiOutlineMagnifyingGlass,
  HiOutlineCpuChip,
  HiOutlineCommandLine,
  HiOutlineXMark,
} from "react-icons/hi2";
import { useGetMyTasksQuery } from "../../services/taskApi";
import PageHeader from "../../components/PageHeader";
import Table from "../../components/Table";
import Loader from "../../components/Loader";
import Pagination from "../../components/Pagination";

export default function MyTasksPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [taskSearch, setTaskSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [liveStatusFilter, setLiveStatusFilter] = useState("All");
  const [activeStatusFilter, setActiveStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 8;

  // --- DATA FETCHING ---
  const { data, isLoading, isFetching } = useGetMyTasksQuery({
    page: currentPage,
    limit,
    search: searchTerm,
    status: statusFilter === "All" ? "" : statusFilter,
    liveStatus: liveStatusFilter === "All" ? "" : liveStatusFilter,
    activeStatus: activeStatusFilter === "All" ? "" : activeStatusFilter,
  });


  const clearFilters = () => {
    setSearchTerm("");
    setTaskSearch("");
    setStatusFilter("All");
    setLiveStatusFilter("All");
    setActiveStatusFilter("All");
    setCurrentPage(1);
  };

  const headerClass = "text-[10px] font-black uppercase tracking-widest text-slate-400";

  const columns = [
    {
      header: <span className={headerClass}>Project Info</span>,
      render: (row) => (
        <div className="flex flex-col py-2">
          <span className="text-[10px] font-black text-blue-600 uppercase tracking-tighter">
            {row.project?.projectCode || "INTERNAL"}
          </span>
          <p className="text-[11px] font-bold text-slate-900 uppercase truncate max-w-[150px]">
            {row.project?.title || "Direct Assignment"}
          </p>
        </div>
      ),
    },
    {
      header: <span className={headerClass}>Mission Details</span>,
      render: (row) => (
        <div className="flex flex-col py-2">
          <p className={`font-black text-[11px] uppercase tracking-tight text-slate-800'}`}>
            {row.title}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-tighter ${row.priority === 'High' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
              {row.priority}
            </span>
            <span className="text-[8px] font-black px-2 py-0.5 rounded uppercase bg-orange-50 text-orange-600 border border-orange-100">
              {row.activeStatus}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: <span className={headerClass}>Utilization</span>,
      render: (row) => (
        <div className="flex flex-col min-w-[140px]">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[9px] font-black text-slate-400 uppercase">
              {row.totalConsumedHours || 0}h / {row.allocatedTime}h
            </span>
            <span className="text-[10px] font-black text-slate-900">{row.progressPercent}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full bg-orange-500 transition-all duration-700 ${row.progressPercent > 90 ? 'bg-rose-500' : ''}`}
              style={{ width: `${row.progressPercent}%` }}
            />
          </div>
        </div>
      )
    },
    {
      header: <span className={headerClass}>Live Status</span>,
      render: (row) => (
        <span className={`text-[10px] font-black uppercase ${row.liveStatus === "Started" ? "text-blue-500" : row.liveStatus === "In progress" ? "text-emerald-500" : "text-slate-400"}`}>
          {row.liveStatus}
        </span>
      ),
    },
  ];

  if (isLoading) return <Loader message="Accessing Command Data..." />;

  const hasActiveFilters = searchTerm || taskSearch || statusFilter !== "All" || liveStatusFilter !== "All" || activeStatusFilter !== "All";

  return (
    <div className="min-h-screen bg-slate-100">
      <PageHeader title="My Deployments" subtitle="Individual mission log and real-time operational status." />

      <main className="max-w-[1700px] mx-auto px-8 pb-10 -mt-10">

        {/* MATCHED ADMIN-STYLE FILTER BAR */}
        <div className="bg-white/90 backdrop-blur-xl border border-slate-200 p-6 rounded-[2.5rem] shadow-xl shadow-slate-200/50 mb-8 flex flex-col gap-5">

          {/* Top Row: Search Grid */}
          <div className="flex-1 flex item-center gap-4">
            <HiOutlineMagnifyingGlass className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search by Project Code or Name..."
              className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/5 outline-none font-bold text-xs transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>


          {/* Bottom Row: Status Dropdowns & Actions */}
          <div className="flex flex-wrap items-end justify-between gap-6 pt-5 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-6">

              {/* Initiative Status */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest">Initiative Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                  className="pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold text-slate-700 outline-none focus:border-orange-500 transition-all appearance-none cursor-pointer min-w-[180px]"
                >
                  <option value="All">All Phases</option>
                  {["On hold", "Modeling", "Lighting and Texturing", "Feedback pending", "Final rendering", "Postproduction", "Completed"].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Live Status */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest">Live Status</label>
                <select
                  value={liveStatusFilter}
                  onChange={(e) => { setLiveStatusFilter(e.target.value); setCurrentPage(1); }}
                  className="pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold text-slate-700 outline-none focus:border-orange-500 transition-all appearance-none cursor-pointer min-w-[140px]"
                >
                  <option value="All">All Live</option>
                  <option value="To be started">To be started</option>
                  <option value="Started">Started</option>
                  <option value="In progress">In progress</option>
                </select>
              </div>

              {/* Active Status (Drafts) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest">Active Status</label>
                <select
                  value={activeStatusFilter}
                  onChange={(e) => { setActiveStatusFilter(e.target.value); setCurrentPage(1); }}
                  className="pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold text-slate-700 outline-none focus:border-orange-500 transition-all appearance-none cursor-pointer min-w-[140px]"
                >
                  <option value="All">All Versions</option>
                  {["Draft-1", "Draft-2", "Draft-3", "Pre-Final", "Final"].map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-6 py-3 text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-2xl transition-all font-black text-[10px] tracking-widest cursor-pointer shadow-sm"
              >
                <HiOutlineXMark size={18} strokeWidth={2.5} />
                <span>RESET MISSION FILTERS</span>
              </button>
            )}
          </div>
        </div>

        {/* DATA TERMINAL */}
        <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className={isFetching ? "opacity-40" : "opacity-100"}>
            <Table
              columns={columns}
              data={data?.tasks || []}
              emptyMessage="No matching mission parameters found in your sector."
            />
          </div>

          <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <HiOutlineCpuChip className="text-orange-500 shadow-orange-200 shadow-sm" size={20} />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                Assigned Tasks: {data?.pagination?.totalTasks || 0}
              </span>
            </div>
            <Pagination
              pagination={data?.pagination}
              onPageChange={setCurrentPage}
              loading={isFetching}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
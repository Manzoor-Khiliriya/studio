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

  const renderStatusBadge = (status) => {
    const themes = {
      completed: "text-emerald-600",
      "on hold": "text-blue-600",
      "modeling": "text-green-600",
      "lighting and texturing": "text-cyan-600",
      "feedback pending": "text-yellow-600",
      "final rendering": "text-orange-600",
      postproduction: "text-purple-600",
    };

    const themeClass =
      themes[status?.toLowerCase()] || "text-slate-500";

    return (
      <span className={`text-[10px] font-black py-2 tracking-widest ${themeClass}`}>
        {status}
      </span>
    );
  };

  const renderActiveStatus = (status) => {
    const isFinal = status === "Final";
    const isPreFinal = status === "Pre-Final";

    let textColor = "text-slate-500";
    if (isFinal) textColor = "text-emerald-600";
    else if (isPreFinal) textColor = "text-orange-600";

    return (
      <div className="flex justify-center">
        <span className={`text-[10px] font-black py-2 tracking-widest ${textColor}`}>
          {status || "DRAFT-1"}
        </span>
      </div>
    );
  };

  const getStatusColor = (status) => {
    const statusMap = {
      "in progress": "text-green-600",
      "started": "text-blue-600",
    };

    return statusMap[status?.toLowerCase()] || "text-yellow-600";
  };

  const headerClass = "text-[10px] font-black uppercase tracking-widest text-slate-400";

  const columns = [
    {
      header: <span className={headerClass}>Project Info</span>,
      render: (row) => (
        <div className="py-2">
          <p className="text-[12px] font-bold text-slate-900 capitalize truncate max-w-[150px]">
            {row.project?.title || "Direct Assignment"} ({row.project?.projectCode || ""})
          </p>
        </div>
      ),
    },
    {
      header: <span className={headerClass}>Task Title</span>,
      className: "text-center",
      cellClassName: "text-center",
      render: (row) => (
        <div className="py-2">
          <p className="text-[11px] font-bold text-slate-800 uppercase tracking-tight truncate max-w-[150px]">
            {row.title}
          </p>
        </div>
      ),
    },
    {
      header: <span className={headerClass}>Task Details</span>,
      className: "text-center",
      cellClassName: "text-center",
      render: (row) => (
        <div className="py-2">
          <p className="text-[11px] font-bold text-slate-500 capitalize italic truncate max-w-[180px]">
            {row.description || "No details provided"}
          </p>
        </div>
      ),
    },
    {
      header: <span className={headerClass}>Task Priority</span>,
      className: "text-center",
      cellClassName: "text-center",
      render: (row) => {
        const colors = {
          High: "text-red-600",
          Medium: "text-amber-500",
          Low: "text-slate-400",
        };
        return (
          <div className="py-2">
            <p className={`text-[10px] font-black tracking-wider ${colors[row.priority] || "text-slate-500"}`}>
              • {row.priority}
            </p>
          </div>
        );
      },
    },
    {
      header: <span className={headerClass}>Live Status</span>,
      className: "text-center",
      cellClassName: "text-center",
      render: (task) => (
        <span className={`text-[10px] font-black ${getStatusColor(task.liveStatus)}`}>
          {task.liveStatus || "To Be Started"}
        </span>
      ),
    },
    {
      header: <span className={headerClass}>Initiative Status</span>,
      className: "text-center",
      cellClassName: "text-center",
      render: (task) => renderStatusBadge(task.status),
    },
    {
      header: <span className={headerClass}>Active Status</span>,
      className: "text-center",
      cellClassName: "text-center",
      render: (task) => renderActiveStatus(task.activeStatus),
    },
  ];

  if (isLoading) return <Loader message="Accessing Command Data..." />;

  const hasActiveFilters = searchTerm || taskSearch || statusFilter !== "All" || liveStatusFilter !== "All" || activeStatusFilter !== "All";

  return (
    <div className="max-w-[1700px] mx-auto min-h-screen bg-slate-100">
      <PageHeader title="My Tasks" subtitle="Individual mission log and real-time operational status." />

      <main className="max-w-[1700px] mx-auto px-8 pb-10 -mt-10">

        {/* MATCHED ADMIN-STYLE FILTER BAR */}
        <div className="bg-white/90 backdrop-blur-xl border border-slate-200 p-6 rounded-[2.5rem] shadow-xl shadow-slate-200/50 mb-8 flex flex-col gap-5">

          {/* Top Row: Search Grid */}
          <div className="lg:col-span-6 relative group">
            <HiOutlineMagnifyingGlass className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search by Project Name or Task Title..."
              className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/5 outline-none font-bold text-xs transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>


          {/* Bottom Row: Status Dropdowns & Actions */}
          <div className="flex flex-wrap items-end justify-end gap-6 pt-5 border-t border-slate-100">
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
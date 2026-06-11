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
import { useSocketEvents } from "../../hooks/useSocketEvents";
import CustomDropdown from "../../components/CustomDropdown";
import useDebounce from "../../hooks/useDebounce";

export default function MyTasksPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [taskSearch, setTaskSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [liveStatusFilter, setLiveStatusFilter] = useState("All");
  const [activeStatusFilter, setActiveStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const debouncedSearch = useDebounce(
    searchTerm.length > 1 ? searchTerm : "",
    400
  );

  const { data, isLoading, isFetching, refetch } = useGetMyTasksQuery({
    page: currentPage,
    limit: limit,
    search: debouncedSearch,
    status: statusFilter === "All" ? "" : statusFilter,
    liveStatus: liveStatusFilter === "All" ? "" : liveStatusFilter,
    activeStatus: activeStatusFilter === "All" ? "" : activeStatusFilter,
  });

  useSocketEvents({
    onTaskChange: refetch,
    onAllocationChange: refetch,
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
      themes[status?.toLowerCase()] || "text-slate-600";

    return (
      <span className={`text-[10px] font-black py-2 tracking-widest ${themeClass}`}>
        {status}
      </span>
    );
  };

  const renderActiveStatus = (status) => {
    const isFinal = status === "Final";
    const isPreFinal = status === "Pre-Final";

    let textColor = "text-slate-600";
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
      "to be started": "text-slate-600",
    };

    return statusMap[status?.toLowerCase()] || "text-yellow-600";
  };

  const headerClass = "text-[10px] font-black uppercase tracking-widest text-slate-500";

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
          <p className="text-[11px] font-bold text-slate-900 uppercase tracking-tight truncate max-w-[150px]">
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
          <p className="text-[11px] font-bold text-slate-600 capitalize italic truncate max-w-[180px]">
            {row.description || "No details provided"}
          </p>
        </div>
      ),
    },
    {
      header: <span className={headerClass}>Allocated Time</span>,
      className: "text-center",
      cellClassName: "text-center",
      render: (row) => {
        return (
          <div className="py-2">
            <p className={`text-[10px] font-black tracking-wider text-slate-600`}>
              {row?.allocation?.todayAllocatedFormatted || "0 Hrs 0 Mins 0 Secs"}
            </p>
          </div>
        );
      },
    },
    {
      header: <span className={headerClass}>Work Priority</span>,
      className: "text-center",
      cellClassName: "text-center",
      render: (row) => {
        return (
          <div className="py-2">
            <p className={`text-[10px] font-black tracking-wider text-slate-600`}>
              {row?.allocation?.priorityOrder}
            </p>
          </div>
        );
      },
    },
    {
      header: <span className={headerClass}>Role</span>,
      className: "text-center",
      cellClassName: "text-center",
      render: (task) => (
        <span className={`text-[10px] font-black text-slate-600`}>
          {task?.allocation?.role || "Main"}
        </span>
      ),
    },
    {
      header: <span className={headerClass}>Live Status</span>,
      className: "text-center",
      cellClassName: "text-center",
      render: (task) => (
        <span className={`text-[10px] font-black ${getStatusColor(task.liveStatus)}`}>
          {task.liveStatus || "To be started"}
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

  if (isLoading) return <Loader message="Accessing Task Data..." />;

  const hasActiveFilters = searchTerm || taskSearch || statusFilter !== "All" || liveStatusFilter !== "All" || activeStatusFilter !== "All";

  return (
    <div className="max-w-[1750px] mx-auto min-h-[83vh] bg-slate-100">
      <PageHeader title="My Tasks" subtitle="Individual tasks and real-time operational status." />

      <main className="max-w-[1750px] mx-auto px-8 pb-10 -mt-10">

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
          <div className="flex flex-wrap items-center gap-6 pt-5 border-t border-slate-100">
            {/* Initiative Status */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Initiative Status</label>
              <CustomDropdown
                value={statusFilter}
                onChange={(val) => {
                  setStatusFilter(val);
                  setCurrentPage(1);
                }}
                options={[
                  { label: "All Phases", value: "All" },
                  { label: "On hold", value: "On hold" },
                  { label: "Modeling", value: "Modeling" },
                  { label: "Lighting and Texturing", value: "Lighting and Texturing" },
                  { label: "Feedback pending", value: "Feedback pending" },
                  { label: "Final rendering", value: "Final rendering" },
                  { label: "Postproduction", value: "Postproduction" },
                  { label: "Completed", value: "Completed" },
                ]}
                className="min-w-[180px]"
                buttonClass="pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold text-slate-700"
              />
            </div>

            {/* Live Status */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Live Status</label>
              <CustomDropdown
                value={statusFilter}
                onChange={(val) => {
                  setStatusFilter(val);
                  setCurrentPage(1);
                }}
                options={[
                  { label: "All Phases", value: "All" },
                  { label: "On hold", value: "On hold" },
                  { label: "Modeling", value: "Modeling" },
                  { label: "Lighting and Texturing", value: "Lighting and Texturing" },
                  { label: "Feedback pending", value: "Feedback pending" },
                  { label: "Final rendering", value: "Final rendering" },
                  { label: "Postproduction", value: "Postproduction" },
                  { label: "Completed", value: "Completed" },
                ]}
                className="min-w-[180px]"
                buttonClass="pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold text-slate-700"
              />
            </div>

            {/* Active Status (Drafts) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Active Status</label>
              <CustomDropdown
                value={activeStatusFilter}
                onChange={(val) => {
                  setActiveStatusFilter(val);
                  setCurrentPage(1);
                }}
                options={[
                  { label: "All Versions", value: "All" },
                  { label: "Draft-1", value: "Draft-1" },
                  { label: "Draft-2", value: "Draft-2" },
                  { label: "Draft-3", value: "Draft-3" },
                  { label: "Pre-Final", value: "Pre-Final" },
                  { label: "Final", value: "Final" },
                ]}
                className="min-w-[140px]"
                buttonClass="pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold text-slate-700"
              />
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-6 py-4 text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-2xl transition-all font-black text-[10px] tracking-widest cursor-pointer shadow-sm"
              >
                <HiOutlineXMark size={18} strokeWidth={2.5} />
                <span>RESET MISSION FILTERS</span>
              </button>
            )}
          </div>
        </div>

        {/* DATA TERMINAL */}
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-visible flex flex-col">
          <div className={isFetching ? "opacity-40" : "opacity-100"}>
            <div className="rounded-t-[2rem] overflow-hidden">
              <Table
                columns={columns}
                data={data?.tasks || []}
                emptyMessage="No tasks found."
              />
            </div>
          </div>

          <div className="bg-slate-50/50 p-4 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 rounded-b-[2rem]">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100 pr-3">
                  Page Limit
                </span>
                <CustomDropdown
                  value={limit.toString()}
                  onChange={(val) => {
                    setLimit(Number(val));
                    setCurrentPage(1);
                  }}
                  options={[5, 10, 25, 50].map((v) => ({
                    label: `${v}`,
                    value: v.toString(),
                  }))}
                  className="w-10"
                  buttonClass="w-full p-1 bg-transparent text-[9px] font-black cursor-pointer text-slate-700 flex items-center gap-2"
                />
              </div>

              {data?.pagination?.totalTasks && (
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight ml-2">
                  Total {data?.pagination?.totalTasks} Tasks
                </span>
              )}
            </div>
            <Pagination
              pagination={{
                current: currentPage,
                total: data?.pagination?.totalPages || 1,
                count: data?.pagination?.totalTasks || 0,
                limit: limit,
              }}
              onPageChange={setCurrentPage}
              loading={isFetching}
              label="Records"
            />
          </div>

        </div>
      </main>
    </div>
  );
}
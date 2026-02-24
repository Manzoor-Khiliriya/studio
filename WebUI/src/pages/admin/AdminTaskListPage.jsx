import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useGetAllTasksQuery } from "../../services/taskApi";

// Icons
import {
  HiOutlineMagnifyingGlass,
  HiOutlineXMark,
  HiOutlineCalendarDays
} from "react-icons/hi2";

// Components
import PageHeader from "../../components/PageHeader";
import Table from "../../components/Table";
import Loader from "../../components/Loader";
import Pagination from "../../components/Pagination";
import TaskModal from "../../components/TaskModal";
import StatusUpdateModal from "../../components/StatusUpdateModal";

import { getAdminTaskColumns } from "../../utils/adminTaskListHelper";

export default function AdminTasksPage() {
  const navigate = useNavigate();

  // --- STATE MANAGEMENT ---
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [dateFilters, setDateFilters] = useState({
    createdAt: "",
    startDate: "",
    endDate: ""
  });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [statusUpdateTask, setStatusUpdateTask] = useState(null);

  // --- DATA FETCHING ---
  const { data, isLoading, isFetching } = useGetAllTasksQuery({
    page: currentPage,
    limit: limit,
    search: searchTerm,
    status: statusFilter === "All" ? undefined : statusFilter,
    ...dateFilters
  });

  // Dynamically get status options from backend response
  const statusOptions = data?.availableStatuses || ["All"];

  // --- COLUMN DEFINITION ---
  const columns = useMemo(() =>
    getAdminTaskColumns(setEditingTask, setStatusUpdateTask),
    [setEditingTask, setStatusUpdateTask]);

  // --- HANDLERS ---
  const handleDateChange = (key, value) => {
    setDateFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("All");
    setDateFilters({ createdAt: "", startDate: "", endDate: "" });
    setCurrentPage(1);
  };

  if (isLoading) return <Loader message="Synchronizing Mission Data..." />;

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Task Control"
        subtitle="Manage operational objectives and real-time resource utilization."
        actionLabel="Assign Task"
        onAction={() => setShowCreateModal(true)}
      />

      <main className="max-w-[1700px] mx-auto px-8 -mt-10">
        <div className="bg-white/90 backdrop-blur-xl border border-slate-200 p-5 rounded-[2.5rem] shadow-xl shadow-slate-200/50 mb-8 flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[300px] group">
              <HiOutlineMagnifyingGlass className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={20} />
              <input
                type="text"
                placeholder="Search missions..."
                className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/5 outline-none font-bold text-sm transition-all"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>

            {/* DYNAMIC STATUS DROPDOWN */}
            <div className="relative min-w-[200px]">
              <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest block mb-1">
                Active Status Filters
              </label>
              <div className="relative group">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-5 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-black uppercase tracking-widest outline-none transition-all appearance-none cursor-pointer focus:bg-white focus:ring-4 focus:ring-orange-500/5 text-orange-600"
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100">
            {/* DATE FILTERS GRID */}
            <div className="flex flex-wrap items-center gap-4">
              {[
                { label: "Created", key: "createdAt" },
                { label: "Start Date", key: "startDate" },
                { label: "End Date", key: "endDate" }
              ].map((filter) => (
                <div key={filter.key} className="flex flex-col gap-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest">{filter.label}</label>
                  <div className="relative group">
                    <HiOutlineCalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500" size={16} />
                    <input
                      type="date"
                      className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-bold text-slate-700 outline-none focus:border-orange-500 focus:bg-white transition-all"
                      value={dateFilters[filter.key]}
                      onChange={(e) => handleDateChange(filter.key, e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Clear Button */}
            {(searchTerm || statusFilter !== "All" || dateFilters.createdAt || dateFilters.startDate || dateFilters.endDate) && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-6 py-3 text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-2xl transition-all font-bold text-xs cursor-pointer self-end"
              >
                <HiOutlineXMark size={18} strokeWidth={2.5} />
                <span>CLEAR FILTERS</span>
              </button>
            )}
          </div>
        </div>

        {/* DATA TABLE CONTAINER */}
        <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col group/table">
          <Table
            columns={columns}
            data={data?.tasks || []}
            onRowClick={(task) => navigate(`/tasks/${task._id}`)}
            emptyMessage="No active missions found matching your criteria."
          />

          {/* PAGINATION FOOTER */}
          <div className="bg-slate-50/50 p-6 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100 pr-3">
                  Page Limit
                </span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-transparent text-[9px] font-black outline-none focus:ring-0 cursor-pointer text-slate-700"
                >
                  {[5, 10, 25, 50].map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
              {data?.totalTasks <= limit && (
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight ml-2">
                  Total {data?.totalTasks} results
                </span>
              )}
            </div>

            <Pagination
              pagination={{
                current: data?.currentPage,
                total: data?.totalPages,
                count: data?.totalTasks,
                limit: limit,
              }}
              onPageChange={setCurrentPage}
              loading={isFetching}
              label="Missions"
            />
          </div>
        </div>
      </main>

      <TaskModal
        isOpen={showCreateModal || !!editingTask}
        onClose={() => { setShowCreateModal(false); setEditingTask(null); }}
        editTask={editingTask}
      />

      <StatusUpdateModal
        isOpen={!!statusUpdateTask}
        onClose={() => setStatusUpdateTask(null)}
        task={statusUpdateTask}
      />
    </div>
  );
}
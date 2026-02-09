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

// Helpers & Config
import { getAdminTaskColumns } from "../../utils/adminTaskListHelper";

export default function AdminTasksPage() {
  const navigate = useNavigate();

  // --- STATE MANAGEMENT ---
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [dateFilters, setDateFilters] = useState({
    createdAt: "",
    startDate: "",
    endDate: ""
  });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // --- DATA FETCHING ---
  const { data, isLoading, isFetching } = useGetAllTasksQuery({
    page: currentPage,
    limit: limit,
    search: searchTerm,
    status: statusFilter === "All" ? undefined : statusFilter,
    ...dateFilters
  });

  // --- COLUMN DEFINITION ---
  const columns = useMemo(() => getAdminTaskColumns(setEditingTask), []);

  // --- HANDLERS ---
  const handleDateChange = (key, value) => {
    setDateFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to page 1 on filter change
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

        {/* TACTICAL FILTER BAR */}
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

            {/* Status Tabs */}
            <div className="flex bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/50">
              {["All", "Pending", "In Progress", "Completed"].map((status) => (
                <button
                  key={status}
                  onClick={() => { setStatusFilter(status); setCurrentPage(1); }}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === status
                    ? "bg-white text-orange-600 shadow-md ring-1 ring-slate-200"
                    : "text-slate-500 hover:text-slate-800"
                    }`}
                >
                  {status}
                </button>
              ))}
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
            {/* LEFT SIDE: ALWAYS VISIBLE SELECTOR */}
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
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              {/* Optional: Show small total count if Pagination is hidden */}
              {data?.totalTasks <= limit && (
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight ml-2">
                  Showing all {data?.totalTasks} results
                </span>
              )}
            </div>

            {/* RIGHT SIDE: CONDITIONAL PAGINATION */}
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
    </div>
  );
}
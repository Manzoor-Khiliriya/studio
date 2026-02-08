import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGetAllTasksQuery } from "../services/taskApi";
import {
  HiOutlinePlus, HiOutlineMagnifyingGlass,
  HiOutlineXMark, HiOutlineAdjustmentsHorizontal,
  HiOutlineBolt, HiOutlineCheckCircle, HiOutlineClock
} from "react-icons/hi2";
import { FiEdit } from "react-icons/fi";

import Table from "../components/Table";
import Loader from "../components/Loader";
import Pagination from "../components/Pagination";
import TaskModal from "../components/TaskModal";

export default function AdminTasksPage() {
  const navigate = useNavigate();

  // --- TACTICAL STATE ---
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [dateFilters, setDateFilters] = useState({ createdAt: "", startDate: "", endDate: "" });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // --- DATA ACQUISITION ---
  const { data, isLoading, isFetching } = useGetAllTasksQuery({
    page: currentPage,
    limit: limit,
    search: searchTerm,
    status: statusFilter === "All" ? undefined : statusFilter,
    ...dateFilters
  });

  // --- TABLE COLUMNS ---
  const columns = [
    {
      header: "Project No",
      className: "text-left",
      cellClassName: "text-left",
      render: (task) => (
        <span className="font-black text-[10px] text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 uppercase tracking-tighter">
          {task.projectNumber || task._id.slice(-5)}
        </span>
      )
    },
    {
      header: "Created Date",
      className: "text-left",
      cellClassName: "text-left",
      render: (task) => (
        <span className="font-black text-[10px] text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 uppercase tracking-tighter">
          {new Date(task.createdAt).toLocaleDateString() || "NA"}
        </span>
      )
    },
    {
      header: "Project Details",
      render: (task) => (
        <div className="py-2 max-w-[300px]">
          <p className="font-black text-slate-900 text-sm uppercase tracking-tight leading-tight mb-1 group-hover:text-orange-600 transition-colors">
            {task.title}
          </p>
          <p className="text-[10px] font-bold text-slate-400 line-clamp-2 leading-relaxed">
            {task.projectDetails || "No protocol details provided."}
          </p>
        </div>
      )
    },
    {
      header: "No Of Employees",
      className: "text-center",
      cellClassName: "text-center",
      render: (task) => (
        <div className="flex flex-col items-center">
          <span className="text-lg font-black text-slate-900 leading-none">
            {task.assignedTo?.length || 0}
          </span>
          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Personnel</span>
        </div>
      )
    },

    {
      header: "Resource Utilization",
      render: (task) => {
        const progress = Math.min(task.progressPercent || 0, 100);
        const isWarning = task.isOverBudget || progress > 90;

        return (
          <div className="flex flex-col min-w-[200px] pr-8">
            <div className="flex justify-between items-end mb-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <span className="text-slate-900">{(task.totalConsumedTime / 60 || 0).toFixed(1)}h</span> / {(task.allocatedTime || 0).toFixed(1)}h
              </span>
              <span className={`text-[10px] font-black ${isWarning ? 'text-rose-600' : 'text-emerald-600'}`}>
                {task.progressPercent}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
              <div
                className={`h-full transition-all duration-700 rounded-full ${isWarning
                  ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)] animate-pulse'
                  : 'bg-emerald-500'
                  }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        );
      }
    },

    {
      header: "Timeline",
      render: (task) => (
        <div className="text-[9px] font-black text-slate-500 uppercase flex flex-col gap-0.5">
          <span className="flex justify-between">Start: <span className="text-slate-900 ml-2">{new Date(task.startDate).toLocaleDateString()}</span></span>
          <span className="flex justify-between">End: <span className="text-slate-900 ml-2">{new Date(task.endDate).toLocaleDateString()}</span></span>
        </div>
      )
    },
    {
      header: "Status",
      className: "text-center",
      cellClassName: "text-center",
      render: (task) => (
        <span className={`inline-block text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border shadow-sm ${task.status === 'Completed'
            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
            : task.status === 'In Progress'
              ? 'bg-orange-50 text-orange-600 border-orange-200'
              : task.status === 'Overdue'
                ? 'bg-rose-50 text-rose-600 border-rose-100'
                : 'bg-yellow-50 text-yellow-400 border-yellow-100'
          }`}>
          {task.status}
        </span>
      )
    },
    {
      header: "Actions",
      className: "text-left",
      cellClassName: "text-left",
      render: (task) => (
        <button
          onClick={(e) => { e.stopPropagation(); setEditingTask(task); }}
          className="rounded-b-xllg text-yellow-500 hover:text-yellow-600 transition-all active:scale-90 cursor-pointer"
          title="Update Task Details"
        >
          <FiEdit size={18} />
        </button>
      )
    }
  ];

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("All");
    setDateFilters({ createdAt: "", startDate: "", endDate: "" });
    setLimit(5);
    setCurrentPage(1);
  };

  if (isLoading) return <Loader message="Accessing Mission Archives..." />;

  const tasks = data?.tasks || [];

  return (
    <div className="max-w-[1700px] mx-auto pb-24 px-8 pt-10">

      {/* ACTION HEADER */}
      <div className="flex flex-col 2xl:flex-row justify-between items-start 2xl:items-end gap-10 mb-12">
        <div className="flex-1 w-full">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-2 h-10 bg-orange-500 rounded-full" />
            <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase">Task Control</h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* SEARCH */}
            <div className="relative min-w-[340px] group">
              <HiOutlineMagnifyingGlass className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-500 transition-colors" size={20} />
              <input
                type="text" placeholder="Filter by objective or ID..."
                className="w-full pl-14 pr-6 py-4 bg-white border-2 border-slate-100 rounded-[1.5rem] focus:border-orange-500 outline-none font-bold text-sm shadow-sm transition-all"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>

            {/* DATE CONTROLS */}
            <div className="flex items-center bg-white border-2 border-slate-100 rounded-[1.5rem] p-1 gap-1">
              {['createdAt', 'startDate', 'endDate'].map((key) => (
                <div key={key} className="relative group">
                  <input
                    type="date"
                    className="pl-3 pr-2 py-4 bg-transparent outline-none font-black text-[9px] uppercase text-slate-600 hover:text-orange-600 transition-colors"
                    value={dateFilters[key]}
                    onChange={(e) => { setDateFilters({ ...dateFilters, [key]: e.target.value }); setCurrentPage(1); }}
                  />
                  <span className="absolute -top-5 left-1 text-[8px] font-black text-slate-300 uppercase opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {key.replace(/([A-Z])/g, ' $1')}
                  </span>
                </div>
              ))}
            </div>

            {/* RESET */}
            {(searchTerm || dateFilters.createdAt || statusFilter !== "All") && (
              <button
                onClick={clearFilters}
                className="p-4 text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-[1.5rem] transition-all cursor-pointer"
                title="Reset Intelligence Filters"
              >
                <HiOutlineXMark size={20} strokeWidth={3} />
              </button>
            )}
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-orange-500/20 active:scale-95 cursor-pointer"
        >
          <HiOutlinePlus strokeWidth={2.5} size={20} />
          <span>Assign Task</span>
        </button>
      </div>

      {/* TACTICAL OVERVIEW TABS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-[1.8rem] border border-slate-100 w-fit">
          {["All", "Pending", "In Progress", "Completed"].map((status) => (
            <button
              key={status}
              onClick={() => { setStatusFilter(status); setCurrentPage(1); }}
              className={`px-8 py-3 rounded-[1.2rem] text-[10px] font-black uppercase tracking-[0.15em] transition-all ${statusFilter === status
                ? "bg-white text-orange-600 shadow-md shadow-orange-500/5 ring-1 ring-slate-100"
                : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
                }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <select
              value={limit}
              onChange={(e) => { setLimit(Number(e.target.value)); setCurrentPage(1); }}
              className="appearance-none pl-6 pr-12 py-3 bg-white border-2 border-slate-100 rounded-2xl focus:border-orange-500 outline-none font-black text-[10px] uppercase cursor-pointer transition-all text-slate-700"
            >
              {[5, 10, 25, 50].map(v => <option key={v} value={v}>{v} / Page</option>)}
            </select>
            <HiOutlineAdjustmentsHorizontal className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={16} />
          </div>
        </div>
      </div>

      {/* TACTICAL DATA TABLE */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between group/table">
        <Table
          columns={columns}
          data={tasks}
          onRowClick={(task) => navigate(`/tasks/${task._id}`)}
          emptyMessage="No active missions detected with current parameters."
        />

        <div className="bg-slate-50/50 p-6 border-t border-slate-50">
          <Pagination
            pagination={{
              current: data?.currentPage,
              total: data?.totalPages,
              count: data?.totalTasks
            }}
            onPageChange={setCurrentPage}
            loading={isFetching}
            label="Active Objectives"
          />
        </div>
      </div>

      {/* SYSTEM MODAL */}
      <TaskModal
        isOpen={showCreateModal || !!editingTask}
        onClose={() => { setShowCreateModal(false); setEditingTask(null); }}
        editTask={editingTask}
      />
    </div>
  );
}
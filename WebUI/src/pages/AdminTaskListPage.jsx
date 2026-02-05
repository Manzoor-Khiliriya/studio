import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGetAllTasksQuery } from "../services/taskApi"; 
import { 
  HiOutlinePlus, HiOutlineMagnifyingGlass, 
  HiOutlineXMark, HiOutlineDocumentText,
  HiOutlineAdjustmentsHorizontal
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

  // --- TABLE LOGIC ---
  const columns = [
    {
      header: "Ref ID",
      className: "w-24 text-center",
      cellClassName: "text-center",
      render: (task) => (
        <span className="font-black text-[10px] text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 uppercase tracking-tighter">
          {task.projectNumber || task._id.slice(-5)}
        </span>
      )
    },
    {
      header: "Mission Objective",
      render: (task) => (
        <div className="py-2">
          <p className="font-black text-slate-900 text-sm uppercase tracking-tight leading-tight mb-1.5 group-hover:text-orange-600 transition-colors">
            {task.title}
          </p>
          <div className="flex items-center gap-2">
            <span className={`text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest border ${
              task.status === 'Completed' 
                ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                : task.status === 'In Progress' 
                ? 'bg-orange-50 text-orange-600 border-orange-200'
                : 'bg-slate-50 text-slate-400 border-slate-100'
            }`}>
              {task.status}
            </span>
          </div>
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
                <span className="text-slate-900">{(task.totalConsumedTime / 60).toFixed(1)}h</span> / {(task.allocatedTime || 0).toFixed(1)}h
              </span>
              <span className={`text-[10px] font-black ${isWarning ? 'text-rose-600' : 'text-emerald-600'}`}>
                {task.progressPercent}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
              <div 
                className={`h-full transition-all duration-700 rounded-full ${isWarning ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]' : 'bg-emerald-500'}`} 
                style={{ width: `${progress}%` }} 
              />
            </div>
          </div>
        );
      }
    },
    {
      header: "Protocol",
      className: "text-right pr-10",
      cellClassName: "text-right pr-10",
      render: (task) => (
        <button 
          onClick={(e) => { e.stopPropagation(); setEditingTask(task); }} 
          className="p-3 rounded-2xl bg-white border border-slate-100 text-slate-400 hover:text-orange-600 hover:border-orange-100 hover:shadow-lg hover:shadow-orange-500/5 transition-all active:scale-90"
        >
          <FiEdit size={16} />
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
                    className="pl-3 pr-2 py-3 bg-transparent outline-none font-black text-[9px] uppercase cursor-pointer text-slate-600 hover:text-orange-600 transition-colors"
                    value={dateFilters[key]}
                    onChange={(e) => { setDateFilters({ ...dateFilters, [key]: e.target.value }); setCurrentPage(1); }}
                  />
                  <span className="absolute -top-6 left-1 text-[8px] font-black text-slate-300 uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                    {key.replace(/([A-Z])/g, ' $1')}
                  </span>
                </div>
              ))}
            </div>

            {/* CAPACITY SELECT */}
            <div className="relative">
              <select
                value={limit}
                onChange={(e) => { setLimit(Number(e.target.value)); setCurrentPage(1); }}
                className="appearance-none pl-6 pr-12 py-4 bg-white border-2 border-slate-100 rounded-[1.5rem] focus:border-orange-500 outline-none font-black text-[10px] uppercase cursor-pointer transition-all text-slate-700"
              >
                {[5, 10, 25, 50].map(v => <option key={v} value={v}>{v} / Page</option>)}
              </select>
              <HiOutlineAdjustmentsHorizontal className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={16} />
            </div>

            {/* RESET */}
            {(searchTerm || dateFilters.createdAt || statusFilter !== "All") && (
              <button
                onClick={clearFilters}
                className="p-4 text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-[1.5rem] transition-all"
                title="Reset Intelligence Filters"
              >
                <HiOutlineXMark size={20} strokeWidth={3} />
              </button>
            )}
          </div>
        </div>

        <button 
          onClick={() => setShowCreateModal(true)} 
          className="bg-slate-900 text-white pl-8 pr-10 py-5 rounded-[2.2rem] font-black text-lg hover:bg-orange-600 transition-all flex items-center gap-4 shadow-2xl shadow-slate-900/10 active:scale-95 group"
        >
          <div className="bg-white/10 p-2 rounded-xl group-hover:bg-white/20 transition-colors">
            <HiOutlinePlus size={20} strokeWidth={3} />
          </div>
          <span className="uppercase tracking-tight">Assign Mission</span>
        </button>
      </div>

      {/* FILTER TABS */}
      <div className="flex items-center gap-2 mb-10 bg-slate-50 p-2 rounded-[1.8rem] border border-slate-100 w-fit">
        {["All", "Pending", "In Progress", "Completed"].map((status) => (
          <button
            key={status}
            onClick={() => { setStatusFilter(status); setCurrentPage(1); }}
            className={`px-8 py-3 rounded-[1.2rem] text-[10px] font-black uppercase tracking-[0.15em] transition-all ${
              statusFilter === status 
                ? "bg-white text-orange-600 shadow-md shadow-orange-500/5 ring-1 ring-slate-100" 
                : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* TACTICAL DATA TABLE */}
      <div className="bg-white rounded-[4rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between group/table">
        <Table 
          columns={columns} 
          data={tasks} 
          onRowClick={(task) => navigate(`/tasks/${task._id}`)}
          emptyMessage="No active missions detected with current parameters."
        />

        <div className="bg-slate-50/50 p-4 border-t border-slate-50">
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
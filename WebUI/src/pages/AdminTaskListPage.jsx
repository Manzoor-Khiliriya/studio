import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGetAllTasksQuery } from "../services/taskApi"; 
import { 
  HiOutlinePlus, HiOutlineMagnifyingGlass, 
  HiOutlineXMark, HiOutlineDocumentText 
} from "react-icons/hi2";
import { FiEdit } from "react-icons/fi";

import Table from "../components/Table";
import Loader from "../components/Loader";
import Pagination from "../components/Pagination";
import TaskModal from "../components/TaskModal";

export default function AdminTasksPage() {
  const navigate = useNavigate();

  // --- STATE ---
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10); // Added Limit State
  const [dateFilters, setDateFilters] = useState({ createdAt: "", startDate: "", endDate: "" });
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // --- API DATA ---
  const { data, isLoading, isFetching } = useGetAllTasksQuery({
    page: currentPage,
    limit: limit, // Passing limit to API
    search: searchTerm,
    status: statusFilter === "All" ? undefined : statusFilter,
    ...dateFilters
  });

  // --- TABLE COLUMNS CONFIGURATION ---
  const columns = [
    {
      header: "Project ID",
      className: "text-center",
      cellClassName: "text-center",
      render: (task) => (
        <div className="inline-flex items-center justify-center bg-slate-100 w-12 h-12 rounded-2xl font-black text-xs text-slate-600">
          {task.projectNumber}
        </div>
      )
    },
    {
      header: "Mission Detail",
      render: (task) => (
        <div>
          <p className="font-black text-slate-800 text-sm group-hover:text-orange-600 uppercase mb-1 transition-colors">
            {task.title}
          </p>
          <span className={`text-[8px] font-black px-2 py-0.5 rounded-md border ${
            task.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-orange-50 text-orange-600 border-orange-100'
          }`}>
            {task.status}
          </span>
        </div>
      )
    },
    {
      header: "Utilization",
      render: (task) => (
        <div className="flex flex-col min-w-[160px]">
          <div className="flex justify-between mb-1.5">
            <span className="text-xs font-black text-slate-700">{(task.totalConsumedTime / 60).toFixed(1)}h</span>
            <span className={`text-[10px] font-black ${task.isOverBudget ? 'text-rose-600' : 'text-emerald-600'}`}>
              {task.progressPercent}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${task.isOverBudget ? 'bg-rose-500' : 'bg-emerald-500'}`} 
              style={{ width: `${Math.min(task.progressPercent, 100)}%` }} 
            />
          </div>
        </div>
      )
    },
    {
      header: "Actions",
      className: "text-right pr-10",
      cellClassName: "text-right pr-10",
      render: (task) => (
        <button 
          onClick={(e) => { e.stopPropagation(); setEditingTask(task); }} 
          className="p-3 rounded-xl bg-slate-50 text-slate-400 hover:bg-orange-600 hover:text-white transition-all active:scale-90"
        >
          <FiEdit size={18} />
        </button>
      )
    }
  ];

  // --- ACTIONS ---
  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("All");
    setDateFilters({ createdAt: "", startDate: "", endDate: "" });
    setLimit(10);
    setCurrentPage(1);
  };

  if (isLoading) return <Loader message="Decrypting Task Database..." />;

  const tasks = data?.tasks || [];

  return (
    <div className="max-w-[1800px] mx-auto pb-20 px-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-8 mb-8 mt-10">
        <div className="w-full xl:w-auto">
          <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase mb-6">Task Control</h1>
          
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative min-w-[300px] flex-1">
              <HiOutlineMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" placeholder="Search project # or title..." 
                className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-slate-100 rounded-2xl focus:border-orange-500 outline-none font-bold text-xs shadow-sm transition-all"
                value={searchTerm} 
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>

            {/* Date Filters */}
            {['createdAt', 'startDate', 'endDate'].map((key) => (
              <div key={key} className="relative">
                <input
                  type="date"
                  className="pl-4 pr-4 py-3 bg-white border-2 border-slate-100 rounded-2xl focus:border-orange-500 outline-none font-bold text-[10px] uppercase transition-all"
                  value={dateFilters[key]}
                  onChange={(e) => { setDateFilters({ ...dateFilters, [key]: e.target.value }); setCurrentPage(1); }}
                />
                <span className="absolute -top-2 left-3 bg-white px-1 text-[8px] font-black text-slate-400 uppercase">
                  {key.replace(/([A-Z])/g, ' $1')}
                </span>
              </div>
            ))}

            {/* Capacity Select (Limit) */}
            <div className="relative">
              <select
                value={limit}
                onChange={(e) => { setLimit(Number(e.target.value)); setCurrentPage(1); }}
                className="appearance-none pl-4 pr-10 py-3.5 bg-white border-2 border-slate-100 rounded-2xl focus:border-orange-500 outline-none font-black text-[10px] uppercase cursor-pointer transition-all"
              >
                {[5, 10, 20, 50].map(v => <option key={v} value={v}>{v} Per Page</option>)}
              </select>
              <span className="absolute -top-2 left-3 bg-white px-1 text-[8px] font-black text-slate-400 uppercase">Capacity</span>
            </div>

            {/* Clear Button */}
            {(searchTerm || dateFilters.createdAt || dateFilters.startDate || dateFilters.endDate || statusFilter !== "All") && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-5 py-3 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest"
              >
                <HiOutlineXMark size={16} strokeWidth={3} /> Clear Filters
              </button>
            )}
          </div>
        </div>

        <button 
          onClick={() => setShowCreateModal(true)} 
          className="bg-slate-900 text-white px-10 py-5 rounded-[2rem] font-black text-lg hover:bg-orange-600 transition-all flex items-center gap-3 shadow-xl active:scale-95 whitespace-nowrap"
        >
          <HiOutlinePlus size={22} strokeWidth={3} /> Assign Mission
        </button>
      </div>

      {/* STATUS PILLS */}
      <div className="flex items-center gap-2 mb-8 bg-slate-100/50 p-1.5 rounded-2xl border border-slate-100 w-fit">
        {["All", "Pending", "In Progress", "Completed"].map((status) => (
          <button
            key={status}
            onClick={() => { setStatusFilter(status); setCurrentPage(1); }}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === status ? "bg-white text-orange-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* REUSABLE TABLE CONTAINER */}
      <div className="bg-white rounded-[3rem] border-2 border-slate-50 shadow-sm overflow-hidden min-h-[500px] flex flex-col justify-between">
        <Table 
          columns={columns} 
          data={tasks} 
          onRowClick={(task) => navigate(`/tasks/${task._id}`)}
          emptyMessage="No matching missions found in sector."
        />

        {/* PAGINATION FOOTER */}
        <Pagination 
          pagination={{ current: data?.currentPage, total: data?.totalPages, count: data?.totalTasks }} 
          onPageChange={setCurrentPage} 
          loading={isFetching} 
          label="Tasks" 
        />
      </div>

      {/* EMPTY STATE HELPER (if table is empty) */}
      {!isFetching && tasks.length === 0 && (
        <div className="mt-20 text-center">
          <HiOutlineDocumentText size={48} className="text-slate-200 mx-auto mb-4" />
          <button onClick={clearFilters} className="mt-4 text-orange-600 font-black uppercase text-xs tracking-widest hover:underline">Reset Filters</button>
        </div>
      )}

      {/* MODAL */}
      <TaskModal 
        isOpen={showCreateModal || !!editingTask} 
        onClose={() => { setShowCreateModal(false); setEditingTask(null); }} 
        editTask={editingTask} 
      />
    </div>
  );
}
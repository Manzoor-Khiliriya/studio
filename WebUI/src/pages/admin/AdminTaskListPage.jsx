import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useGetAllTasksQuery } from "../../services/taskApi";

// Icons
import {
  HiOutlineMagnifyingGlass,
  HiOutlineXMark,
  HiOutlineCalendarDays,
  HiOutlineBriefcase,
  HiChevronDown
} from "react-icons/hi2";

// Components
import PageHeader from "../../components/PageHeader";
import Loader from "../../components/Loader";
import Pagination from "../../components/Pagination";
import TaskModal from "../../components/TaskModal";
import ProjectModal from "../../components/ProjectModal";
import StatusUpdateModal from "../../components/StatusUpdateModal";
import GroupedTaskTable from "../../components/GroupTable";

// Utils
import { getAdminTaskColumns } from "../../utils/adminTaskListHelper";

export default function AdminTasksPage() {
  const navigate = useNavigate();

  // --- STATE MANAGEMENT ---
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(5); // Set to 5 as requested
  const [expandedProject, setExpandedProject] = useState(null);
  const [dateFilters, setDateFilters] = useState({
    createdAt: "",
    startDate: "",
    endDate: ""
  });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
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

  // --- GROUPING LOGIC ---
  const projectGroups = useMemo(() => {
    if (!data?.tasks) return [];
    
    const grouped = data.tasks.reduce((acc, task) => {
      const pCode = task.project?.projectNumber || "UNASSIGNED";
      if (!acc[pCode]) {
        acc[pCode] = { 
          projectNumber: pCode, 
          projectTitle: task.project?.title || "Unknown Project", 
          taskList: [] 
        };
      }
      acc[pCode].taskList.push(task);
      return acc;
    }, {});

    return Object.values(grouped);
  }, [data?.tasks]);

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
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <PageHeader
        title="Project Control"
        subtitle="Manage operational projects and their nested mission objectives."
        actionLabel="Assign Task"
        onAction={() => setShowCreateModal(true)}
        secondaryActionLabel="New Project"
        onSecondaryAction={() => setShowProjectModal(true)}
      />

      <main className="max-w-[1700px] mx-auto px-8 -mt-10">
        {/* FILTER BAR */}
        <div className="bg-white/90 backdrop-blur-xl border border-slate-200 p-5 rounded-[2.5rem] shadow-xl shadow-slate-200/50 mb-8 flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[300px] group">
              <HiOutlineMagnifyingGlass className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={20} />
              <input
                type="text"
                placeholder="Search projects or tasks..."
                className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-orange-500 outline-none font-bold text-sm transition-all"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>

            <button
              onClick={() => setShowProjectModal(true)}
              className="px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl flex items-center gap-3 hover:border-orange-500 hover:text-orange-600 transition-all font-black text-[11px] uppercase tracking-widest"
            >
              <HiOutlineBriefcase size={18} />
              Create Project
            </button>

            <div className="relative min-w-[200px]">
              <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest block mb-1">Status Filter</label>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="w-full pl-5 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-black uppercase tracking-widest outline-none appearance-none cursor-pointer focus:bg-white text-orange-600"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>

          {/* DATE FILTERS */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-4">
              {[
                { label: "Created", key: "createdAt" },
                { label: "Start Date", key: "startDate" },
                { label: "End Date", key: "endDate" }
              ].map((filter) => (
                <div key={filter.key} className="flex flex-col gap-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest">{filter.label}</label>
                  <div className="relative group">
                    <HiOutlineCalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
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
              <button onClick={clearFilters} className="flex items-center gap-2 px-6 py-3 text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-2xl transition-all font-bold text-xs cursor-pointer self-end">
                <HiOutlineXMark size={18} strokeWidth={2.5} />
                <span>CLEAR FILTERS</span>
              </button>
            )}
          </div>
        </div>

        {/* PROJECT CARDS LIST */}
        <div className="space-y-4 mb-8">
          {projectGroups.length > 0 ? (
            projectGroups.map((group) => (
              <div 
                key={group.projectNumber} 
                className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden transition-all duration-300"
              >
                {/* CARD HEADER */}
                <div 
                  onClick={() => setExpandedProject(expandedProject === group.projectNumber ? null : group.projectNumber)}
                  className={`p-6 flex items-center justify-between cursor-pointer transition-colors ${expandedProject === group.projectNumber ? 'bg-slate-900 text-white' : 'hover:bg-slate-50'}`}
                >
                  <div className="flex items-center gap-6">
                    <span className={`px-4 py-1.5 rounded-xl text-[12px] font-black tracking-widest ${expandedProject === group.projectNumber ? 'bg-orange-500 text-white' : 'bg-slate-900 text-white'}`}>
                      {group.projectNumber}
                    </span>
                    <div>
                      <h3 className={`text-lg font-black uppercase tracking-tight ${expandedProject === group.projectNumber ? 'text-white' : 'text-slate-900'}`}>
                        {group.projectTitle}
                      </h3>
                      <p className={`text-[10px] font-bold uppercase tracking-widest ${expandedProject === group.projectNumber ? 'text-slate-400' : 'text-slate-400'}`}>
                        {group.taskList.length} Tasks in this project
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className={`transition-transform duration-300 ${expandedProject === group.projectNumber ? 'rotate-180 text-orange-500' : 'text-slate-300'}`}>
                      <HiChevronDown size={28} />
                    </div>
                  </div>
                </div>

                {/* EXPANDED CONTENT (THE TABLE) */}
                {expandedProject === group.projectNumber && (
                  <div className="p-2 bg-white animate-in slide-in-from-top-4 duration-300">
                     <GroupedTaskTable
                        columns={columns}
                        tasks={group.taskList}
                        onRowClick={(task) => navigate(`/tasks/${task._id}`)}
                      />
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="bg-white rounded-[3rem] p-24 text-center border-2 border-dashed border-slate-200">
               <p className="text-slate-300 font-black uppercase italic text-xl tracking-tighter">
                 No operational projects found.
               </p>
            </div>
          )}
        </div>

        {/* PAGINATION FOOTER */}
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-200 pr-3">Projects Per Page</span>
            <select
              value={limit}
              onChange={(e) => { setLimit(Number(e.target.value)); setCurrentPage(1); }}
              className="bg-transparent text-[10px] font-black outline-none cursor-pointer text-slate-700"
            >
              {[5, 10, 25, 50].map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
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
            label="Projects"
          />
        </div>
      </main>

      {/* MODALS */}
      <ProjectModal isOpen={showProjectModal} onClose={() => setShowProjectModal(false)} />
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
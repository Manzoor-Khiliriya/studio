import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useGetProjectsQuery } from "../../services/projectApi";

import {
  HiOutlineMagnifyingGlass,
  HiOutlineXMark,
  HiOutlineCalendarDays,
  HiOutlineUser,
  HiOutlinePencilSquare,
  HiOutlineBriefcase,
  HiChevronDown,
  HiOutlinePlusCircle,
  HiOutlineCommandLine // Icon for task specific search
} from "react-icons/hi2";

import PageHeader from "../../components/PageHeader";
import Loader from "../../components/Loader";
import Pagination from "../../components/Pagination";
import TaskModal from "../../components/TaskModal";
import ProjectModal from "../../components/ProjectModal";
import StatusUpdateModal from "../../components/StatusUpdateModal";
import GroupedTaskTable from "../../components/GroupTable";
import { getAdminTaskColumns } from "../../utils/adminTaskListHelper";

export default function AdminTasksPage() {
  const navigate = useNavigate();

  // --- STATE MANAGEMENT ---
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  
  // New Task Filters
  const [taskSearch, setTaskSearch] = useState("");
  const [liveStatusFilter, setLiveStatusFilter] = useState("All");
  const [taskStatusFilter, setTaskStatusFilter] = useState("All");

  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [expandedProject, setExpandedProject] = useState(null);
  
  const [dateFilters, setDateFilters] = useState({
    createdAt: "",
    startDate: "",
    endDate: "",
  });

  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [preSelectedProject, setPreSelectedProject] = useState(null);
  const [statusUpdateTask, setStatusUpdateTask] = useState(null);

  // --- DATA FETCHING ---
  const { data, isLoading, isFetching } = useGetProjectsQuery({
    page: currentPage,
    limit: limit,
    search: searchTerm,
    status: statusFilter,
    createdAt: dateFilters.createdAt,
    startDate: dateFilters.startDate,
    endDate: dateFilters.endDate,
    taskSearch, // Added
    liveStatus: liveStatusFilter, // Added
    taskStatus: taskStatusFilter, // Added
  });

  const projectGroups = data?.projects || [];

  const columns = useMemo(
    () => getAdminTaskColumns(setEditingTask, setStatusUpdateTask),
    [setEditingTask, setStatusUpdateTask]
  );

  // --- HANDLERS ---
  const handleDateChange = (key, value) => {
    setDateFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("All");
    setTaskSearch("");
    setLiveStatusFilter("All");
    setTaskStatusFilter("All");
    setDateFilters({ createdAt: "", startDate: "", endDate: "" });
    setCurrentPage(1);
  };

  const openTaskModalForProject = (project) => {
    setPreSelectedProject(project._id);
    setShowTaskModal(true);
  };

  const formatDate = (date) => {
    if (!date) return "TBD";
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: '2-digit'
    });
  };

  if (isLoading) return <Loader message="Synchronizing Project Data..." />;

  return (
    <div className="min-h-screen bg-slate-100">
      <PageHeader
        title="Project Management"
        subtitle="Manage operational projects and nested task objectives."
        actionLabel="Assign Task"
        onAction={() => {
          setPreSelectedProject(null);
          setShowTaskModal(true);
        }}
        secondaryActionLabel="New Project"
        onSecondaryAction={() => {
          setEditingProject(null);
          setShowProjectModal(true);
        }}
      />

      <main className="max-w-[1700px] mx-auto px-8 pb-10 -mt-10">
        {/* --- FILTER BAR --- */}
        <div className="bg-white/90 backdrop-blur-xl border border-slate-200 p-6 rounded-[2.5rem] shadow-xl shadow-slate-200/50 mb-8 flex flex-col gap-5">
          
          {/* Row 1: Primary Searches */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-5 relative group">
              <HiOutlineMagnifyingGlass className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={18} />
              <input
                type="text"
                placeholder="Search projects by code or title..."
                className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/5 outline-none font-bold text-xs transition-all shadow-sm"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>

            <div className="lg:col-span-5 relative group">
              <HiOutlineCommandLine className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input
                type="text"
                placeholder="Filter by specific Task Name..."
                className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none font-bold text-xs transition-all shadow-sm"
                value={taskSearch}
                onChange={(e) => { setTaskSearch(e.target.value); setCurrentPage(1); }}
              />
            </div>

            <div className="lg:col-span-2 relative">
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="w-full pl-5 pr-10 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-black uppercase tracking-widest outline-none appearance-none cursor-pointer focus:bg-white text-orange-600"
              >
                <option value="All">Project: All</option>
                <option value="Active">Active Only</option>
                <option value="Inactive">Inactive Only</option>
              </select>
            </div>
          </div>

          {/* Row 2: Status & Date Filters */}
          <div className="flex flex-wrap items-end justify-between gap-6 pt-5 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-6">
              
              {/* Live Status Select */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest">Live Status</label>
                <select
                  value={liveStatusFilter}
                  onChange={(e) => { setLiveStatusFilter(e.target.value); setCurrentPage(1); }}
                  className="pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold text-slate-700 outline-none focus:border-orange-500 transition-all appearance-none cursor-pointer min-w-[140px]"
                >
                  <option value="All">All Status</option>
                  <option value="To be started">To be started</option>
                  <option value="In progress">In progress</option>
                </select>
              </div>

              {/* Milestone Filter */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest">Initiative Status</label>
                <select
                  value={taskStatusFilter}
                  onChange={(e) => { setTaskStatusFilter(e.target.value); setCurrentPage(1); }}
                  className="pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold text-slate-700 outline-none focus:border-orange-500 transition-all appearance-none cursor-pointer min-w-[180px]"
                >
                  <option value="All">All Initiative Status</option>
                  {["On hold", "Modeling", "Lighting and Texturing", "Feedback pending", "Final rendering", "Postproduction", "Completed"].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Existing Dates */}
              {[
                { label: "Created", key: "createdAt" },
                { label: "Start Date", key: "startDate" },
                { label: "End Date", key: "endDate" },
              ].map((filter) => (
                <div key={filter.key} className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest">{filter.label}</label>
                  <div className="relative group">
                    <HiOutlineCalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="date"
                      className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold text-slate-700 outline-none focus:border-orange-500 focus:bg-white transition-all"
                      value={dateFilters[filter.key]}
                      onChange={(e) => handleDateChange(filter.key, e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Clear Button */}
            {(searchTerm || taskSearch || statusFilter !== "All" || liveStatusFilter !== "All" || taskStatusFilter !== "All" || dateFilters.createdAt || dateFilters.startDate || dateFilters.endDate) && (
              <button onClick={clearFilters} className="flex items-center gap-2 px-6 py-3 text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-2xl transition-all font-black text-[10px] tracking-widest cursor-pointer">
                <HiOutlineXMark size={18} strokeWidth={2.5} />
                <span>RESET FILTERS</span>
              </button>
            )}
          </div>
        </div>

        {/* --- PROJECT CARDS LIST --- */}
        <div className="space-y-4 mb-8">
          {projectGroups.length > 0 ? (
            projectGroups.map((project) => {
              const tasks = project.tasks || [];
              const totalTasks = tasks.length;

              return (
                <div key={project._id} className={`bg-white rounded-lg border transition-all duration-300 cursor-pointer ${expandedProject === project.project_code ? "border-orange-500/30 shadow-xl shadow-orange-500/5" : "border-slate-200 shadow-sm"}`}
                  onClick={() => setExpandedProject(expandedProject === project.project_code ? null : project.project_code)}
                >
                  <div className="p-6 flex items-center justify-between hover:bg-slate-50/80 transition-all group/header border-b border-slate-100 last:border-0">
                    <div className="flex items-center gap-10 cursor-pointer flex-1">
                      <div className="flex items-center gap-5 min-w-[300px]">
                        <div className="relative">
                          <div className="absolute inset-0 bg-orange-500/20 blur-md rounded-full group-hover/header:bg-orange-500/30 transition-all"></div>
                          <span className="px-4 py-1.5 rounded-xl text-[11px] font-black tracking-widest bg-slate-900 text-white uppercase relative z-10 border border-slate-800 shadow-sm">
                            {project.project_code}
                          </span>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Project Name</p>
                          <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 group-hover/header:text-orange-600 transition-colors">
                            {project.title}
                          </h3>
                        </div>
                      </div>

                      <div className="hidden lg:flex items-center gap-12">
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-black text-center text-slate-400 uppercase tracking-[0.15em]">Client</span>
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center">
                              <HiOutlineUser size={10} className="text-orange-500" />
                            </div>
                            <span className="text-[11px] font-mono text-slate-800 uppercase tracking-tight">
                              {project.clientName || "Direct Client"}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-black text-center text-slate-400 uppercase tracking-[0.15em]">Timeline</span>
                          <div className="flex items-center gap-2">
                            <HiOutlineCalendarDays size={14} className="text-orange-500" />
                            <span className="text-[11px] font-bold text-slate-800 font-mono">
                              {formatDate(project.startDate)} — {formatDate(project.endDate)}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1 items-center">
                          <span className="text-[9px] font-black text-center text-slate-400 uppercase tracking-[0.15em]">No. Of Tasks</span>
                          <span className="text-[11px] font-bold text-slate-800 font-mono">{totalTasks} Tasks</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); openTaskModalForProject(project); }}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 border border-slate-900 hover:bg-orange-500 hover:border-orange-500 text-white transition-all font-black text-[10px] uppercase tracking-widest shadow-xl shadow-orange-100 active:scale-95 cursor-pointer"
                      >
                        <HiOutlinePlusCircle size={16} />
                        <span>Assign Task</span>
                      </button>

                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingProject(project); setShowProjectModal(true); }}
                        className="p-3 rounded-xl border border-slate-200 text-yellow-500 hover:text-yellow-600 hover:border-orange-500 transition-all bg-white shadow-xl cursor-pointer"
                        title="Update Project"
                      >
                        <HiOutlinePencilSquare />
                      </button>

                      <div className={`cursor-pointer transition-all p-2 ml-2 rounded-full text-orange-500 ${expandedProject === project.project_code ? " rotate-180" : ""}`}>
                        <HiChevronDown size={24} />
                      </div>
                    </div>
                  </div>

                  {expandedProject === project.project_code && (
                    <div className="bg-white border-t border-slate-50">
                      {tasks.length > 0 ? (
                        <GroupedTaskTable columns={columns} tasks={tasks} onRowClick={(task) => navigate(`/tasks/${task._id}`)} />
                      ) : (
                        <div className="py-12 flex flex-col items-center justify-center bg-slate-50/50">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No tasks matching filters found.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-[3rem] p-32 text-center border-2 border-dashed border-slate-200">
              <HiOutlineBriefcase size={40} className="text-slate-200 mx-auto mb-6" />
              <p className="text-slate-300 font-black uppercase italic text-xl">No active projects matching filters.</p>
            </div>
          )}
        </div>

        {/* --- FOOTER / PAGINATION --- */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-200 pr-3">Page Limit</span>
              <select
                value={limit}
                onChange={(e) => { setLimit(Number(e.target.value)); setCurrentPage(1); }}
                className="bg-transparent text-[9px] font-black outline-none focus:ring-0 cursor-pointer text-slate-700"
              >
                {[5, 10, 25, 50].map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            {data?.pagination?.totalProjects && (
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight ml-2">
                Total {data?.pagination?.totalProjects} projects
              </span>
            )}
          </div>

          <Pagination
            pagination={{
              current: data?.pagination?.currentPage,
              total: data?.pagination?.totalPages,
              count: data?.pagination?.totalProjects,
              limit: limit,
            }}
            onPageChange={setCurrentPage}
            loading={isFetching}
            label="Projects"
          />
        </div>
      </main>

      <ProjectModal isOpen={showProjectModal} onClose={() => { setShowProjectModal(false); setEditingProject(null); }} editProject={editingProject} />
      <TaskModal
        isOpen={showTaskModal || !!editingTask}
        onClose={() => { setShowTaskModal(false); setEditingTask(null); setPreSelectedProject(null); }}
        editTask={editingTask}
        projects={projectGroups}
        defaultProjectId={preSelectedProject}
      />
      <StatusUpdateModal isOpen={!!statusUpdateTask} onClose={() => setStatusUpdateTask(null)} task={statusUpdateTask} />
    </div>
  );
}
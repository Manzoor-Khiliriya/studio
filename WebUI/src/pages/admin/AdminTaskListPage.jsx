import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useGetAllTasksQuery } from "../../services/taskApi";

// Icons
import {
  HiOutlineMagnifyingGlass,
  HiOutlineXMark,
  HiOutlineCalendarDays,
  HiOutlineUser,
  HiOutlinePencilSquare,
  HiOutlineBriefcase,
  HiChevronDown,
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
  const [limit, setLimit] = useState(5);
  const [expandedProject, setExpandedProject] = useState(null);
  const [dateFilters, setDateFilters] = useState({
    createdAt: "",
    startDate: "",
    endDate: "",
  });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [statusUpdateTask, setStatusUpdateTask] = useState(null);

  // --- DATA FETCHING ---
  // --- DATA FETCHING ---
  const { data, isLoading, isFetching } = useGetAllTasksQuery({
    page: currentPage,
    limit: limit,
    search: searchTerm,
    status: statusFilter === "All" ? undefined : statusFilter,
    ...dateFilters,
  });

  // --- GROUPING LOGIC ---
  const projectGroups = useMemo(() => {
    const tasksArray = data?.tasks || [];
    // Assuming your API returns a 'projects' array in the response
    const allProjects = data?.allProjects || [];

    // 1. Pre-fill the group with ALL existing projects
    const grouped = {};

    allProjects.forEach(proj => {
      grouped[proj.project_code] = {
        project_code: proj.project_code,
        projectTitle: proj.title || "Untitled Project",
        clientName: proj.clientName || "Direct Client",
        startDate: proj.startDate,
        endDate: proj.endDate,
        rawProject: proj,
        taskList: [], // Start with an empty list
      };
    });

    // 2. Distribute tasks into their respective projects
    tasksArray.forEach((task) => {
      const pCode = task.project?.project_code || "UNASSIGNED";

      // If the project wasn't in 'allProjects' (fallback), create it
      if (!grouped[pCode]) {
        grouped[pCode] = {
          project_code: pCode,
          projectTitle: task.project?.title || "Unknown Project",
          clientName: task.project?.clientName || "Direct Client",
          startDate: task.project?.startDate,
          endDate: task.project?.endDate,
          rawProject: task.project,
          taskList: [],
        };
      }
      grouped[pCode].taskList.push(task);
    });

    return Object.values(grouped);
  }, [data]);

  const statusOptions = ["All", "Pending", "In Progress", "Completed", "On Hold"];

  // --- COLUMN DEFINITION ---
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
    setDateFilters({ createdAt: "", startDate: "", endDate: "" });
    setCurrentPage(1);
  };

  const formatDate = (date) => {
    if (!date) return "TBD";
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: '2-digit'
    });
  };

  if (isLoading) return <Loader message="Synchronizing Mission Data..." />;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <PageHeader
        title="Project Control"
        subtitle="Manage operational projects and nested task objectives."
        actionLabel="Assign Task"
        onAction={() => setShowCreateModal(true)}
        secondaryActionLabel="New Project"
        onSecondaryAction={() => {
          setEditingProject(null);
          setShowProjectModal(true);
        }}
      />

      <main className="max-w-[1700px] mx-auto px-8 -mt-10">
        {/* --- FILTER BAR --- */}
        <div className="bg-white/90 backdrop-blur-xl border border-slate-200 p-5 rounded-[2.5rem] shadow-xl shadow-slate-200/50 mb-8 flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[300px] group">
              <HiOutlineMagnifyingGlass
                className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors"
                size={20}
              />
              <input
                type="text"
                placeholder="Search projects or tasks..."
                className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-orange-500 outline-none font-bold text-sm transition-all"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <div className="relative min-w-[200px]">
              <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest block mb-1">
                Status Filter
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-5 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-black uppercase tracking-widest outline-none appearance-none cursor-pointer focus:bg-white text-orange-600"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-4">
              {[
                { label: "Created", key: "createdAt" },
                { label: "Start Date", key: "startDate" },
                { label: "End Date", key: "endDate" },
              ].map((filter) => (
                <div key={filter.key} className="flex flex-col gap-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest">
                    {filter.label}
                  </label>
                  <div className="relative group">
                    <HiOutlineCalendarDays
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      size={16}
                    />
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

        {/* --- PROJECT CARDS LIST --- */}
        <div className="space-y-4 mb-8">
          {projectGroups.length > 0 ? (
            projectGroups.map((group) => {
              // Calculate project-wide progress for the card header
              const totalTasks = group.taskList.length;
              const completedTasks = group.taskList.filter(t => t.status?.toLowerCase() === 'completed').length;
              const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

              return (
                <div
                  key={group.project_code}
                  className={`bg-white rounded-lg border transition-all duration-300 ${expandedProject === group.project_code
                    ? "border-orange-500/30 shadow-xl shadow-orange-500/5"
                    : "border-slate-200 shadow-sm"
                    }`}
                >
                  {/* --- CARD HEADER --- */}
                  <div className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors group/header">
                    <div
                      className="flex items-center gap-8 cursor-pointer flex-1"
                      onClick={() => setExpandedProject(expandedProject === group.project_code ? null : group.project_code)}
                    >
                      {/* Project ID Badge */}
                      <div className="relative">
                        <span className="px-4 py-1 rounded-xl text-[12px] font-black tracking-widest bg-slate-900 text-white uppercase relative z-10">
                          {group.project_code}
                        </span>
                        <div className="absolute inset-0 bg-orange-500 blur-lg opacity-20 scale-75 group-hover/header:scale-110 transition-transform" />
                      </div>

                      <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 flex items-center gap-3">
                        {group.projectTitle}
                        {progressPercent === 100 && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        )}
                      </h3>

                      {/* Integrated Metadata */}
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 text-slate-400">
                          <HiOutlineUser size={14} className="text-orange-500" />
                          <span className="text-[10px] font-black uppercase tracking-widest">
                            Client: <span className="text-slate-900 ml-1">{group.clientName}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400">
                          <HiOutlineCalendarDays size={14} className="text-orange-500" />
                          <span className="text-[10px] font-black uppercase tracking-widest">
                            Timeline: <span className="text-slate-900 ml-1">
                              {formatDate(group.startDate)} — {formatDate(group.endDate)}
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400">
                          <div className="w-24 h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-orange-500 transition-all duration-1000"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-black text-slate-900">{progressPercent}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions Section */}
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => {
                          setEditingProject(group.rawProject);
                          setShowProjectModal(true);
                        }}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-200 text-slate-900 hover:border-orange-500 hover:text-orange-500 hover:bg-orange-50 transition-all font-black text-[10px] uppercase tracking-widest cursor-pointer shadow-sm active:scale-95 bg-white"
                      >
                        <HiOutlinePencilSquare size={16} />
                        Update Project
                      </button>

                      <div
                        onClick={() => setExpandedProject(expandedProject === group.project_code ? null : group.project_code)}
                        className={`cursor-pointer transition-all duration-500 p-3 rounded-xl ${expandedProject === group.project_code
                          ? "text-orange-500 hover:text-orange-600 rotate-180"
                          : " text-slate-400  hover:text-slate-600"
                          }`}
                        title={expandedProject === group.project_code ? "Collapse Task List" : "Expand Task List"}
                      >
                        <HiChevronDown size={24} />
                      </div>
                    </div>
                  </div>

                  {/* --- EXPANDED TABLE CONTENT --- */}
                  {expandedProject === group.project_code && (
                    <div className="bg-white">
                      {group.taskList.length > 0 ? (
                        <GroupedTaskTable
                          columns={columns}
                          tasks={group.taskList}
                          onRowClick={(task) => navigate(`/tasks/${task._id}`)}
                        />
                      ) : (
                        /* EMPTY STATE FOR NEW PROJECT */
                        <div className="py-12 flex flex-col items-center justify-center bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-100 mx-4 my-2">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                            No task assigned to this project.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            /* Empty State */
            <div className="bg-white rounded-[3rem] p-32 text-center border-2 border-dashed border-slate-200 shadow-inner">
              <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <HiOutlineBriefcase size={40} className="text-slate-200" />
              </div>
              <p className="text-slate-300 font-black uppercase italic text-xl tracking-tighter">
                No active missions found in databank.
              </p>
            </div>
          )}
        </div>

        {/* --- PAGINATION FOOTER --- */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-200 pr-3">
              Projects Per Page
            </span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-transparent text-[10px] font-black outline-none cursor-pointer text-slate-700"
            >
              {[5, 10, 25, 50].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <Pagination
            pagination={{
              current: data?.pagination?.currentPage,
              total: data?.pagination?.totalPages,
              count: data?.pagination?.totalTasks,
              limit: limit,
            }}
            onPageChange={setCurrentPage}
            loading={isFetching}
            label="Projects"
          />
        </div>
      </main>

      {/* --- MODALS --- */}
      <ProjectModal
        isOpen={showProjectModal}
        onClose={() => {
          setShowProjectModal(false);
          setEditingProject(null);
        }}
        editProject={editingProject}
      />

      <TaskModal
        isOpen={showCreateModal || !!editingTask}
        onClose={() => {
          setShowCreateModal(false);
          setEditingTask(null);
        }}
        editTask={editingTask}
        projects={data?.allProjects || []}
      />

      <StatusUpdateModal
        isOpen={!!statusUpdateTask}
        onClose={() => setStatusUpdateTask(null)}
        task={statusUpdateTask}
      />
    </div>
  );
}
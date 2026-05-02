import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDeleteProjectMutation, useGetProjectsQuery, useUpdateProjectMutation } from "../../services/projectApi";

import {
  HiOutlineMagnifyingGlass,
  HiOutlineXMark,
  HiOutlineCalendarDays,
  HiOutlineUser,
  HiOutlinePencilSquare,
  HiOutlineBriefcase,
  HiChevronDown,
  HiOutlinePlusCircle,
  HiOutlineCommandLine,
  HiOutlineTrash,
  HiOutlineArrowDownTray,
} from "react-icons/hi2";

import PageHeader from "../../components/PageHeader";
import Loader from "../../components/Loader";
import Pagination from "../../components/Pagination";
import TaskModal from "../../components/TaskModal";
import ProjectModal from "../../components/ProjectModal";
import StatusUpdateModal from "../../components/StatusUpdateModal";
import GroupedTaskTable from "../../components/GroupTable";
import { getAdminTaskColumns } from "../../utils/adminTaskListHelper";
import ConfirmModal from "../../components/ConfirmModal";
import EmployeeAssignModal from "../../components/EmployeeAssignModal";
import { useDeleteTaskMutation } from "../../services/taskApi";
import toast from "react-hot-toast";
import { useSocketEvents } from "../../hooks/useSocketEvents";
import TruncateText from "../../components/TruncateText";
import CustomDropdown from "../../components/CustomDropdown";
import useDebounce from "../../hooks/useDebounce";

export default function AdminTasksPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("live");
  const [taskSearch, setTaskSearch] = useState("");
  const [liveStatusFilter, setLiveStatusFilter] = useState("All");
  const [taskStatusFilter, setTaskStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [expandedProject, setExpandedProject] = useState(null);
  const [liveSearch, setLiveSearch] = useState("");
  const [allSearch, setAllSearch] = useState("");
  const [liveDateFilters, setLiveDateFilters] = useState({
    createdAt: "",
    startDate: "",
    endDate: "",
  });
  const [liveProjectType, setLiveProjectType] = useState("All");
  const [liveProjectStatus, setLiveProjectStatus] = useState("All");
  const [allDateFilters, setAllDateFilters] = useState({
    createdFrom: "",
    createdTo: "",
  });
  const [allProjectType, setAllProjectType] = useState("All");
  const [allProjectStatus, setAllProjectStatus] = useState("All");
  const [liveSelectedProjects, setLiveSelectedProjects] = useState([]);
  const [allSelectedProjects, setAllSelectedProjects] = useState([]);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [preSelectedProject, setPreSelectedProject] = useState(null);
  const [statusUpdateTask, setStatusUpdateTask] = useState(null);
  const [assigningTeamTask, setAssigningTeamTask] = useState(null);
  const [projectToDeactivate, setProjectToDeactivate] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [isTabSwitching, setIsTabSwitching] = useState(false);

  const debouncedLiveSearch = useDebounce(
  liveSearch.length > 1 ? liveSearch : "",
  400
);

const debouncedAllSearch = useDebounce(
  allSearch.length > 1 ? allSearch : "",
  400
);

const debouncedTaskSearch = useDebounce(
  taskSearch.length > 1 ? taskSearch : "",
  400
);

  const [deleteTask, { isLoading: isDeletingTask }] = useDeleteTaskMutation();
  const [updateProject, { isLoading: isDeactivating }] = useUpdateProjectMutation();
  const [deleteProject, { isLoading: isDeletingProject }] = useDeleteProjectMutation();

  const { data, isLoading, isFetching, refetch } = useGetProjectsQuery({
    page: currentPage,
    limit,
    activeTab,
    search: activeTab === "live" ? debouncedLiveSearch : debouncedAllSearch,

    ...(activeTab === "live" && {
      createdAt: liveDateFilters.createdAt,
      startDate: liveDateFilters.startDate,
      endDate: liveDateFilters.endDate,
      taskSearch: debouncedTaskSearch,
      liveStatus: liveStatusFilter,
      taskStatus: taskStatusFilter,
      projectType: liveProjectType,
      status: liveProjectStatus,
    }),

    ...(activeTab !== "live" && {
      createdFrom: allDateFilters.createdFrom,
      createdTo: allDateFilters.createdTo,
      projectType: allProjectType,
      status: allProjectStatus,
    }),
  }, {
    refetchOnMountOrArgChange: false,
    keepUnusedDataFor: 300
  });

  const projectGroups =
    data?.activeTab === activeTab ? data.projects : [];

  useSocketEvents({
    onProjectChange: refetch,
    onTaskChange: refetch,
  });

  const columns = useMemo(
    () => getAdminTaskColumns(
      setEditingTask,
      setStatusUpdateTask,
      setAssigningTeamTask,
      setTaskToDelete
    ),
    [setEditingTask, setStatusUpdateTask, setAssigningTeamTask, setTaskToDelete]
  );

  const selectedProjects =
    activeTab === "live" ? liveSelectedProjects : allSelectedProjects;

  const setSelectedProjects =
    activeTab === "live" ? setLiveSelectedProjects : setAllSelectedProjects;

  // --- BULK HANDLERS ---
  const toggleProjectSelection = (projectId) => {
    setSelectedProjects(prev =>
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProjects.length === projectGroups.length) {
      setSelectedProjects([]);
    } else {
      setSelectedProjects(projectGroups.map(p => p._id));
    }
  };

  const handleConfirmDeleteAction = async () => {
    if (!projectToDeactivate) return;

    try {
      const isBulk = projectToDeactivate._id === "bulk";
      const targetIds = isBulk ? selectedProjects : [projectToDeactivate._id];

      if (activeTab === "live") {
        // TAB 1 LOGIC: Soft delete / Deactivate
        await Promise.all(
          targetIds.map(id => updateProject({ id, deleteStatus: "Enable" }).unwrap())
        );
        toast.success(isBulk ? "Projects deactivated." : "Project deactivated.");
      } else {
        // TAB 2 LOGIC: Permanent delete from DB
        await Promise.all(
          targetIds.map(id => deleteProject(id).unwrap())
        );
        toast.success(isBulk ? "Projects permanently removed." : "Project permanently removed.");
      }

      if (isBulk) setSelectedProjects([]);
    } catch (err) {
      toast.error(err?.data?.message || "Action failed.");
    } finally {
      setProjectToDeactivate(null);
    }
  };

  const handleConfirmDeleteTask = async () => {
    try {
      await deleteTask(taskToDelete._id).unwrap();
      toast.success("Task deleted successfully");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to delete task");
    } finally {
      setTaskToDelete(null);
    }
  };

  const clearFilters = () => {
    setLiveSearch("");
    setAllSearch("");
    setTaskSearch("");

    setLiveStatusFilter("All");
    setTaskStatusFilter("All");

    setLiveDateFilters({
      createdAt: "",
      startDate: "",
      endDate: "",
    });

    setAllDateFilters({
      createdFrom: "",
      createdTo: "",
    });

    setLiveProjectType("All");
    setLiveProjectStatus("All");

    setAllProjectType("All");
    setAllProjectStatus("All");

    setCurrentPage(1);
    setLiveSelectedProjects([]);
    setAllSelectedProjects([]);
  };

  const openTaskModalForProject = (project) => {
    setPreSelectedProject(project._id);
    setShowTaskModal(true);
  };

  const formatDate = (date) => {
    if (!date) return "TBD";
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: '2-digit'
    });
  };

  const handleExportCSV = () => {
    if (!projectGroups || projectGroups.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = [
      "Project Code",
      "Project Name",
      "Project Type",
      "Client",
      "Created Date",
      "Status",
      "No of Tasks",
      "Invoice Number",
      "Invoice Date"
    ];

    const rows = projectGroups.map((p) => [
      p.projectCode,
      p.title,
      p.projectType,
      p.clientName || "Direct Client",
      p.createdAt
        ? new Date(p.createdAt).toLocaleDateString("en-IN")
        : "",
      p.status,
      (p.tasks || []).length,
      p.invoiceNumber || "",
      p.invoiceDate
        ? new Date(p.invoiceDate).toLocaleDateString("en-IN")
        : ""
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.join(","))
      .join("\n");

    const fileName = `projects_${activeTab}_${new Date()
      .toISOString()
      .split("T")[0]}.csv`;

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("CSV downloaded");
  };

  const isProcessing = isDeactivating || isDeletingProject;
  const isFirstTabLoad =
    isFetching &&
    data?.activeTab !== activeTab;
  if (isLoading || isFirstTabLoad) return <Loader message="Synchronizing Project Data..." />;

  return (
    <div className="max-w-[1750px] mx-auto min-h-screen bg-slate-100">
      <PageHeader
        title="Project Management"
        subtitle="Manage operational projects and nested task objectives."
        tabs={[
          { id: "live", label: "Live Projects" },
          { id: "all", label: "All Projects" },
        ]}
        activeTab={activeTab}
        onTabChange={(tabId) => {
          setActiveTab(tabId);
          setCurrentPage(1)
        }}
      />

      <main className="max-w-[1750px] mx-auto px-8 pb-10 -mt-10">
        <div className="bg-white/90 border border-slate-200 p-6 rounded-[2.5rem] shadow-xl shadow-slate-200/50 mb-4 flex flex-col gap-5 overflow-visible">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className={`relative group ${activeTab !== "live" ? "lg:col-span-12" : "lg:col-span-6"}`}>
              <HiOutlineMagnifyingGlass className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={18} />
              <input
                type="text"
                placeholder="Search projects by code or title..."
                placeholder={activeTab === "live" ? "Search projects by code or title..." : "Search projects..."}
                className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/5 outline-none font-bold text-xs transition-all shadow-sm"
                value={activeTab === "live" ? liveSearch : allSearch}
                onChange={(e) => {
                  if (activeTab === "live") {
                    setLiveSearch(e.target.value);
                  } else {
                    setAllSearch(e.target.value);
                  }
                  setCurrentPage(1);
                }}
              />
            </div>

            {activeTab === "live" && (
              <div className="lg:col-span-6 relative group">
                <HiOutlineCommandLine className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input
                  type="text"
                  placeholder="Filter by specific Task Name..."
                  className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none font-bold text-xs transition-all shadow-sm"
                  value={taskSearch}
                  onChange={(e) => { setTaskSearch(e.target.value); setCurrentPage(1); }}
                />
              </div>
            )}
          </div>


          <div className="flex flex-wrap items-end justify-between gap-6 pt-5 border-t border-slate-100">
            <div className="flex flex-wrap items-end gap-7">

              {activeTab === "live" && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest">Live Status</label>
                  <CustomDropdown
                    value={liveStatusFilter}
                    onChange={(val) => {
                      setLiveStatusFilter(val);
                      setCurrentPage(1);
                    }}
                    options={["All", "To be started", "In progress", "Started"]}
                    className="min-w-35"
                  />
                </div>
              )}

              {activeTab === "live" && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest">Initiative Status</label>
                  <CustomDropdown
                    value={taskStatusFilter}
                    onChange={(val) => {
                      setTaskStatusFilter(val);
                      setCurrentPage(1);
                    }}
                    options={[
                      "All",
                      "On hold",
                      "Modeling",
                      "Lighting and Texturing",
                      "Feedback pending",
                      "Final rendering",
                      "Postproduction",
                      "Completed"
                    ]}
                    className="min-w-45"
                  />
                </div>
              )}

              {[
                ...(activeTab === "live"
                  ? [
                    { label: "Created", key: "createdAt" },
                    { label: "Start Date", key: "startDate" },
                    { label: "End Date", key: "endDate" },
                  ]
                  : [
                    { label: "Created From", key: "createdFrom" },
                    { label: "Created To", key: "createdTo" },
                  ]),
              ].map((filter) => (
                <div key={filter.key} className="flex flex-col gap-1.5">
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
                      className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold text-slate-700 outline-none focus:border-orange-500 focus:bg-white transition-all"
                      value={
                        activeTab === "live"
                          ? liveDateFilters[filter.key]
                          : allDateFilters[filter.key]
                      }
                      onChange={(e) => {
                        const value = e.target.value;

                        if (activeTab === "live") {
                          setLiveDateFilters((prev) => ({
                            ...prev,
                            [filter.key]: value,
                          }));
                        } else {
                          setAllDateFilters((prev) => ({
                            ...prev,
                            [filter.key]: value,
                          }));
                        }

                        setCurrentPage(1);
                      }}
                    />
                  </div>
                </div>
              ))}

              {/* Add these inside the same div containing your other <select> filters */}

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest">Project Type</label>
                <CustomDropdown
                  value={activeTab === "live" ? liveProjectType : allProjectType}
                  onChange={(val) => {
                    if (activeTab === "live") {
                      setLiveProjectType(val);
                    } else {
                      setAllProjectType(val);
                    }
                    setCurrentPage(1);
                  }}
                  options={["All", "Standard", "Revision"]}
                  className="min-w-35"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest">Project Status</label>
                <CustomDropdown
                  value={activeTab === "live" ? liveProjectStatus : allProjectStatus}
                  onChange={(val) => {
                    if (activeTab === "live") {
                      setLiveProjectStatus(val);
                    } else {
                      setAllProjectStatus(val);
                    }
                    setCurrentPage(1);
                  }}
                  options={["All", "Active", "Submitted", "On hold", "Inactive"]}
                  className="min-w-35"
                />
              </div>

              {activeTab === "live" && (
                <button
                  onClick={() => {
                    setEditingProject(null);
                    setShowProjectModal(true);
                  }}
                  className="block flex items-center gap-2 mx-1.5 px-3.5 py-4 bg-black hover:bg-orange-600 text-white rounded-xl transition-all font-black text-[10px] uppercase tracking-widest shadow-lg shadow-orange-200 cursor-pointer active:scale-95"
                >
                  <HiOutlinePlusCircle size={18} />
                  <span>Add Project</span>
                </button>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest">Selection for Delete</label>
                <div className="flex items-center gap-3 bg-slate-100/50 px-4 py-2 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    className="w-4 h-5 accent-orange-500 cursor-pointer"
                    checked={projectGroups.length > 0 && selectedProjects.length === projectGroups.length}
                    onChange={handleSelectAll}
                  />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Select All</span>
                </div>
              </div>

              {activeTab !== "live" && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Export</label>
                  <div className="flex items-center justify-center">
                    <button
                      onClick={handleExportCSV}
                      className=" p-2 mb-0.5 bg-slate-100/50 text-slate-900 border border-slate-200 rounded-xl hover:text-orange-600 transition-all cursor-pointer shadow-sm"
                      title="Export to CSV"
                    >
                      <HiOutlineArrowDownTray size={18} />
                    </button> </div>
                </div>

              )}

              <div className="flex items-center gap-3">
                {selectedProjects.length > 0 && (
                  <button
                    onClick={() => setProjectToDeactivate({ _id: "bulk", title: `${selectedProjects.length} selected projects` })}
                    className="flex items-center gap-2 px-6 py-3 text-white bg-rose-600 hover:bg-rose-700 rounded-2xl transition-all font-black text-[10px] tracking-widest cursor-pointer shadow-lg shadow-rose-100"
                  >
                    <HiOutlineTrash size={18} />
                    <span>DELETE SELECTED ({selectedProjects.length})</span>
                  </button>
                )}

                {(
                  (activeTab === "live"
                    ? liveSearch
                    : allSearch) ||

                  (activeTab === "live" && taskSearch) ||

                  (activeTab === "live" && liveStatusFilter !== "All") ||

                  (activeTab === "live" && taskStatusFilter !== "All") ||

                  (activeTab === "live" &&
                    (liveDateFilters.createdAt ||
                      liveDateFilters.startDate ||
                      liveDateFilters.endDate)) ||

                  (activeTab !== "live" &&
                    (allDateFilters.createdFrom || allDateFilters.createdTo)) ||

                  (
                    activeTab === "live"
                      ? (
                        liveSearch ||
                        taskSearch ||
                        liveStatusFilter !== "All" ||
                        taskStatusFilter !== "All" ||
                        liveDateFilters.createdAt ||
                        liveDateFilters.startDate ||
                        liveDateFilters.endDate ||
                        liveProjectType !== "All" ||
                        liveProjectStatus !== "All"
                      )
                      : (
                        allSearch ||
                        allDateFilters.createdFrom ||
                        allDateFilters.createdTo ||
                        allProjectType !== "All" ||
                        allProjectStatus !== "All"
                      )
                  )
                ) && (
                    <button
                      onClick={clearFilters}
                      className="flex items-center gap-2 px-6 py-3 text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-2xl transition-all font-black text-[10px] tracking-widest cursor-pointer"
                    >
                      <HiOutlineXMark size={18} strokeWidth={2.5} />
                      <span>RESET FILTERS</span>
                    </button>
                  )}
              </div>
            </div>



            {activeTab !== "live" && (
              <div className="flex items-center gap-2">
                {data?.pagination?.totalProjects && (
                  <span className="text-[12px] font-bold text-slate-600 uppercase tracking-tight ml-2">
                    Total {data?.pagination?.totalProjects ?? 0} projects
                  </span>
                )}

                {data?.pagination?.totalTasks !== undefined && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span className="text-[12px] font-bold text-slate-600 uppercase tracking-tight">
                      {data.pagination.totalTasks} Total Tasks
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* --- PROJECT CARDS LIST --- */}
        <div className="space-y-2 mb-4">
          {projectGroups.length > 0 ? (
            projectGroups.map((project) => {
              const tasks = project.tasks || [];
              const totalTasks = tasks.length;
              const isSelected = selectedProjects.includes(project._id);

              return (
                <div key={project._id} className={`bg-white rounded-lg border transition-all duration-300 cursor-pointer ${isSelected ? "border-orange-500 bg-orange-50/20" : expandedProject === project.projectCode ? "border-orange-500/30 shadow-xl shadow-orange-500/5" : "border-slate-200 shadow-sm"}`}
                  onClick={() => {
                    if (activeTab === "live") {
                      setExpandedProject(
                        expandedProject === project.projectCode ? null : project.projectCode
                      );
                    }
                  }}
                >
                  <div className="px-6 py-2 flex items-start justify-between flex-wrap gap-2 hover:bg-slate-50/80 transition-all group/header border-b border-slate-100 last:border-0">
                    <div className="flex items-start gap-10 cursor-pointer flex-1">
                      <div className="flex items-start flex-wrap gap-3 min-w-[300px]">
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Project Code</p>
                          <h3 className="text-sm font-black uppercase tracking-tight text-slate-900 group-hover/header:text-orange-600 transition-colors">
                            {project.projectCode}
                          </h3>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Project Name</p>
                          <TruncateText maxWidth="max-w-[200px]"
                            text={project.title}
                            className="text-sm font-black uppercase tracking-tight text-slate-900 group-hover/header:text-orange-600 transition-colors"
                          />
                        </div>
                      </div>

                      <div className="flex items-start gap-5">
                        <div className="flex flex-col gap-1 items-center">
                          <span className="text-[9px] font-black text-center text-slate-400 uppercase tracking-[0.15em]">Project Type</span>
                          <span className="text-[11px] font-bold text-slate-800 font-mono">{project.projectType}</span>
                        </div>

                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-black text-left text-slate-400 uppercase tracking-[0.15em]">Client</span>
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center">
                              <HiOutlineUser size={10} className="text-orange-500" />
                            </div>
                            <TruncateText
                              text={project.clientName || "Direct Client"}
                              className="text-[11px] font-bold w-30 text-slate-800 font-mono uppercase"
                            />
                          </div>
                        </div>

                        {activeTab === "live" ? (
                          <div className="flex flex-col justify-center items-center w-[180px] gap-1">
                            <span className="text-[9px] font-black text-center text-slate-400 uppercase tracking-[0.15em]">Timeline</span>
                            <div className="flex items-center gap-2">
                              <HiOutlineCalendarDays size={14} className="text-orange-500" />
                              <span className="text-[11px] font-bold text-slate-800 font-mono">
                                {formatDate(project.startDate)} — {formatDate(project.endDate)}
                              </span>
                            </div>
                          </div>) : (
                          <div className="flex flex-col justify-center items-center w-[90px] gap-1">
                            <span className="text-[9px] font-black text-center text-slate-400 uppercase tracking-[0.15em]">Created Date</span>
                            <div className="flex items-center gap-2">
                              <HiOutlineCalendarDays size={14} className="text-orange-500" />
                              <span className="text-[11px] font-bold text-slate-800 font-mono">
                                {formatDate(project.createdAt)}
                              </span>
                            </div>
                          </div>
                        )}

                        <div className="flex flex-col justify-center w-[90px] gap-1 items-center">
                          <span className="text-[9px] font-black text-center text-slate-400 uppercase tracking-[0.15em]">No. Of Tasks</span>
                          <span className="text-[11px] font-bold text-slate-800 font-mono">{totalTasks} Tasks</span>
                        </div>

                        <div className="flex flex-col gap-1 justify-center items-center w-[80px]">
                          <span className="text-[9px] font-black text-center text-slate-400 uppercase tracking-[0.15em]">Status</span>
                          <span className="text-[11px] font-bold text-slate-800 font-mono">{project.status}</span>
                        </div>

                        <div className="flex flex-col gap-1 items-center">
                          <span className="text-[9px] font-black text-center text-slate-400 uppercase tracking-[0.15em]">Date of Status</span>
                          <span className="text-[11px] font-bold text-slate-800 font-mono">{project?.statusChangedAt ? formatDate(project?.statusChangedAt) : "dd-mmm-yy"}</span>
                        </div>

                        {activeTab === "all" && (
                          <>
                            <div className="flex flex-col gap-1 items-center">
                              <span className="text-[9px] font-black text-center text-slate-400 uppercase tracking-[0.15em]">Invoice Number</span>
                              <span className="text-[11px] font-bold text-slate-800 font-mono">{project?.invoiceNumber || "N/A"}</span>
                            </div>

                            <div className="flex flex-col gap-1 items-center">
                              <span className="text-[9px] font-black text-center text-slate-400 uppercase tracking-[0.15em]">Invoice Date</span>
                              <span className="text-[11px] font-bold text-slate-800 font-mono">{project?.invoiceDate ? formatDate(project.invoiceDate) : "dd-mmm-yy"}</span>
                            </div>
                          </>
                        )}

                      </div>
                    </div>

                    {/* ACTION BUTTONS + CHECKBOX */}
                    <div className="flex items-center gap-2">
                      {activeTab === "live" && (
                        <button
                          onClick={(e) => { e.stopPropagation(); openTaskModalForProject(project); }}
                          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 border border-slate-900 hover:bg-orange-500 hover:border-orange-500 text-white transition-all font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 cursor-pointer"
                        >
                          <HiOutlinePlusCircle size={16} />
                          <span>Add Task</span>
                        </button>
                      )}

                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingProject(project); setShowProjectModal(true); }}
                        className="p-3 rounded-xl border border-slate-200 text-yellow-500 hover:text-yellow-600 hover:border-orange-500 transition-all bg-white shadow-xl cursor-pointer"
                        title="Update Project"
                      >
                        <HiOutlinePencilSquare />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setProjectToDeactivate(project);
                        }}
                        className="p-3 rounded-xl border border-slate-200 text-rose-500 hover:text-rose-600 hover:border-rose-500 transition-all bg-white shadow-xl cursor-pointer"
                        title="Delete Project"
                      >
                        <HiOutlineTrash />
                      </button>

                      {/* SELECTION CHECKBOX (Right Aligned) */}
                      <div
                        className={`px-3 py-2.5 flex items-center rounded-xl border hover:border-orange-500  transition-all ${isSelected ? 'bg-orange-500 border-orange-500' : 'bg-white border-slate-200'}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleProjectSelection(project._id)}
                          className="w-4 h-5 accent-white cursor-pointer"
                          title="Select To Delete Project"
                        />
                      </div>

                      {activeTab === "live" && (
                        <div className={`cursor-pointer transition-all p-2 ml-2 rounded-full text-orange-500 ${expandedProject === project.projectCode ? " rotate-180" : ""}`}>
                          <HiChevronDown size={24} />
                        </div>
                      )}
                    </div>
                  </div>

                  {activeTab === "live" && expandedProject === project.projectCode && (
                    <div className="bg-white border-t border-slate-50">
                      {tasks.length > 0 ? (
                        <GroupedTaskTable columns={columns} tasks={tasks} onRowClick={(task) => navigate(`/projects/${task._id}`)} />
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
              <p className="text-slate-300 font-black uppercase italic text-xl">No projects found.</p>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="flex items-center gap-2">
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
            {activeTab === "live" && (
              <>
                {data?.pagination?.totalProjects && (
                  <span className="text-[12px] font-bold text-slate-600 uppercase tracking-tight ml-2">
                    Total {data?.pagination?.totalProjects ?? 0} projects
                  </span>
                )}

                {data?.pagination?.totalTasks !== undefined && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span className="text-[12px] font-bold text-slate-600 uppercase tracking-tight">
                      {data.pagination.totalTasks} Total Tasks
                    </span>
                  </>
                )}
              </>
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

      <ProjectModal isOpen={showProjectModal} onClose={() => { setShowProjectModal(false); setEditingProject(null); }} editProject={editingProject} activeTab={activeTab} />
      <TaskModal
        isOpen={showTaskModal || !!editingTask}
        onClose={() => {
          setShowTaskModal(false);
          setEditingTask(null);
          setPreSelectedProject(null);
        }}
        editTask={editingTask}
        singleProject={
          projectGroups.find(p =>
            p._id === (editingTask?.project?._id || editingTask?.project || preSelectedProject)
          )
        }
      />
      <StatusUpdateModal isOpen={!!statusUpdateTask} onClose={() => setStatusUpdateTask(null)} task={statusUpdateTask} />

      <ConfirmModal
        isOpen={!!projectToDeactivate}
        onClose={() => setProjectToDeactivate(null)}
        onConfirm={handleConfirmDeleteAction}
        isLoading={isProcessing}
        title={activeTab === "live" ? "Deactivate Project" : "PERMANENT Delete"}
        message={
          activeTab === "live"
            ? `Moving "${projectToDeactivate?.title}" to the inactive list...`
            : `WARNING: This will permanently erase "${projectToDeactivate?.title}" from the database. This cannot be undone.`
        }
        variant="danger"
      />

      <EmployeeAssignModal
        isOpen={!!assigningTeamTask}
        onClose={() => setAssigningTeamTask(null)}
        task={assigningTeamTask}
      />

      <ConfirmModal
        isOpen={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        onConfirm={handleConfirmDeleteTask}
        isLoading={isDeletingTask}
        title="Delete Task"
        message={`Are you sure you want to permanently delete the task "${taskToDelete?.title}"? This action cannot be undone.`}
        variant="danger"
      />
    </div>
  );
}
import React, { useState, useEffect, useRef } from "react";
import {
  HiOutlineMagnifyingGlass,
  HiOutlineCpuChip,
  HiOutlineRocketLaunch,
  HiOutlinePauseCircle,
  HiOutlineCheckBadge,
  HiOutlineFlag
} from "react-icons/hi2";
import { toast, Toaster } from "react-hot-toast";

// API & Hooks
import { useGetMyTasksQuery } from "../../services/taskApi";
import {
  useStartTimerMutation,
  useStopTimerMutation,
  useGetMyTodayLogsQuery
} from "../../services/timeLogApi";

// Components
import PageHeader from "../../components/PageHeader";
import Table from "../../components/Table";
import Loader from "../../components/Loader";
import Pagination from "../../components/Pagination";

export default function MyTasksPage() {
  // --- STATE ---
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [runningTaskId, setRunningTaskId] = useState(null);
  const limit = 8;

  // --- DATA FETCHING ---
  const { data, isLoading, isFetching } = useGetMyTasksQuery({
    page: currentPage,
    limit,
    search: searchTerm,
    status: statusFilter === "All" ? "" : statusFilter
  });

  const { data: logsData } = useGetMyTodayLogsQuery();
  const [startTimer] = useStartTimerMutation();
  const [stopTimer] = useStopTimerMutation();

  // --- SYNC RUNNING TASK ---
  useEffect(() => {
    const activeLog = logsData?.logs?.find(log => log.isRunning);
    setRunningTaskId(activeLog?.task?._id || activeLog?.task || null);
  }, [logsData]);

  // --- HANDLERS ---
  const handleToggleTimer = async (taskId) => {
    try {
      if (runningTaskId === taskId) {
        await stopTimer().unwrap();
        toast.success("Mission Logs Synchronized");
      } else {
        await startTimer({ taskId }).unwrap();
        toast.success("Mission Uplink Established");
      }
    } catch (err) {
      toast.error(err?.data?.message || "Protocol Failure");
    }
  };

const headerClass = "text-[10px] font-black uppercase tracking-widest text-slate-400";

const renderStatusBadge = (status) => {
  const themes = {
    completed: "text-emerald-600 bg-emerald-50",
    "on hold": "text-blue-600 bg-blue-50",
    "feedback pending": "text-yellow-600 bg-yellow-50",
    "final rendering": "text-orange-600 bg-orange-50",
    postproduction: "text-purple-600 bg-purple-50",
  };
  const themeClass = themes[status?.toLowerCase()] || "text-slate-500 bg-slate-50";
  return (
    <span className={`inline-block text-[9px] font-black px-3 py-1 rounded-full tracking-widest ${themeClass}`}>
      {status}
    </span>
  );
};

const getLiveStatusColor = (status) => {
  const statusMap = {
    "in progress": "text-green-600",
    "started": "text-blue-600",
  };
  return statusMap[status?.toLowerCase()] || "text-yellow-600";
};

const columns = [
  {
    header: <span className={headerClass}>Project Info</span>,
    className: "text-left",
    render: (row) => (
      <div className="flex flex-col py-2">
        <span className="text-[10px] font-black text-blue-600 uppercase tracking-tighter">
          {row.project?.projectCode || "INTERNAL"}
        </span>
        <p className="text-[11px] font-bold text-slate-900 uppercase truncate max-w-[150px] group-hover:text-orange-600 transition-colors">
          {row.project?.title || "Direct Assignment"}
        </p>
      </div>
    ),
  },
  {
    header: <span className={headerClass}>Mission Parameters</span>,
    className: "text-left",
    render: (row) => (
      <div className="flex flex-col py-2">
        <p className={`font-black text-[11px] uppercase tracking-tight ${runningTaskId === row._id ? 'text-orange-600 animate-pulse' : 'text-slate-800'}`}>
          {row.title}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-tighter ${row.priority === 'High' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
            {row.priority} PRIORITY
          </span>
          <span className="text-[9px] font-bold text-slate-400 italic line-clamp-1 max-w-[120px]">
            {row.description || "No details provided."}
          </span>
        </div>
      </div>
    ),
  },
  {
    header: <span className={headerClass}>Resource Usage</span>,
    className: "text-left",
    render: (row) => {
      const consumedHours = (row.totalLoggedSeconds || 0) / 3600;
      const progress = Math.min((consumedHours / (row.allocatedTime || 1)) * 100, 100);
      const isWarning = progress > 90;

      return (
        <div className="flex flex-col min-w-[160px]">
          <div className="flex justify-between items-end mb-1">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              <span className="text-slate-900">{consumedHours.toFixed(1)}h</span> / {(row.allocatedTime || 0).toFixed(1)}h
            </span>
            <span className={`text-[10px] font-black ${isWarning ? "text-rose-600" : "text-emerald-600"}`}>
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-700 rounded-full ${isWarning ? "bg-rose-500 animate-pulse" : "bg-emerald-500"}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      );
    },
  },
  {
    header: <span className={headerClass}>Live Status</span>,
    render: (row) => (
      <span className={`text-[9px] font-black uppercase ${getLiveStatusColor(row.liveStatus)}`}>
        {row.liveStatus || "To Be Started"}
      </span>
    ),
  },
  {
    header: <span className={headerClass}>Initiative Status</span>,
    render: (row) => renderStatusBadge(row.status),
  }
];

  if (isLoading) return <Loader message="Accessing Command Data..." />;

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Toaster position="bottom-right" />

      <PageHeader
        title="My Deployments"
        subtitle="Individual mission log and real-time operational status."
      />

      <main className="max-w-[1700px] mx-auto px-10 -mt-10 pb-20">

        {/* TACTICAL FILTER BAR */}
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200 p-5 rounded-[2.5rem] shadow-xl shadow-slate-200/40 mb-8 flex flex-col md:flex-row gap-6 items-center">

          <div className="relative flex-1 group w-full">
            <HiOutlineMagnifyingGlass className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500" size={20} />
            <input
              type="text"
              placeholder="Filter by Mission Parameters..."
              className="w-full pl-16 pr-8 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm focus:bg-white focus:border-orange-500/50 transition-all"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>

          <div className="flex bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200/50 w-full md:w-auto">
            {["All", "Pending", "In Progress", "Completed"].map((status) => (
              <button
                key={status}
                onClick={() => { setStatusFilter(status); setCurrentPage(1); }}
                className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === status ? "bg-white text-orange-600 shadow-md" : "text-slate-400 hover:text-slate-600"
                  }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* DATA TERMINAL */}
        <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className={isFetching ? "opacity-40" : "opacity-100"}>
            <Table
              columns={columns}
              data={data?.tasks || []}
              emptyMessage="No personal missions detected in current sector."
            />
          </div>

          {/* FOOTER */}
          <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <HiOutlineCpuChip className="text-orange-500" size={20} />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                Active Tasks: {data?.totalTasks || 0}
              </span>
            </div>
            <Pagination
              pagination={{
                current: data?.currentPage,
                total: data?.totalPages,
                count: data?.totalTasks,
                limit: limit
              }}
              onPageChange={setCurrentPage}
              loading={isFetching}
            />
          </div>
        </div>

      </main>
    </div>
  );
}
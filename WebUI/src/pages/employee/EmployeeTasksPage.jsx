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

  // --- TABLE COLUMNS ---
  const columns = [
    {
      header: "Project Info",
      render: (row) => (
        <div className="flex flex-col py-2">
          <span className="text-[10px] font-black text-blue-600 uppercase tracking-tighter">
            {row.project?.projectCode || "N/A"}
          </span>
          <p className="text-[11px] font-bold text-slate-500 uppercase truncate max-w-[150px]">
            {row.project?.title || "Internal Task"}
          </p>
        </div>
      )
    },
    {
      header: "Task Parameters",
      render: (row) => (
        <div className="flex flex-col py-2">
          <p className={`font-black text-sm uppercase tracking-tight ${runningTaskId === row._id ? 'text-orange-600 animate-pulse' : 'text-slate-800'}`}>
            {row.title}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${row.priority === 'High' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'
              }`}>
              {row.priority} Priority
            </span>
          </div>
        </div>
      )
    },
    {
      header: "Timeline",
      render: (row) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-slate-600">
            <HiOutlineFlag size={14} className="text-slate-400" />
            <span className="text-[10px] font-black uppercase tracking-tight">
              {row.project?.endDate ? new Date(row.project.endDate).toLocaleDateString('en-GB') : 'No Date'}
            </span>
          </div>
          <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">
            Est: {row.allocatedTime || 0} Hours
          </p>
        </div>
      )
    },
    {
      header: "Deployment Status",
      render: (row) => {
        // Calculate progress percentage (if you have spentTime from backend)
        const progress = Math.min(((row.totalLoggedSeconds / 3600) / row.allocatedTime) * 100, 100) || 0;

        return (
          <div className="flex flex-col w-32">
            <div className="flex justify-between mb-1">
              <span className="text-[9px] font-black uppercase text-slate-500">{row.status}</span>
              <span className="text-[9px] font-black text-slate-400">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${row.status === 'Completed' ? 'bg-emerald-500' : 'bg-orange-500'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        );
      }
    },
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
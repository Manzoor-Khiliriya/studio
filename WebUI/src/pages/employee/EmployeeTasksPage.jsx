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
      header: "Mission ID",
      render: (row) => (
        <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100 uppercase">
          {row.projectNumber || "OP-TASK"}
        </span>
      )
    },
    {
      header: "Parameters",
      render: (row) => (
        <div className="flex flex-col py-2">
          <p className={`font-black text-sm uppercase tracking-tight ${runningTaskId === row._id ? 'text-orange-600 animate-pulse' : 'text-slate-800'}`}>
            {row.title}
          </p>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Sector: {row.category || "General"}
          </span>
        </div>
      )
    },
    {
      header: "Deployment Status",
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className={`h-1.5 w-1.5 rounded-full ${row.status === 'Completed' ? 'bg-emerald-500' : 'bg-orange-500'}`} />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">
            {row.status}
          </span>
        </div>
      )
    },
    {
      header: "Execution",
      className: "text-right pr-8",
      render: (row) => {
        const isRunning = runningTaskId === row._id;
        const isCompleted = row.status === "Completed";

        if (isCompleted) return <HiOutlineCheckBadge className="text-emerald-500 ml-auto" size={24} />;

        return (
          <button
            onClick={() => handleToggleTimer(row._id)}
            disabled={runningTaskId && !isRunning}
            className={`flex items-center gap-3 px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ml-auto border-2 ${
              isRunning 
              ? "bg-slate-900 text-white border-slate-900 shadow-lg" 
              : "bg-white text-slate-900 border-slate-100 hover:border-orange-500"
            } ${(runningTaskId && !isRunning) ? 'opacity-20 grayscale pointer-events-none' : 'cursor-pointer'}`}
          >
            {isRunning ? (
              <><HiOutlinePauseCircle size={18} /> STOP SESSION</>
            ) : (
              <><HiOutlineRocketLaunch size={18} /> DEPLOY</>
            )}
          </button>
        );
      }
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
                className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  statusFilter === status ? "bg-white text-orange-600 shadow-md" : "text-slate-400 hover:text-slate-600"
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

        {/* MISSION STRATEGY CARD */}
        <div className="mt-12 p-10 bg-slate-900 rounded-[3.5rem] relative overflow-hidden group shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-orange-500">
                <HiOutlineFlag size={32} />
              </div>
              <div>
                <h4 className="text-white font-black text-xl uppercase tracking-tight">Mission Accuracy</h4>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Ensure your live logs align with your objective deadlines.</p>
              </div>
            </div>
            <button className="px-10 py-4 bg-orange-500 text-white font-black text-[10px] uppercase tracking-[0.3em] rounded-2xl hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/20">
              View Performance Reports
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiClock, FiCoffee, FiPlay, FiSquare, FiZap,
  FiTarget, FiActivity, FiSearch, FiMoon, FiZapOff
} from "react-icons/fi";
import { toast, Toaster } from "react-hot-toast";

// Reusable Components
import Table from "../components/Table";
import Pagination from "../components/Pagination";
import Loader from "../components/Loader";

// RTK Query Hooks
import { useGetMyTasksQuery } from "../services/taskApi";
import {
  useGetMyTodayLogsQuery,
  useStartTimerMutation,
  useTogglePauseMutation,
  useStopTimerMutation
} from "../services/timeLogApi";

export default function MyTasksPage() {
  const timerRef = useRef(null);

  // --- TIMER & STATS STATE ---
  const [seconds, setSeconds] = useState(0);
  const [todayTotalSeconds, setTodayTotalSeconds] = useState(0);
  const [runningTaskId, setRunningTaskId] = useState(null);
  const [isOnBreak, setIsOnBreak] = useState(false);

  // --- BACKEND FILTER & PAGINATION STATE ---
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // --- DATA FETCHING ---
  const { data, isLoading: tasksLoading } = useGetMyTasksQuery({
    page: currentPage,
    limit: itemsPerPage,
    search: debouncedSearch,
    status: statusFilter
  });

  const { data: logsData, isSuccess: logsLoaded } = useGetMyTodayLogsQuery();

  // --- MUTATIONS ---
  const [startTimer] = useStartTimerMutation();
  const [togglePause] = useTogglePauseMutation();
  const [stopTimer] = useStopTimerMutation();

  // --- DATA ASSIGNMENT ---
  const tasks = data?.tasks || [];
  const paginationInfo = {
    current: data?.pagination?.current || 1,
    total: data?.pagination?.totalPages || 1, // Map totalPages -> total
    count: data?.pagination?.totalTasks || 0  // Map totalTasks -> count
  };

  useEffect(() => setCurrentPage(1), [debouncedSearch, statusFilter]);

  // --- TIME SYNC LOGIC ---
  useEffect(() => {
    if (logsLoaded && logsData?.logs) {
      const localToday = new Date().toLocaleDateString('en-CA');
      let totalTodaySec = 0;
      let activeId = null;
      let activeBreak = logsData.isCurrentlyOnBreak || false;

      logsData.logs.forEach(log => {
        const logDate = new Date(log.startTime).toLocaleDateString('en-CA');
        if (logDate === localToday && !log.isRunning && log.logType === "work") {
          totalTodaySec += (log.durationSeconds || 0);
        }

        if (log.isRunning) {
          activeId = log.task?._id || log.task;
          const previouslyEarned = log.durationSeconds || 0;

          if (activeBreak) {
            setSeconds(previouslyEarned);
          } else {
            const sessionStart = new Date(log.startTime);
            const currentSessionSec = Math.floor((Date.now() - sessionStart.getTime()) / 1000);
            setSeconds(previouslyEarned + currentSessionSec);
          }
        }
      });

      setRunningTaskId(activeId);
      setIsOnBreak(activeBreak);
      setTodayTotalSeconds(totalTodaySec);
    }
  }, [logsData, logsLoaded]);

  // LIVE TICKER
  useEffect(() => {
    if (runningTaskId && !isOnBreak) {
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [runningTaskId, isOnBreak]);

  // --- HANDLERS ---
  const handleStart = async (taskId) => {
    try {
      await startTimer({ taskId }).unwrap();
      toast.success("Mission Authorized");
    } catch (err) {
      toast.error(err.data?.message || "Protocol Error");
    }
  };

  const handleStop = async () => {
    if (!window.confirm("End mission and synchronize logs with Central Command?")) return;
    try {
      await stopTimer().unwrap();
      setSeconds(0);
      toast.success("Logs Synchronized");
    } catch {
      toast.error("Synchronization Failed");
    }
  };

  const handlePause = async () => {
    try {
      await togglePause().unwrap();
      toast(isOnBreak ? "Resuming Mission..." : "Operator on Break", { icon: isOnBreak ? "🚀" : "☕" });
    } catch {
      toast.error("Pause Protocol Interrupted");
    }
  };

  const formatTime = (totalSec) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const columns = [
    {
      header: "Project ID",
      render: (row) => (
        <div className="flex items-center gap-2 text-slate-900 font-black text-[10px] bg-slate-100 w-fit px-4 py-2 rounded-xl border border-slate-200 uppercase tracking-tighter">
          <FiTarget className="text-orange-500" /> {row.projectNumber || "TBD-00"}
        </div>
      )
    },
    {
      header: "Mission Parameters",
      render: (row) => (
        <div className="flex flex-col">
          <p className={`font-black text-sm uppercase tracking-tight transition-all ${runningTaskId === row._id ? 'text-orange-600 italic' : 'text-slate-800'}`}>
            {row.title}
          </p>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{row.category || "General Ops"}</span>
        </div>
      )
    },
    {
      header: "Status",
      render: (row) => (
        <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${row.status === "Completed" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-orange-50 text-orange-500 border-orange-100"
          }`}>
          {row.status}
        </span>
      )
    },
    {
      header: "Action",
      className: "text-right",
      render: (row) => {
        const isRunning = runningTaskId === row._id;
        if (row.status === "Completed") return <span className="text-[9px] font-black text-slate-300 italic pr-4">LOCKED / ARCHIVED</span>;
        return (
          <div className="flex justify-end pr-4">
            <button
              onClick={() => isRunning ? handleStop() : handleStart(row._id)}
              disabled={isOnBreak && !isRunning}
              className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 border-2 ${isRunning
                ? "bg-slate-900 text-white border-slate-900 shadow-2xl shadow-slate-300"
                : "bg-white text-slate-900 border-slate-100 hover:border-orange-500 hover:text-orange-600 shadow-sm"
                } ${isOnBreak && !isRunning ? "opacity-20 cursor-not-allowed" : ""}`}
            >
              {isRunning ? "Stop Session" : "Start"}
            </button>
          </div>
        );
      }
    }
  ];

  if (tasksLoading) return <Loader message="Accessing Command Data..." />;

  return (
    <div className="max-w-[1600px] mx-auto p-10 pb-32">
      <Toaster position="bottom-right" />

      {/* TELEMETRY HEADER */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-10 mb-16">
        <div>
          <h1 className="text-8xl font-black tracking-tighter text-slate-900 uppercase italic leading-none">Command Center</h1>
          <p className="text-slate-400 font-black uppercase text-[11px] tracking-[0.4em] mt-4 flex items-center gap-3">
            <FiActivity className="text-orange-500" /> Sector 7 Active Personnel Log
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 w-full xl:w-auto">
          {/* TODAY TOTAL */}
          <div className="p-10 bg-slate-50 rounded-[3rem] border border-slate-100 flex-1 min-w-[280px]">
            <p className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-400 mb-2">Cycle Accumulation</p>
            <h3 className="text-4xl font-black text-slate-900 tabular-nums">
              {formatTime(todayTotalSeconds + (isOnBreak ? 0 : seconds))}
            </h3>
          </div>

          {/* ACTIVE LIVE TIMER */}
          <div className={`p-10 rounded-[3rem] border-2 flex-1 min-w-[320px] transition-all duration-500 ${runningTaskId ? 'bg-slate-900 text-white border-slate-900 shadow-3xl' : 'bg-white border-dashed border-slate-200 text-slate-300'}`}>
            {!runningTaskId ? (
              <div className="h-full flex flex-col justify-center">
                <p className="text-[10px] font-black uppercase tracking-widest italic flex items-center gap-2">
                  <FiZapOff /> System Standby
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`h-2 w-2 rounded-full ${isOnBreak ? 'bg-blue-400' : 'bg-orange-500 animate-pulse'}`} />
                    <p className={`text-[10px] uppercase font-black tracking-widest ${isOnBreak ? 'text-blue-400' : 'text-orange-500'}`}>
                      {isOnBreak ? 'Standby Mode' : 'Live Uplink'}
                    </p>
                  </div>
                  <h3 className="text-5xl font-black tabular-nums italic tracking-tighter">
                    {formatTime(seconds)}
                  </h3>
                </div>
                <button
                  onClick={handlePause}
                  className={`p-6 rounded-3xl transition-all shadow-xl ${isOnBreak ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-orange-500 text-white hover:bg-orange-600'}`}
                >
                  {isOnBreak ? <FiPlay size={28} /> : <FiCoffee size={28} />}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MISSION CONTROL TERMINAL */}
      <div className="bg-white rounded-[4rem] border border-slate-100 shadow-2xl overflow-hidden relative min-h-[700px]">

        {/* TERMINAL HEADER */}
        <div className="p-12 border-b border-slate-50 bg-slate-50/20 flex flex-col lg:flex-row gap-10 justify-between items-center">
          <div className="relative w-full lg:w-[500px] group">
            <FiSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-500 transition-colors" size={20} />
            <input
              type="text"
              placeholder="Filter by Mission Title or Project Code..."
              className="w-full pl-16 pr-8 py-5 bg-white border-2 border-slate-100 rounded-[2rem] text-sm font-bold focus:border-orange-500/20 transition-all outline-none shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 bg-slate-100/50 p-2 rounded-[2rem] border border-slate-100">
            {["All", "Pending", "In Progress", "Completed"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all ${statusFilter === status
                  ? "bg-slate-900 text-white shadow-2xl"
                  : "text-slate-400 hover:text-slate-600"
                  }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* DATA HUB */}
        <div className="p-4">
          <Table
            columns={columns}
            data={tasks}
            loading={tasksLoading}
            emptyMessage={debouncedSearch ? "No missions matching that signature found." : "No missions assigned to your profile."}
          />
        </div>

        <div className="p-8">
          <Pagination
            pagination={paginationInfo}
            onPageChange={(page) => setCurrentPage(page)}
            loading={tasksLoading}
            label="Missions"
          />
        </div>

        {/* BREAK PROTOCOL OVERLAY */}
        <AnimatePresence>
          {isOnBreak && (
            <motion.div
              initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
              animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
              exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
              className="absolute inset-0 z-30 bg-slate-900/40 flex flex-col items-center justify-center text-center p-10"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-white p-16 rounded-[4rem] shadow-4xl max-w-lg border-b-[12px] border-blue-500"
              >
                <div className="w-24 h-24 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                  <FiMoon size={40} />
                </div>
                <h2 className="text-5xl font-black text-slate-900 italic tracking-tighter uppercase mb-4">Operator On Break</h2>
                <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.4em] mb-10 leading-relaxed">
                  Telemetry logs are paused. <br /> Mission terminal is currently locked.
                </p>
                <button
                  onClick={handlePause}
                  className="w-full py-6 bg-slate-900 text-white font-black rounded-3xl uppercase text-xs tracking-[0.3em] hover:bg-blue-600 transition-all shadow-2xl flex items-center justify-center gap-3"
                >
                  <FiPlay /> Resume Deployment
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
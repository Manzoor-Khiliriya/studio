import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiClock, FiCoffee, FiPlay, FiSquare, FiZap, FiTarget, FiActivity, FiSearch, FiMoon } from "react-icons/fi";
import { toast, Toaster } from "react-hot-toast";

// Reusable Components
import Table from "../components/Table";
import Pagination from "../components/Pagination";

// RTK Query Hooks
import { useGetMyTasksQuery } from "../services/taskApi";
import { 
  useGetMyLogsQuery, // Changed to match common naming convention
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
  const itemsPerPage = 6;

  // Debounce search to prevent excessive API hits
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // --- RTK QUERY (Backend Filtered) ---
  const { data, isLoading: tasksLoading } = useGetMyTasksQuery({
    page: currentPage,
    limit: itemsPerPage,
    search: debouncedSearch,
    status: statusFilter
  });

  const { data: logsData, isSuccess: logsLoaded } = useGetMyLogsQuery();

  // --- MUTATIONS ---
  const [startTimer] = useStartTimerMutation();
  const [togglePause] = useTogglePauseMutation();
  const [stopTimer] = useStopTimerMutation();

  const tasks = data?.tasks || [];
  const paginationInfo = data?.pagination || { current: 1, total: 1, count: 0 };

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
        
        // Sum up completed work logs for today
        if (logDate === localToday && !log.isRunning && log.logType === "work") {
          totalTodaySec += (log.durationSeconds || 0);
        }

        // Identify the active session
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
    if (!window.confirm("End session and synchronize?")) return;
    try { 
      await stopTimer().unwrap(); 
      setSeconds(0);
      toast.success("Session Synchronized"); 
    } catch { 
      toast.error("Stop Failed"); 
    }
  };

  const handlePause = async () => {
    try { await togglePause().unwrap(); }
    catch { toast.error("Pause Protocol Failed"); }
  };

  const formatTime = (totalSec) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${h}h ${m}m ${s}s`;
  };

  const columns = [
    {
      header: "Project",
      render: (row) => (
        <div className="flex items-center gap-2 text-slate-900 font-bold text-[11px] bg-slate-50 w-fit px-3 py-1.5 rounded-xl border border-slate-200">
          <FiTarget className="text-orange-500" /> {row.projectNumber || "N/A"}
        </div>
      )
    },
    {
      header: "Mission Title",
      render: (row) => (
        <p className={`font-bold text-slate-800 tracking-tight transition-all ${runningTaskId === row._id ? 'text-orange-600 italic' : ''}`}>
          {row.title}
        </p>
      )
    },
    {
      header: "Status",
      render: (row) => (
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
          row.status === "Completed" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-orange-50 text-orange-600 border-orange-100"
        }`}>
          {row.status}
        </span>
      )
    },
    {
      header: "Command",
      className: "text-right",
      render: (row) => {
        const isRunning = runningTaskId === row._id;
        if (row.status === "Completed") return <span className="text-[10px] font-black text-slate-300">ARCHIVED</span>;
        return (
          <div className="flex justify-end">
            <button
              onClick={(e) => { e.stopPropagation(); isRunning ? handleStop() : handleStart(row._id); }}
              disabled={isOnBreak && !isRunning}
              className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase transition-all active:scale-95 border ${
                isRunning 
                ? "bg-slate-900 text-white border-slate-900 shadow-xl shadow-slate-200" 
                : "bg-white text-slate-600 border-slate-100 hover:border-orange-500 hover:text-orange-600 shadow-sm"
              } ${isOnBreak && !isRunning ? "opacity-30 cursor-not-allowed" : ""}`}
            >
              {isRunning ? "Stop Session" : "Start Mission"}
            </button>
          </div>
        );
      }
    }
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 pb-20 space-y-10">
      <Toaster position="bottom-right" />
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-5xl font-black tracking-tighter text-slate-900 uppercase italic">Command Center</h1>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-2">Active Mission Logs & Telemetry</p>
        </div>
        <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl flex gap-12">
           <div>
              <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">Today's Progress</p>
              <h3 className="text-2xl font-black text-slate-900">{formatTime(todayTotalSeconds + (isOnBreak ? 0 : seconds))}</h3>
           </div>
           {runningTaskId && (
             <div className="border-l border-slate-100 pl-12 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`h-2 w-2 rounded-full ${isOnBreak ? 'bg-blue-500' : 'bg-orange-500 animate-ping'}`}/>
                  <p className={`text-[10px] uppercase font-black tracking-widest ${isOnBreak ? 'text-blue-500' : 'text-orange-500'}`}>
                    {isOnBreak ? 'On Break' : 'Live Session'}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <h3 className="text-2xl font-black text-orange-600 italic tracking-tighter">{formatTime(seconds)}</h3>
                  <button onClick={handlePause} className="p-2 bg-slate-100 hover:bg-orange-100 rounded-lg text-slate-600 hover:text-orange-600 transition-colors">
                    {isOnBreak ? <FiPlay size={14}/> : <FiCoffee size={14}/>}
                  </button>
                </div>
             </div>
           )}
        </div>
      </div>

      {/* MISSION TABLE BOX */}
      <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl overflow-hidden relative">
        <div className="p-10 border-b border-slate-50 bg-slate-50/30 flex flex-col lg:flex-row gap-8 justify-between items-center">
          <div className="relative w-full lg:w-[450px]">
            <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Search by Mission Name or Project ID..."
              className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-[1.5rem] text-sm font-medium focus:ring-4 focus:ring-orange-500/5 transition-all outline-none shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 bg-white p-2 rounded-[1.5rem] border border-slate-100 shadow-sm">
            {["All", "Pending", "In Progress", "Completed"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  statusFilter === status 
                  ? "bg-slate-900 text-white shadow-xl" 
                  : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-[400px]">
          <Table 
            columns={columns} 
            data={tasks} 
            loading={tasksLoading}
            emptyMessage={debouncedSearch ? "No missions match your search criteria" : "No assignments found for operator"}
          />
        </div>

        <Pagination 
          pagination={paginationInfo}
          onPageChange={(page) => setCurrentPage(page)}
          loading={tasksLoading}
          label="Missions"
        />

        {/* INTEGRATED BREAK OVERLAY */}
        <AnimatePresence>
          {isOnBreak && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 bg-white/60 backdrop-blur-md flex flex-col items-center justify-center text-center p-10"
            >
              <FiMoon size={48} className="text-orange-500 animate-pulse mb-4" />
              <h2 className="text-4xl font-black text-slate-900 italic tracking-tighter uppercase">Operator on Break</h2>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.5em] mb-8">Terminal locked until mission resumes</p>
              <button onClick={handlePause} className="px-8 py-4 bg-slate-900 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest hover:bg-orange-600 transition-all shadow-xl">
                Resume Mission
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { FiPlay, FiSquare, FiCoffee, FiZap, FiTarget, FiMoon, FiRefreshCw } from "react-icons/fi";

// RTK Query hooks
import { useGetMyTasksQuery } from "../services/taskApi";
import { 
  useGetMyTodayLogsQuery, 
  useStartTimerMutation, 
  useTogglePauseMutation, 
  useStopTimerMutation 
} from "../services/timeLogApi";

export default function ClockInOut() {
  const timerRef = useRef(null);
  const [liveSeconds, setLiveSeconds] = useState(0);
  const [selectedTaskId, setSelectedTaskId] = useState("");

  // 1. RTK Queries
  const { data: tasksData } = useGetMyTasksQuery({ status: "All" }); 
  const { data: logsData, isSuccess: logsLoaded } = useGetMyTodayLogsQuery(undefined, {
    pollingInterval: 60000, // Background sync every minute
  });

  const taskList = tasksData?.tasks || [];

  // 2. RTK Mutations
  const [startTimer, { isLoading: isStarting }] = useStartTimerMutation();
  const [togglePause, { isLoading: isPausing }] = useTogglePauseMutation();
  const [stopTimer, { isLoading: isStopping }] = useStopTimerMutation();

  const isMutationLoading = isStarting || isPausing || isStopping;

  // 3. Derived State
  const activeLog = logsData?.logs?.find(log => log.isRunning);
  const isPaused = logsData?.isCurrentlyOnBreak || false;
  const status = activeLog ? "Mission Active" : "Standby";

  // 4. Precise Live Ticker Sync
  useEffect(() => {
    if (activeLog) {
      // Sync selected task to the currently running one
      setSelectedTaskId(activeLog.task?._id || activeLog.task);
      
      const updateTime = () => {
        const previouslyEarned = activeLog.durationSeconds || 0;
        
        if (isPaused) {
          setLiveSeconds(previouslyEarned);
        } else {
          const currentSessionStart = new Date(activeLog.startTime);
          const currentSessionSeconds = Math.floor((Date.now() - currentSessionStart.getTime()) / 1000);
          setLiveSeconds(previouslyEarned + currentSessionSeconds);
        }
      };

      updateTime(); // Initial run

      if (!isPaused) {
        timerRef.current = setInterval(updateTime, 1000);
      } else {
        clearInterval(timerRef.current);
      }
    } else {
      setLiveSeconds(0);
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [activeLog, isPaused]);

  // Action Handlers
  const handleStart = async () => {
    if (!selectedTaskId) return toast.error("Select mission assignment first");
    try {
      await startTimer({ taskId: selectedTaskId }).unwrap();
      toast.success("Mission Authorized", { icon: '🚀' });
    } catch (err) {
      toast.error(err.data?.message || "Startup Protocol Failed");
    }
  };

  const handleTogglePause = async () => {
    try {
      const res = await togglePause().unwrap();
      res.logType === "break" 
        ? toast("Break Protocol Initiated", { icon: '☕' }) 
        : toast.success("Mission Resumed", { icon: '⚡' });
    } catch {
      toast.error("Pause Protocol Failure");
    }
  };

  const handleStop = async () => {
    if (!window.confirm("Synchronize data and terminate session?")) return;
    try {
      await stopTimer().unwrap();
      setSelectedTaskId("");
      toast.success("Data Synchronized", { icon: '✅' });
    } catch {
      toast.error("Termination Failed");
    }
  };

  const formatTime = (totalSec) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 bg-slate-950 p-8 rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden">
      
      {/* HEADER STATUS */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="relative flex h-2.5 w-2.5">
            {activeLog && !isPaused && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
              activeLog ? (isPaused ? "bg-orange-500" : "bg-emerald-500") : "bg-slate-700"
            }`}></span>
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
            {isPaused ? "Break Mode" : status}
          </span>
        </div>
        <FiZap size={16} className={`${activeLog && !isPaused ? "text-orange-500 animate-pulse" : "text-slate-800"}`} />
      </div>

      {/* TASK SELECTOR */}
      <div className="relative group">
        <FiTarget className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${selectedTaskId ? 'text-orange-500' : 'text-slate-600'}`} />
        <select
          disabled={!!activeLog || isMutationLoading}
          value={selectedTaskId}
          onChange={(e) => setSelectedTaskId(e.target.value)}
          className="w-full bg-white/[0.03] border border-white/10 text-white text-sm font-bold py-5 pl-12 pr-4 rounded-[1.5rem] appearance-none focus:border-orange-500/50 focus:bg-white/[0.05] outline-none disabled:opacity-40 cursor-pointer transition-all"
        >
          <option value="" className="bg-slate-900">Awaiting Assignment...</option>
          {taskList.filter(t => t.status !== "Completed").map(task => (
            <option key={task._id} value={task._id} className="bg-slate-900 text-white">
              {task.projectCode ? `[${task.projectCode}] ` : ""}{task.title}
            </option>
          ))}
        </select>
      </div>

      {/* TIMER DISPLAY */}
      <div className="relative">
        <AnimatePresence mode="wait">
          {activeLog ? (
            <motion.div 
              key="active-timer"
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              className={`py-10 rounded-[2rem] text-center border transition-all duration-500 ${
                isPaused ? 'bg-slate-900/40 border-white/5' : 'bg-orange-600/[0.03] border-orange-600/20'
              }`}
            >
              <p className="text-[9px] font-black uppercase tracking-[0.5em] text-orange-500/40 mb-3">Live Session Data</p>
              <h3 className="text-6xl font-black italic tracking-tighter text-white tabular-nums">
                {formatTime(liveSeconds)}
              </h3>
            </motion.div>
          ) : (
            <div className="py-10 rounded-[2rem] text-center border border-dashed border-white/5 bg-white/[0.01]">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600">Terminal Standby</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* CONTROL BUTTONS */}
      <div className="grid grid-cols-2 gap-4">
        {!activeLog ? (
          <button
            onClick={handleStart}
            disabled={!selectedTaskId || isMutationLoading}
            className="col-span-2 group flex items-center justify-center gap-3 py-5 rounded-[1.5rem] bg-orange-600 hover:bg-orange-500 text-white text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-10 shadow-xl shadow-orange-600/20"
          >
            {isMutationLoading ? <FiRefreshCw className="animate-spin" /> : <FiPlay className="group-hover:translate-x-1 transition-transform" />} 
            Initiate Mission
          </button>
        ) : (
          <>
            <button
              onClick={handleTogglePause}
              disabled={isMutationLoading}
              className={`flex items-center justify-center gap-3 py-5 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest border transition-all active:scale-95 ${
                isPaused 
                  ? "bg-white text-slate-950 border-white shadow-lg shadow-white/10" 
                  : "bg-transparent border-white/10 text-white hover:bg-white/5"
              }`}
            >
              {isPaused ? <FiPlay /> : <FiCoffee />} {isPaused ? "Resume" : "Break"}
            </button>
            <button
              onClick={handleStop}
              disabled={isMutationLoading}
              className="flex items-center justify-center gap-3 py-5 rounded-[1.5rem] bg-red-600/5 hover:bg-red-600 text-red-500 hover:text-white border border-red-600/20 text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-red-600/5"
            >
              <FiSquare /> Terminate
            </button>
          </>
        )}
      </div>

      {/* FULL-SCREEN PAUSE OVERLAY */}
      <AnimatePresence>
        {isPaused && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[9999] bg-slate-950/98 backdrop-blur-2xl flex flex-col items-center justify-center text-center p-6"
          >
            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            >
              <FiMoon size={80} className="text-orange-500 mb-8 filter drop-shadow-[0_0_20px_rgba(249,115,22,0.3)]" />
            </motion.div>
            
            <h2 className="text-6xl md:text-8xl font-black text-white italic tracking-tighter uppercase mb-4">Protocol: Break</h2>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.6em] mb-12 border-y border-white/5 py-4">
              Current Session: <span className="text-white">{formatTime(liveSeconds)}</span>
            </p>
            
            <button 
              onClick={handleTogglePause} 
              className="group flex items-center gap-4 px-14 py-7 bg-white text-slate-950 font-black rounded-3xl uppercase text-sm tracking-[0.2em] hover:bg-orange-500 hover:text-white transition-all shadow-2xl"
            >
              <FiPlay className="group-hover:scale-125 transition-transform" /> Resume Mission
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
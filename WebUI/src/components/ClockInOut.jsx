import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { FiPlay, FiSquare, FiCoffee, FiZap, FiTarget, FiMoon } from "react-icons/fi";

// Import your RTK Query hooks
import { useGetMyTasksQuery } from "../services/taskApi";
import { 
  useGetMyLogsQuery, 
  useStartTimerMutation, 
  useTogglePauseMutation, 
  useStopTimerMutation 
} from "../services/timeLogApi";

export default function ClockInOut() {
  const timerRef = useRef(null);
  const [liveSeconds, setLiveSeconds] = useState(0);
  const [selectedTaskId, setSelectedTaskId] = useState("");

  // 1. RTK Queries - Note: Destructure data as tasksData
  const { data: tasksData } = useGetMyTasksQuery({ status: "All" }); 
  const { data: logsData, isSuccess: logsLoaded } = useGetMyLogsQuery();

  // 2. Extract the actual array safely
  const taskList = tasksData?.tasks || [];

  // 3. RTK Mutations
  const [startTimer, { isLoading: isStarting }] = useStartTimerMutation();
  const [togglePause, { isLoading: isPausing }] = useTogglePauseMutation();
  const [stopTimer, { isLoading: isStopping }] = useStopTimerMutation();

  const isLoading = isStarting || isPausing || isStopping;

  // 4. Derived State from RTK Query Cache
  const activeLog = logsData?.logs?.find(log => log.isRunning);
  const isPaused = logsData?.isCurrentlyOnBreak || false;
  const status = activeLog ? "Clocked In" : "Clocked Out";

  // 5. Sync Live Ticker & Selected Task
  useEffect(() => {
    if (activeLog) {
      setSelectedTaskId(activeLog.task?._id || activeLog.task);
      
      const previouslyEarned = activeLog.durationSeconds || 0;
      if (isPaused) {
        setLiveSeconds(previouslyEarned);
        clearInterval(timerRef.current);
      } else {
        const currentSessionStart = new Date(activeLog.startTime);
        const currentSessionSeconds = Math.floor((Date.now() - currentSessionStart.getTime()) / 1000);
        setLiveSeconds(previouslyEarned + currentSessionSeconds);

        timerRef.current = setInterval(() => {
          setLiveSeconds(prev => prev + 1);
        }, 1000);
      }
    } else {
      setLiveSeconds(0);
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [activeLog, isPaused]);

  // Action Handlers
  const handleStart = async () => {
    if (!selectedTaskId) return toast.error("Select a project first");
    try {
      await startTimer({ taskId: selectedTaskId }).unwrap();
      toast.success("Mission Authorized");
    } catch (err) {
      toast.error(err.data?.message || "Startup Failed");
    }
  };

  const handleTogglePause = async () => {
    try {
      const res = await togglePause().unwrap();
      res.logType === "break" ? toast("Break Active") : toast.success("Mission Resumed");
    } catch {
      toast.error("Pause Protocol Failed");
    }
  };

  const handleStop = async () => {
    if (!window.confirm("Sync and close session?")) return;
    try {
      await stopTimer().unwrap();
      setSelectedTaskId("");
      toast.success("Session Synchronized");
    } catch {
      toast.error("Stop Failed");
    }
  };

  const formatTime = (totalSec) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${h}h ${m}m ${s}s`;
  };

  return (
    <div className="space-y-6 bg-slate-950 p-6 rounded-[2.5rem] border border-white/5 shadow-2xl">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${activeLog ? (isPaused ? "bg-orange-500" : "bg-emerald-500 animate-pulse") : "bg-slate-700"}`} />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
            {isPaused ? "On Break" : status}
          </span>
        </div>
        <FiZap size={14} className={activeLog && !isPaused ? "text-orange-500" : "text-slate-800"} />
      </div>

      <div className="relative group">
        <FiTarget className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
        <select
          disabled={!!activeLog || isLoading}
          value={selectedTaskId}
          onChange={(e) => setSelectedTaskId(e.target.value)}
          className="w-full bg-white/5 border border-white/10 text-white text-sm font-bold py-4 pl-12 pr-4 rounded-2xl appearance-none focus:border-orange-500/50 outline-none disabled:opacity-50 cursor-pointer"
        >
          <option value="" className="bg-slate-900">Select Assignment...</option>
          {/* FIXED: Using taskList array instead of tasks object */}
          {taskList.filter(t => t.status !== "Completed").map(task => (
            <option key={task._id} value={task._id} className="bg-slate-900">
              {task.projectNumber ? `[${task.projectNumber}] ` : ""}{task.title}
            </option>
          ))}
        </select>
      </div>

      <AnimatePresence mode="wait">
        {activeLog && (
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}>
            <div className={`py-8 rounded-3xl text-center border transition-all ${isPaused ? 'bg-slate-900/50 border-white/5' : 'bg-orange-600/5 border-orange-600/20 shadow-inner'}`}>
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-orange-500/50 mb-2">Live Telemetry</p>
              <h3 className="text-5xl font-black italic tracking-tighter text-white tabular-nums">
                {formatTime(liveSeconds)}
              </h3>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 gap-3">
        {!activeLog ? (
          <button
            onClick={handleStart}
            disabled={!selectedTaskId || isLoading}
            className="col-span-2 flex items-center justify-center gap-3 py-5 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-20 shadow-lg shadow-orange-600/20"
          >
            <FiPlay /> Start Mission
          </button>
        ) : (
          <>
            <button
              onClick={handleTogglePause}
              disabled={isLoading}
              className={`flex items-center justify-center gap-3 py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest border transition-all ${
                isPaused ? "bg-white text-slate-900 border-white" : "bg-transparent border-white/10 text-white hover:bg-white/5"
              }`}
            >
              {isPaused ? "Resume" : "Pause"}
            </button>
            <button
              onClick={handleStop}
              disabled={isLoading}
              className="flex items-center justify-center gap-3 py-5 rounded-2xl bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-600/20 text-[11px] font-black uppercase tracking-widest transition-all"
            >
              Stop
            </button>
          </>
        )}
      </div>

      <AnimatePresence>
        {isPaused && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[999] bg-slate-950/98 backdrop-blur-xl flex flex-col items-center justify-center text-center">
            <FiMoon size={80} className="text-orange-500 animate-pulse mb-8" />
            <h2 className="text-6xl font-black text-white italic tracking-tighter uppercase mb-2">Paused</h2>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.5em] mb-12">Session: {formatTime(liveSeconds)}</p>
            <button onClick={handleTogglePause} className="px-12 py-6 bg-white text-slate-950 font-black rounded-2xl uppercase text-sm tracking-widest hover:bg-orange-500 hover:text-white transition-all">
              Return to Mission
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
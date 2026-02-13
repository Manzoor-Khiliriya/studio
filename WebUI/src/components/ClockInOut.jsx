import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { FiPlay, FiSquare, FiCoffee, FiZap, FiTarget, FiMoon, FiRefreshCw, FiExternalLink } from "react-icons/fi";

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
  const pipWindowRef = useRef(null);
  
  const [taskSeconds, setTaskSeconds] = useState(0); 
  const [dailySeconds, setDailySeconds] = useState(0); 
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [isPipActive, setIsPipActive] = useState(false); // Track PiP state specifically

  const { data: tasksData } = useGetMyTasksQuery({ status: "All" });
  const { data: logsData, refetch: refetchLogs } = useGetMyTodayLogsQuery(undefined, {
    pollingInterval: 30000,
  });

  const taskList = tasksData?.tasks || [];
  const [startTimer, { isLoading: isStarting }] = useStartTimerMutation();
  const [togglePause] = useTogglePauseMutation();
  const [stopTimer] = useStopTimerMutation();

  const activeLog = logsData?.logs?.find(log => log.isRunning);
  const isPaused = activeLog?.logType === "break";
  const status = activeLog ? (isPaused ? "On Break" : "Mission Active") : "Standby";

  // 1. SYNC TASK DROPDOWN ON REFRESH
  useEffect(() => {
    if (activeLog?.task?._id) {
      setSelectedTaskId(activeLog.task._id);
    }
  }, [activeLog]);

  // 2. TICKER LOGIC (Improved for Refresh Stability)
  useEffect(() => {
    const calculateTimers = () => {
      if (!logsData?.logs) return;
      const now = Date.now();
      const localToday = new Date().toLocaleDateString('en-CA');
      
      // Use active task ID from server if available, otherwise fallback to dropdown
      const currentId = activeLog?.task?._id || selectedTaskId;
      if (!currentId) return;

      // Calculate Task Total
      const allTaskLogs = logsData.logs.filter(l => 
        (l.task?._id === currentId || l.task === currentId) && l.logType === "work"
      );
      const finishedTaskSecs = allTaskLogs.filter(l => !l.isRunning).reduce((sum, l) => sum + (l.durationSeconds || 0), 0);
      
      // Calculate Daily Total
      const dailyLogs = logsData.logs.filter(l => 
        l.logType === "work" && new Date(l.startTime).toLocaleDateString('en-CA') === localToday
      );
      const finishedDailySecs = dailyLogs.filter(l => !l.isRunning).reduce((sum, l) => sum + (l.durationSeconds || 0), 0);

      if (activeLog && activeLog.logType === "work" && !isPaused) {
        const sessionSecs = Math.max(0, Math.floor((now - new Date(activeLog.startTime).getTime()) / 1000));
        setTaskSeconds(finishedTaskSecs + sessionSecs);
        setDailySeconds(finishedDailySecs + sessionSecs);
      } else {
        setTaskSeconds(finishedTaskSecs);
        setDailySeconds(finishedDailySecs);
      }
    };

    calculateTimers();
    if (activeLog && activeLog.logType === "work" && !isPaused) {
      timerRef.current = setInterval(calculateTimers, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [logsData, activeLog, selectedTaskId, isPaused]);

  // 3. PIP WINDOW BRIDGE
  useEffect(() => {
    if (pipWindowRef.current) {
      const pipDoc = pipWindowRef.current.document;
      const taskTimerEl = pipDoc.getElementById('task-timer');
      const dailyTimerEl = pipDoc.getElementById('daily-timer');
      const statusEl = pipDoc.getElementById('status');

      if (taskTimerEl) taskTimerEl.innerText = formatTime(taskSeconds);
      if (dailyTimerEl) dailyTimerEl.innerText = `TODAY: ${formatTime(dailySeconds)}`;

      if (isPaused) {
        pipDoc.body.style.backgroundColor = "#1e1b4b";
        if (statusEl) statusEl.innerText = "SHIFT PAUSED";
      } else {
        pipDoc.body.style.backgroundColor = "#020617";
        if (statusEl) {
          const activeTask = taskList.find(t => t._id === (activeLog?.task?._id || selectedTaskId));
          statusEl.innerText = activeTask ? `ACTIVE: ${activeTask.projectNumber}` : "MISSION ACTIVE";
        }
      }
    }
  }, [taskSeconds, dailySeconds, isPaused, activeLog, selectedTaskId, taskList]);

  const handlePopOut = async () => {
    if (!('documentPictureInPicture' in window)) return toast.error("Browser doesn't support PiP");
    
    try {
      const pipWindow = await window.documentPictureInPicture.requestWindow({ width: 240, height: 120 });
      pipWindowRef.current = pipWindow;
      setIsPipActive(true);

      const style = pipWindow.document.createElement('style');
      style.textContent = `
        body { margin: 0; padding: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; overflow: hidden; font-family: ui-monospace, monospace; color: white; transition: background-color 0.4s ease; }
        #status { font-size: 8px; text-transform: uppercase; font-weight: 800; letter-spacing: 1px; margin-bottom: 2px; color: #64748b; }
        #task-timer { font-size: 34px; font-weight: 900; color: #f97316; letter-spacing: -1px; }
        #daily-timer { font-size: 10px; font-weight: 700; color: #94a3b8; margin-top: 4px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 4px; }
      `;
      pipWindow.document.head.appendChild(style);

      const statusDiv = pipWindow.document.createElement('div'); statusDiv.id = 'status';
      const taskDiv = pipWindow.document.createElement('div'); taskDiv.id = 'task-timer';
      const dailyDiv = pipWindow.document.createElement('div'); dailyDiv.id = 'daily-timer';
      
      pipWindow.document.body.append(statusDiv, taskDiv, dailyDiv);
      
      pipWindow.addEventListener("pagehide", () => {
        pipWindowRef.current = null;
        setIsPipActive(false);
      });
    } catch (err) {
      console.error("PiP Error:", err);
    }
  };

  const handleStart = async () => {
    if (!selectedTaskId) return toast.error("Select mission");
    try {
      await startTimer(selectedTaskId).unwrap();
      handlePopOut();
    } catch (err) { toast.error("Startup Failed"); }
  };

  const handleStop = async () => {
    if (!window.confirm("Terminate session?")) return;
    try {
      await stopTimer().unwrap();
      setSelectedTaskId("");
      if (pipWindowRef.current) pipWindowRef.current.close();
    } catch { toast.error("Termination Failed"); }
  };

  const formatTime = (totalSec) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 bg-slate-950 p-8 rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden">
      
      {/* HEADER WITH REFRESH LOGIC */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className={`h-2.5 w-2.5 rounded-full ${activeLog ? (isPaused ? "bg-orange-500" : "bg-emerald-500 animate-pulse") : "bg-slate-700"}`} />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">{status}</span>
        </div>
        
        {/* RESTORE POPUP BUTTON (Shows after refresh) */}
        {activeLog && !isPipActive && (
          <button 
            onClick={handlePopOut} 
            className="flex items-center gap-2 text-[10px] font-black text-orange-500 hover:bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-full transition-all uppercase tracking-widest"
          >
            <FiExternalLink size={12} /> Restore Popup
          </button>
        )}
      </div>

      {/* TASK SELECTOR */}
      <div className="relative">
        <FiTarget className={`absolute left-4 top-1/2 -translate-y-1/2 ${selectedTaskId ? 'text-orange-500' : 'text-slate-600'}`} />
        <select
          disabled={!!activeLog}
          value={selectedTaskId}
          onChange={(e) => setSelectedTaskId(e.target.value)}
          className="w-full bg-white/[0.03] border border-white/10 text-white text-sm font-bold py-5 pl-12 pr-4 rounded-[1.5rem] outline-none disabled:opacity-80 appearance-none"
        >
          <option value="" className="bg-slate-900">Select Assignment...</option>
          {taskList.map(task => (
            <option key={task._id} value={task._id} className="bg-slate-900">
              [{task.projectNumber}] {task.title}
            </option>
          ))}
        </select>
      </div>

      {/* MAIN DISPLAY */}
      <div className={`py-10 rounded-[2rem] text-center border transition-all ${isPaused ? 'bg-slate-900/40 border-white/5' : 'bg-orange-600/[0.01] border-orange-600/20 shadow-inner'}`}>
        <p className="text-[9px] font-black uppercase tracking-[0.5em] text-orange-500/40 mb-3">Task Life Total</p>
        <h3 className="text-6xl font-black italic tracking-tighter text-white tabular-nums">
          {formatTime(taskSeconds)}
        </h3>
        
        {/* Secondary Info: Daily Total (Visible if Popup is closed) */}
        <div className="mt-4 pt-4 border-t border-white/5 mx-10">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Today Shift: <span className="text-slate-300 ml-2">{formatTime(dailySeconds)}</span>
          </p>
        </div>
      </div>

      {/* CONTROLS */}
      <div className="grid grid-cols-2 gap-4">
        {!activeLog ? (
          <button 
            onClick={handleStart} 
            disabled={!selectedTaskId}
            className="col-span-2 py-5 rounded-[1.5rem] bg-orange-600 hover:bg-orange-500 text-white text-[11px] font-black uppercase tracking-widest shadow-xl shadow-orange-950/20 active:scale-[0.98] transition-all disabled:opacity-50"
          >
             Initiate Mission
          </button>
        ) : (
          <>
            <button 
              onClick={() => togglePause()} 
              className={`py-5 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest border transition-all active:scale-[0.98] ${isPaused ? "bg-white text-slate-950" : "bg-transparent border-white/10 text-white hover:bg-white/5"}`}
            >
              {isPaused ? <><FiPlay className="inline mr-2" /> Resume</> : <><FiCoffee className="inline mr-2" /> Break</>}
            </button>
            <button 
              onClick={handleStop} 
              className="py-5 rounded-[1.5rem] bg-red-600/10 text-red-500 border border-red-600/20 text-[11px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all active:scale-[0.98]"
            >
              <FiSquare className="inline mr-2" /> Terminate
            </button>
          </>
        )}
      </div>
    </div>
  );
}
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
  const pipWindowRef = useRef(null); // 🔹 Reference for the floating window
  const [liveSeconds, setLiveSeconds] = useState(0);
  const [selectedTaskId, setSelectedTaskId] = useState("");

  const { data: tasksData } = useGetMyTasksQuery({ status: "All" });
  const { data: logsData } = useGetMyTodayLogsQuery(undefined, {
    pollingInterval: 30000,
  });

  const taskList = tasksData?.tasks || [];

  const [startTimer, { isLoading: isStarting }] = useStartTimerMutation();
  const [togglePause, { isLoading: isPausing }] = useTogglePauseMutation();
  const [stopTimer, { isLoading: isStopping }] = useStopTimerMutation();

  const isMutationLoading = isStarting || isPausing || isStopping;

  const activeLog = logsData?.logs?.find(log => log.isRunning);
  const isPaused = activeLog?.logType === "break";
  const status = activeLog ? (isPaused ? "On Break" : "Mission Active") : "Standby";

  // 1. 🔹 PIP BRIDGE EFFECT (Syncs state to the floating window)
  useEffect(() => {
    if (pipWindowRef.current) {
      const pipDoc = pipWindowRef.current.document;
      const body = pipDoc.body;
      const timerEl = pipDoc.getElementById('timer');
      const statusEl = pipDoc.getElementById('status');

      if (timerEl) timerEl.innerText = formatTime(liveSeconds);

      if (isPaused) {
        body.style.backgroundColor = "#450a0a"; // Deep Red
        if (timerEl) timerEl.style.color = "#fca5a5";
        if (statusEl) {
          statusEl.innerText = "PROTOCOL: BREAK";
          statusEl.style.color = "#f87171";
        }
      } else {
        body.style.backgroundColor = "#020617"; // Slate Blue
        if (timerEl) timerEl.style.color = "#f97316";
        if (statusEl) {
          statusEl.innerText = "MISSION ACTIVE";
          statusEl.style.color = "#64748b";
        }
      }
    }
  }, [liveSeconds, isPaused]);

  // 2. 🔹 AUTO-CLOSE PIP WHEN MISSION TERMINATED
  useEffect(() => {
    if (!activeLog && pipWindowRef.current) {
      pipWindowRef.current.close();
      pipWindowRef.current = null;
    }
  }, [activeLog]);

  // Live Ticker Logic
  // Inside ClockInOut.jsx

  useEffect(() => {
    if (activeLog && logsData?.logs) {
      const updateTime = () => {
        // 🔹 CALCULATE DAILY TOTAL WORK (Sum of all completed work logs today)
        const completedWorkToday = logsData.logs
          .filter(l => l.logType === "work" && !l.isRunning)
          .reduce((sum, l) => sum + (l.durationSeconds || 0), 0);

        if (isPaused) {
          // If on break, show the total work locked in so far
          setLiveSeconds(completedWorkToday);
        } else {
          // If working, show total work + current ticking session
          const sessionStart = new Date(activeLog.startTime);
          const now = new Date();
          const currentSessionSeconds = Math.max(0, Math.floor((now.getTime() - sessionStart.getTime()) / 1000));

          setLiveSeconds(completedWorkToday + currentSessionSeconds);
        }
      };

      updateTime();

      // Tick every second ONLY if the active log is "work"
      if (!isPaused && activeLog.logType === "work") {
        timerRef.current = setInterval(updateTime, 1000);
      } else {
        clearInterval(timerRef.current);
      }
    } else {
      setLiveSeconds(0);
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [activeLog, isPaused, logsData]);

  const handlePopOut = async () => {
    if (!('documentPictureInPicture' in window) || pipWindowRef.current) return;

    try {
      const pipWindow = await window.documentPictureInPicture.requestWindow({
        width: 220,
        height: 100,
      });

      pipWindowRef.current = pipWindow;

      const style = pipWindow.document.createElement('style');
      style.textContent = `
        body { 
          margin: 0; padding: 0; display: flex; flex-direction: column; 
          align-items: center; justify-content: center; height: 100vh; 
          overflow: hidden; font-family: ui-monospace, monospace;
          transition: background-color 0.4s ease;
        }
        #status { font-size: 9px; text-transform: uppercase; font-weight: 800; letter-spacing: 2px; margin-bottom: 4px; transition: color 0.4s ease; }
        #timer { font-size: 38px; font-weight: 900; transition: color 0.4s ease; letter-spacing: -1px; }
      `;
      pipWindow.document.head.appendChild(style);

      const statusDiv = pipWindow.document.createElement('div');
      statusDiv.id = 'status';
      const timerDiv = pipWindow.document.createElement('div');
      timerDiv.id = 'timer';

      pipWindow.document.body.append(statusDiv, timerDiv);
      pipWindow.addEventListener("pagehide", () => { pipWindowRef.current = null; });
    } catch (err) {
      console.error("PiP Initialization Failed:", err);
    }
  };

  const handleStart = async () => {
    if (!selectedTaskId) return toast.error("Select mission assignment first");
    try {
      const id = typeof selectedTaskId === 'object' ? selectedTaskId._id : selectedTaskId;
      await startTimer(id).unwrap();
      toast.success("Mission Authorized", { icon: '🚀' });

      // Auto trigger pop-out
      setTimeout(() => handlePopOut(), 500);
    } catch (err) {
      toast.error(err.data?.error || "Startup Protocol Failed");
    }
  };

  const handleTogglePause = async () => {
    try {
      const res = await togglePause().unwrap();
      res.status === "break"
        ? toast("Break Protocol Initiated", { icon: '☕' })
        : toast.success("Mission Resumed", { icon: '⚡' });
    } catch (err) {
      toast.error(err.data?.message || "Pause Protocol Failure");
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
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${activeLog ? (isPaused ? "bg-orange-500" : "bg-emerald-500") : "bg-slate-700"}`}></span>
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">{status}</span>
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
          <option value="" className="bg-slate-900 text-slate-400 italic">Select Mission...</option>
          {taskList.map(task => (
            <option key={task._id} value={task._id} className="bg-slate-900 text-white">
              [{task.projectNumber}] {task.title}
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
              className={`py-10 rounded-[2rem] text-center border transition-all duration-500 ${isPaused ? 'bg-slate-900/40 border-white/5' : 'bg-orange-600/[0.03] border-orange-600/20'}`}
            >
              <p className="text-[9px] font-black uppercase tracking-[0.5em] text-orange-500/40 mb-3">{isPaused ? "Break Duration" : "Live Session Data"}</p>
              <h3 className="text-6xl font-black italic tracking-tighter text-white tabular-nums">{formatTime(liveSeconds)}</h3>
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
            className="col-span-2 group flex items-center justify-center gap-3 py-5 rounded-[1.5rem] bg-orange-600 hover:bg-orange-500 text-white text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-orange-600/20"
          >
            {isMutationLoading ? <FiRefreshCw className="animate-spin" /> : <FiPlay className="group-hover:translate-x-1 transition-transform" />} Initiate Mission
          </button>
        ) : (
          <>
            <button
              onClick={handleTogglePause}
              disabled={isMutationLoading}
              className={`flex items-center justify-center gap-3 py-5 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest border transition-all active:scale-95 ${isPaused ? "bg-white text-slate-950 border-white shadow-lg shadow-white/10" : "bg-transparent border-white/10 text-white hover:bg-white/5"}`}
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

      {/* PAUSE OVERLAY */}
      <AnimatePresence>
        {isPaused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-slate-950/98 backdrop-blur-2xl flex flex-col items-center justify-center text-center p-6"
          >
            <motion.div animate={{ y: [0, -15, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}>
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
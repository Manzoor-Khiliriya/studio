import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import { FiPlay, FiCoffee, FiTarget, FiExternalLink } from "react-icons/fi";
import { useGetMyTodayLogsQuery, useStartTimerMutation, useTogglePauseMutation, useStopTimerMutation } from "../services/timeLogApi";

export default function ClockInOut({ todaySeconds: dashboardDailySecs, taskList = [] }) {
  const timerRef = useRef(null);
  const pipWindowRef = useRef(null);

  const [taskSeconds, setTaskSeconds] = useState(0);
  const [dailySeconds, setDailySeconds] = useState(0);
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [isPipActive, setIsPipActive] = useState(false);

  const { data: logsData } = useGetMyTodayLogsQuery(undefined, { pollingInterval: 30000 });
  const [startTimer, { isLoading: isStarting }] = useStartTimerMutation();
  const [togglePause, { isLoading: isToggling }] = useTogglePauseMutation();
  const [stopTimer, { isLoading: isStopping }] = useStopTimerMutation();

  const activeLog = logsData?.logs?.find(log => log.isRunning);
  const isPaused = activeLog?.logType === "break";
  const isSyncing = isStarting || isToggling || isStopping;
  const status = activeLog ? (isPaused ? "On Break" : "Mission Active") : "Not Started";

  useEffect(() => {
    if (activeLog?.task?._id) {
      const match = taskList.find(t => t.id === activeLog.task._id.toString());
      setSelectedTaskId(match ? match.id : activeLog.task._id);
    }
  }, [activeLog, taskList]);

  useEffect(() => {
    if (activeLog && !isPipActive && !pipWindowRef.current) {
      const timeout = setTimeout(() => {
        handlePopOut();
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [activeLog, isPipActive]);

  useEffect(() => {
    const calculateTimers = () => {
      if (!logsData?.logs) return;
      const now = Date.now();
      const localToday = new Date().toLocaleDateString('en-IN');
      const currentId = activeLog?.task?._id || selectedTaskId;
      if (!currentId) return;

      const allTaskLogs = logsData.logs.filter(l => (l.task?._id === currentId || l.task === currentId) && l.logType === "work");
      const finishedTaskSecs = allTaskLogs.filter(l => !l.isRunning).reduce((sum, l) => sum + (l.rawDurationSeconds || 0), 0);
      const dailyLogs = logsData.logs.filter(l => l.logType === "work" && new Date(l.startTime).toLocaleDateString('en-IN') === localToday);
      const finishedDailySecs = dailyLogs.filter(l => !l.isRunning).reduce((sum, l) => sum + (l.rawDurationSeconds || 0), 0);

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

  useEffect(() => {
    if (pipWindowRef.current) {
      const pipDoc = pipWindowRef.current.document;
      const dEl = pipDoc.getElementById('daily-timer');
      const sEl = pipDoc.getElementById('status');

      if (dEl) {
        dEl.innerText = formatTime(dailySeconds);
        dEl.style.color = isPaused ? "#ef4444" : "#22c55e";
      }

      if (sEl) {
        sEl.innerText = isPaused ? "ON BREAK" : "TOTAL WORK TIME";
        sEl.style.color = isPaused ? "#94a3b8" : "#22c55e";
      }
      pipDoc.body.style.backgroundColor = isPaused ? "#0f172a" : "#020617";
    }
  }, [dailySeconds, isPaused]);

  const handlePopOut = async () => {
    if (!('documentPictureInPicture' in window)) return;
    if (pipWindowRef.current) return;

    try {
      const pipWindow = await window.documentPictureInPicture.requestWindow({
        width: 50,
        height: 30
      });

      pipWindowRef.current = pipWindow;
      setIsPipActive(true);

      const style = pipWindow.document.createElement('style');
      style.textContent = `
        body { margin: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: ui-monospace, monospace; background: #020617; overflow: hidden; } 
        #status { font-size: 10px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; } 
        #daily-timer { font-size: 20px; font-weight: 900; line-height: 1; transition: color 0.3s ease; }
      `;
      pipWindow.document.head.appendChild(style);

      const s = pipWindow.document.createElement('div'); s.id = 'status';
      const d = pipWindow.document.createElement('div'); d.id = 'daily-timer';
      pipWindow.document.body.append(s, d);

      pipWindow.addEventListener("pagehide", () => {
        setIsPipActive(false);
        pipWindowRef.current = null;
      });
    } catch (err) {
      console.error("PiP Auto-launch blocked:", err);
    }
  };

  const handleStart = async () => {
    if (!selectedTaskId) return toast.error("Target required");
    try {
      await startTimer(selectedTaskId).unwrap();
    } catch (err) { toast.error(err?.data?.error || "Startup Failed"); }
  };

  const handleStop = async () => {
    if (!window.confirm("Terminate tracking?")) return;
    try {
      await stopTimer().unwrap();
      setSelectedTaskId("");
      if (pipWindowRef.current) pipWindowRef.current.close();
    } catch { toast.error("Stop failed"); }
  };

  const formatTime = (totalSec) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className={`h-2.5 w-2.5 rounded-full ${activeLog ? (isPaused ? "bg-orange-500" : "bg-emerald-500 animate-pulse") : "bg-slate-700"}`} />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">{status}</span>
        </div>
        {activeLog && !isPipActive && (
          <button onClick={handlePopOut} className="cursor-pointer text-[10px] font-black text-orange-500 hover:text-orange-400 flex items-center gap-2 uppercase tracking-widest">
            <FiExternalLink size={12} /> HUD View
          </button>
        )}
      </div>

      <div className="relative">
        <FiTarget className={`absolute left-4 top-1/2 -translate-y-1/2 ${selectedTaskId ? 'text-orange-500' : 'text-slate-600'}`} />
        <select
          disabled={!!activeLog}
          value={selectedTaskId}
          onChange={(e) => setSelectedTaskId(e.target.value)}
          className="w-full bg-white/[0.03] border border-white/10 text-white text-sm font-bold py-5 pl-12 pr-4 rounded-[1.5rem] outline-none disabled:opacity-50 appearance-none cursor-pointer"
        >
          <option value="" className="bg-slate-900">Select Task...</option>
          {taskList.map(task => (
            <option key={task.id} value={task.id} className="bg-slate-900 uppercase">
              {task.projectTitle} ({task?.projectCode}) - {task.title}
            </option>
          ))}
        </select>
      </div>

      <div className={`py-10 rounded-[2rem] text-center border transition-all ${isPaused ? 'bg-slate-900/40 border-white/5' : 'bg-orange-600/[0.01] border-orange-600/20'}`}>
        <p className="text-[9px] font-black uppercase tracking-[0.5em] text-orange-500/40 mb-3">Project Timer</p>
        <h3 className="text-6xl font-black italic tracking-tighter text-white tabular-nums">{formatTime(dailySeconds)}</h3>
      </div>

      <div className="flex items-center gap-4">
        {!activeLog ? (
          <button
            onClick={handleStart}
            disabled={!selectedTaskId || isSyncing}
            className="cursor-pointer flex-1 py-5 rounded-[1.5rem] bg-orange-600 hover:bg-orange-700 text-white text-[11px] font-black uppercase tracking-widest disabled:opacity-50 transition-all"
          >
            {isStarting ? "Initializing..." : "Start Task"}
          </button>
        ) : (
          <>
            <button
              onClick={() => togglePause()}
              disabled={isSyncing}
              className={`cursor-pointer flex-1 py-5 rounded-[1.5rem] flex items-center justify-center gap-3 font-black text-[11px] uppercase tracking-widest transition-all disabled:opacity-50 ${isPaused ? "bg-green-500 text-slate-950 hover:bg-green-600" : "bg-slate-500 hover:bg-slate-600 text-white"}`}
            >
              {isToggling ? "Processing..." : (isPaused ? <><FiPlay size={18} /> Resume</> : <><FiCoffee size={18} /> Break</>)}
            </button>
            <button
              onClick={handleStop}
              disabled={isSyncing}
              className="cursor-pointer flex-1 py-5 rounded-[1.5rem] bg-red-500 text-white text-[11px] font-black uppercase tracking-widest hover:bg-red-600 transition-all disabled:opacity-50"
            >
              {isStopping ? "Stopping..." : "Stop Task"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
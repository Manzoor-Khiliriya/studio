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

  // Poll logs for ticker synchronization
  const { data: logsData } = useGetMyTodayLogsQuery(undefined, { pollingInterval: 30000 });

  const [startTimer] = useStartTimerMutation();
  const [togglePause] = useTogglePauseMutation();
  const [stopTimer] = useStopTimerMutation();

  const activeLog = logsData?.logs?.find(log => log.isRunning);
  const isPaused = activeLog?.logType === "break";
  const status = activeLog ? (isPaused ? "On Break" : "Mission Active") : "Standby";

  // SYNC DROPDOWN WITH ACTIVE LOG
  useEffect(() => {
    if (activeLog?.task?._id) setSelectedTaskId(activeLog.task._id);
  }, [activeLog]);

  // TICKER LOGIC
  useEffect(() => {
    const calculateTimers = () => {
      if (!logsData?.logs) return;
      const now = Date.now();
      const localToday = new Date().toLocaleDateString('en-CA');
      const currentId = activeLog?.task?._id || selectedTaskId;
      if (!currentId) return;

      const allTaskLogs = logsData.logs.filter(l => (l.task?._id === currentId || l.task === currentId) && l.logType === "work");
      const finishedTaskSecs = allTaskLogs.filter(l => !l.isRunning).reduce((sum, l) => sum + (l.durationSeconds || 0), 0);

      const dailyLogs = logsData.logs.filter(l => l.logType === "work" && new Date(l.startTime).toLocaleDateString('en-CA') === localToday);
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

  // PiP Update Bridge
  useEffect(() => {
    if (pipWindowRef.current) {
      const pipDoc = pipWindowRef.current.document;
      const tEl = pipDoc.getElementById('task-timer');
      const dEl = pipDoc.getElementById('daily-timer');
      const sEl = pipDoc.getElementById('status');
      if (tEl) tEl.innerText = formatTime(taskSeconds);
      if (dEl) dEl.innerText = `DAILY: ${formatTime(dailySeconds)}`;
      if (sEl) {
        const activeT = taskList.find(t => t._id === (activeLog?.task?._id || selectedTaskId));
        sEl.innerText = isPaused ? "SHIFT PAUSED" : (activeT ? `${activeT.projectNumber}` : "MISSION ACTIVE");
      }
      pipDoc.body.style.backgroundColor = isPaused ? "#1e1b4b" : "#020617";
    }
  }, [taskSeconds, dailySeconds, isPaused, activeLog, selectedTaskId, taskList]);

  const handlePopOut = async () => {
    if (!('documentPictureInPicture' in window)) return toast.error("PiP unsupported");
    try {
      const pipWindow = await window.documentPictureInPicture.requestWindow({ width: 260, height: 130 });
      pipWindowRef.current = pipWindow;
      setIsPipActive(true);
      const style = pipWindow.document.createElement('style');
      style.textContent = `body { margin: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: ui-monospace, monospace; color: white; background: #020617; } #status { font-size: 8px; font-weight: 800; color: #64748b; margin-bottom: 2px; } #task-timer { font-size: 38px; font-weight: 900; color: #f97316; } #daily-timer { font-size: 10px; color: #475569; margin-top: 5px; border-top: 1px solid #1e293b; width: 80%; text-align: center; }`;
      pipWindow.document.head.appendChild(style);
      const s = pipWindow.document.createElement('div'); s.id = 'status';
      const t = pipWindow.document.createElement('div'); t.id = 'task-timer';
      const d = pipWindow.document.createElement('div'); d.id = 'daily-timer';
      pipWindow.document.body.append(s, t, d);
      pipWindow.addEventListener("pagehide", () => setIsPipActive(false));
    } catch (err) { console.error(err); }
  };

  const handleStart = async () => {
    if (!selectedTaskId) return toast.error("Target required");
    try {
      await startTimer(selectedTaskId).unwrap();
      handlePopOut();
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
          <button onClick={handlePopOut} className="text-[10px] font-black text-orange-500 hover:text-orange-400 flex items-center gap-2 uppercase tracking-widest">
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
          <option value="" className="bg-slate-900">Awaiting Assignment...</option>
          {taskList.map(task => (
            <option key={task._id} value={task._id} className="bg-slate-900">
              [{task.projectNumber}] {task.title}
            </option>
          ))}
        </select>
      </div>

      <div className={`py-10 rounded-[2rem] text-center border transition-all ${isPaused ? 'bg-slate-900/40 border-white/5' : 'bg-orange-600/[0.01] border-orange-600/20'}`}>
        <p className="text-[9px] font-black uppercase tracking-[0.5em] text-orange-500/40 mb-3">Project Chronometer</p>
        <h3 className="text-6xl font-black italic tracking-tighter text-white tabular-nums">{formatTime(taskSeconds)}</h3>
        <div className="mt-4 pt-4 border-t border-white/5 mx-10">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Today Session: <span className="text-slate-300 ml-2">{formatTime(dailySeconds)}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {!activeLog ? (
          <button onClick={handleStart} disabled={!selectedTaskId} className="col-span-2 py-5 rounded-[1.5rem] bg-orange-600 hover:bg-orange-50 text-white text-[11px] font-black uppercase tracking-widest disabled:opacity-20 transition-all">
            Initiate Deployment
          </button>
        ) : (
          <>
            <button onClick={() => togglePause()} className={`py-5 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest border transition-all ${isPaused ? "bg-white text-slate-950" : "bg-transparent border-white/10 text-white hover:bg-white/5"}`}>
              {isPaused ? <><FiPlay className="inline mr-2" /> Resume</> : <><FiCoffee className="inline mr-2" /> Break</>}
            </button>
            <button onClick={handleStop} className="py-5 rounded-[1.5rem] bg-red-600/10 text-red-500 border border-red-600/20 text-[11px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all">
              Terminate
            </button>
          </>
        )}
      </div>
    </div>
  );
}
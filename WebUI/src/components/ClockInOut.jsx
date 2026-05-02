import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import { FiPlay, FiCoffee, FiTarget, FiZap, FiSquare, } from "react-icons/fi";
import { useGetMyTodayLogsQuery, useStartTimerMutation, useTogglePauseMutation, useStopTimerMutation } from "../services/timeLogApi";
import ConfirmModal from "./ConfirmModal";
import FloatingTimer from "./FloatingTimer";
import CustomDropdown from "./CustomDropdown";

export default function ClockInOut({ taskList = [], totalSeconds }) {
  const [confirmStop, setConfirmStop] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState("");

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

  const handleStart = async () => {
    if (!selectedTaskId) return toast.error("Target required");
    try {
      await startTimer(selectedTaskId).unwrap();
    } catch (err) { toast.error(err?.data?.error || "Startup Failed"); }
  };

  const handleStopConfirm = async () => {
    try {
      await stopTimer().unwrap();
      setSelectedTaskId("");
      setConfirmStop(false);
      toast.success("Task Timer Stopped Successfully");

    } catch {
      toast.error("Stop failed");
    }
  };

  const formatTime = (totalSec) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className={`h-2.5 w-2.5 rounded-full ${activeLog ? (isPaused ? "bg-orange-500" : "bg-emerald-500 animate-pulse") : "bg-slate-700"}`} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">{status}</span>
          </div>
        </div>

        <div className="relative">
          <FiTarget
            className={`absolute left-4 top-1/2 -translate-y-1/2 ${selectedTaskId ? "text-orange-500" : "text-slate-600"
              }`}
          />
          <CustomDropdown
            value={selectedTaskId}
            onChange={(val) => setSelectedTaskId(val)}
            searchable
            options={[
              { label: "Select Task...", value: "" },
              ...taskList.map((task) => ({
                label: `${task.projectTitle} (${task?.projectCode}) - ${task.title}`,
                value: task.id
              }))
            ]}
            disabled={!!activeLog}
            className="w-full"
            buttonClass={`w-full bg-white/[0.03] border border-white/10 text-white text-sm font-bold py-5 pl-12 pr-4 rounded-[1.5rem] outline-none ${activeLog ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              }`}
          />
        </div>

        <div className={`py-10 rounded-[2rem] text-center border transition-all ${isPaused ? 'bg-slate-900/40 border-white/5' : 'bg-orange-600/[0.01] border-orange-600/20'}`}>
          <p className="text-[9px] font-black uppercase tracking-[0.5em] text-orange-500/40 mb-3">Today's Work</p>
          <h3 className="text-6xl font-black italic tracking-tighter text-white tabular-nums">{formatTime(totalSeconds)}</h3>
        </div>

        <div className="flex items-center gap-4 w-full">
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
                className={`cursor-pointer flex-1 w-0 py-5 rounded-[1.5rem] flex items-center justify-center gap-3 font-black text-[11px] uppercase tracking-widest transition-all disabled:opacity-50 ${isPaused ? "bg-green-500 text-slate-950 hover:bg-green-600" : "bg-slate-500 hover:bg-slate-600 text-white"}`}
              >
                {isToggling ? "Processing..." : (isPaused ? <><FiPlay size={18} /> Resume</> : <><FiCoffee size={18} /> Break</>)}
              </button>
              <button
                onClick={() => setConfirmStop(true)}
                disabled={isSyncing}
                className="cursor-pointer flex-1 w-0 py-5 rounded-[1.5rem] flex items-center justify-center gap-3 bg-red-500 text-white text-[11px] font-black uppercase tracking-widest hover:bg-red-600 transition-all disabled:opacity-50"
              >
                {isStopping ? (
                  "Stopping..."
                ) : (
                  <>
                    <FiZap size={18} />
                    Stop Task
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
      <ConfirmModal
        isOpen={confirmStop}
        onClose={() => setConfirmStop(false)}
        onConfirm={handleStopConfirm}
        title="Stop Task"
        message="Are you sure you want to stop this task?"
        confirmText="Stop Task"
        variant="error"
      />

      {/* <FloatingTimer
        seconds={totalSeconds}
        isRunning={!!activeLog && !isPaused}
        isBreak={isPaused}
      /> */}
    </>
  );
}
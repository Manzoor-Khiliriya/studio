import React, { useEffect, useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiZap, FiClock, FiTarget, FiBriefcase, FiActivity, FiLock, FiTrendingUp } from "react-icons/fi";
import { HiOutlineBolt } from 'react-icons/hi2';
import { toast } from "react-hot-toast";

// RTK Query Hooks
import { useGetDashboardSummaryQuery } from "../../services/dashboardApi";
import { useGetMyTasksQuery } from "../../services/taskApi";
import { useGetMyTodayLogsQuery } from "../../services/timeLogApi";
import { useGetTodayStatusQuery, useClockInMutation, useClockOutMutation } from "../../services/attendanceApi";

// Components
import ClockInOut from "../../components/ClockInOut";
import TaskCard from "../../components/TaskCard";
import Loader from "../../components/Loader";
import Pagination from "../../components/Pagination";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";

export default function EmployeeDashboard() {
  const timerRef = useRef(null);
  const shiftTimerRef = useRef(null);

  // Local State
  const [todaySeconds, setTodaySeconds] = useState(0);
  const [shiftSeconds, setShiftSeconds] = useState(0);
  const [runningTask, setRunningTask] = useState(null);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // 1. API Calls
  const { data: summaryData, isLoading: summaryLoading } = useGetDashboardSummaryQuery();
  const { data: attendanceStatus, isLoading: attendanceLoading } = useGetTodayStatusQuery();
  const [clockIn] = useClockInMutation();
  const [clockOut] = useClockOutMutation();

  // 2. Fetch Tasks (Not Completed) for both Dropdown and List
  const { data: tasksData, isLoading: tasksLoading } = useGetMyTasksQuery({
    status: "!Completed",
    limit: 100 
  });

  const { data: logsData, isSuccess: logsLoaded } = useGetMyTodayLogsQuery();

  // 3. Derived Data
  const allActiveTasks = useMemo(() => tasksData?.tasks || [], [tasksData]);
  
  const liveMissions = useMemo(() => 
    allActiveTasks.filter(task => ["In Progress", "To be started"].includes(task.liveStatus)),
    [allActiveTasks]
  );

  const paginatedMissions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return liveMissions.slice(startIndex, startIndex + itemsPerPage);
  }, [liveMissions, currentPage]);

  const isOnShift = attendanceStatus?.clockIn && !attendanceStatus?.clockOut;
  const empStats = summaryData?.stats || {};

  // 4. Project Ticker & Sync Logic
  useEffect(() => {
    if (logsLoaded && logsData) {
      const { logs } = logsData;
      let totalSeconds = 0;
      let activeTaskName = null;
      let isBreak = false;

      const activeLog = logs.find(log => log.isRunning);
      if (activeLog) {
        activeTaskName = activeLog.task?.title || "Active Mission";
        isBreak = activeLog.logType === "break";
      }

      logs.forEach(log => {
        if (log.logType === "work") {
          if (log.isRunning) {
            const diffSec = Math.floor((Date.now() - new Date(log.startTime).getTime()) / 1000);
            totalSeconds += Math.max(0, diffSec);
          } else {
            totalSeconds += (log.durationSeconds || 0);
          }
        }
      });

      setRunningTask(activeTaskName);
      setIsOnBreak(isBreak);
      setTodaySeconds(totalSeconds);
    }
  }, [logsData, logsLoaded]);

  // 5. Tickers
  useEffect(() => {
    if (runningTask && !isOnBreak) {
      timerRef.current = setInterval(() => setTodaySeconds(prev => prev + 1), 1000);
    } else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [runningTask, isOnBreak]);

  useEffect(() => {
    if (isOnShift && attendanceStatus?.clockIn) {
      const start = new Date(attendanceStatus.clockIn).getTime();
      shiftTimerRef.current = setInterval(() => setShiftSeconds(Math.floor((Date.now() - start) / 1000)), 1000);
    } else {
      clearInterval(shiftTimerRef.current);
      setShiftSeconds(0);
    }
    return () => clearInterval(shiftTimerRef.current);
  }, [isOnShift, attendanceStatus]);

  const handleAttendanceToggle = async () => {
    const t = toast.loading(isOnShift ? "Clocking out..." : "Clocking in...");
    try {
      isOnShift ? await clockOut().unwrap() : await clockIn().unwrap();
      toast.success(isOnShift ? "Shift Completed" : "Shift Started", { id: t });
    } catch (err) {
      toast.error(err?.data?.message || "Action failed", { id: t });
    }
  };

  const formatTime = (sec) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h}h ${m}m ${s}s`;
  };

  if (tasksLoading || attendanceLoading || summaryLoading) return <Loader message="Syncing Systems..." />;

  return (
    <div className="min-h-screen bg-[#f1f5f9]">
      <div className="max-w-[1600px] mx-auto px-6 py-10">
        
        <PageHeader
          title="Operations Center"
          subtitle={isOnShift ? "System Online • Operator Active" : "System Standby • Please Clock In"}
        />

        {/* --- KPI GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 my-8">
          <StatCard
            label="Daily Productivity"
            value={formatTime(todaySeconds)}
            icon={<FiClock className={runningTask ? "text-orange-500 animate-pulse" : ""} />}
            variant={runningTask ? "active" : "default"}
          />
          <StatCard
            label="Shift Timer"
            value={isOnShift ? formatTime(shiftSeconds) : "00h 00m 00s"}
            icon={<FiActivity className={isOnShift ? "text-emerald-500" : ""} />}
          />
          <StatCard
            label="Weekly Hours"
            value={`${empStats.weeklyHours || 0} hrs`}
            icon={<FiTrendingUp className="text-blue-500" />}
          />
          <StatCard
            label="Open Objectives"
            value={liveMissions.length}
            icon={<FiTarget className="text-rose-500" />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* --- LEFT: STATION CONTROL --- */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Attendance Module */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-blue-900/5 border border-white">
              <div className="flex flex-col items-center text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isOnShift ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                  <FiActivity size={30} className={isOnShift ? "animate-bounce" : ""} />
                </div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Daily Attendance</h3>
                <p className="text-slate-500 text-sm mb-6">Log your daily presence</p>

                <button
                  onClick={handleAttendanceToggle}
                  className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${isOnShift
                      ? "bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white"
                      : "bg-slate-900 text-white hover:shadow-lg hover:bg-black"
                    }`}
                >
                  {isOnShift ? "End Work Day" : "Start Work Day"}
                </button>

                {isOnShift && (
                  <div className="mt-6 p-4 bg-slate-50 rounded-2xl w-full flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Login Time</span>
                    <span className="text-xs font-black text-slate-700">
                      {new Date(attendanceStatus.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Project Timer Module */}
            <div className="bg-[#0f1115] p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group">
              <ClockInOut 
                todaySeconds={todaySeconds} 
                taskList={allActiveTasks} 
              />
              <FiZap className="absolute -right-10 -bottom-10 text-white/[0.03]" size={200} />
            </div>
          </div>

          {/* --- RIGHT: MISSION QUEUE --- */}
          <div className="lg:col-span-8 relative">

            {/* Tactical Lock Overlay */}
            {!isOnShift && (
              <div className="absolute inset-0 z-30 backdrop-blur-md bg-white/40 rounded-[3rem] flex items-center justify-center text-center">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-100 max-w-sm">
                  <div className="w-20 h-20 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FiLock size={40} />
                  </div>
                  <h4 className="text-2xl font-black text-slate-800 mb-2">Missions Locked</h4>
                  <p className="text-slate-500 text-sm mb-8">Please clock in to access project tracking.</p>
                  <button onClick={handleAttendanceToggle} className="bg-orange-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-orange-600 transition-all">Quick Clock-In</button>
                </motion.div>
              </div>
            )}

            <div className={`space-y-4 ${!isOnShift ? 'pointer-events-none opacity-20' : ''}`}>
              <div className="flex items-center justify-between px-4">
                <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                  <HiOutlineBolt className="text-orange-500" /> Active Objectives
                </h3>
                <span className="text-[10px] font-black bg-white px-3 py-1 rounded-full text-slate-400 border border-slate-100 uppercase tracking-widest">
                  {liveMissions.length} Total
                </span>
              </div>

              <div className="min-h-[500px] space-y-4">
                <AnimatePresence mode="popLayout">
                  {paginatedMissions.length > 0 ? (
                    paginatedMissions.map((task) => (
                      <TaskCard 
                        key={task._id} 
                        task={task}
                        isTracking={runningTask === task.title && !isOnBreak}
                      />
                    ))
                  ) : (
                    <div className="h-[400px] flex flex-col items-center justify-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
                      <FiBriefcase size={40} className="text-slate-200 mb-4" />
                      <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No live missions</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>

              {/* Pagination */}
              {liveMissions.length > itemsPerPage && (
                <div className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm mt-6">
                  <Pagination
                    pagination={{
                      current: currentPage,
                      total: Math.ceil(liveMissions.length / itemsPerPage),
                      count: liveMissions.length
                    }}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
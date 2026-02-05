import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster } from "react-hot-toast";
import {
  FiBriefcase, FiCalendar, FiClock, FiZap,
  FiPlayCircle, FiTarget, FiActivity, FiSearch, FiFilter
} from "react-icons/fi";

// RTK Query Hooks
import { useGetDashboardSummaryQuery } from "../services/dashboardApi";
import { useGetMyTasksQuery } from "../services/taskApi";
import { useGetMyTodayLogsQuery } from "../services/timeLogApi";

import ClockInOut from "../components/ClockInOut";
import TaskCard from "../components/TaskCard";
import Loader from "../components/Loader";
import Pagination from "../components/Pagination";

export default function EmployeeDashboard() {
  const timerRef = useRef(null);
  const [todaySeconds, setTodaySeconds] = useState(0);
  const [runningTask, setRunningTask] = useState(null);
  const [isOnBreak, setIsOnBreak] = useState(false);

  // --- FILTER & PAGINATION STATE ---
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // RTK Query
  const { data: dashboardStats } = useGetDashboardSummaryQuery();
  const { data: tasksData, isLoading: tasksLoading } = useGetMyTasksQuery({
    page: currentPage,
    limit: itemsPerPage,
    search: searchTerm,
    status: statusFilter === "All" ? "" : statusFilter
  });
  const { data: logsData, isSuccess: logsLoaded } = useGetMyTodayLogsQuery();

  const tasks = tasksData?.tasks || [];
  const paginationInfo = tasksData?.pagination || { current: 1, total: 1, count: 0 };

  /**
   * Sync Live Stats with Backend Logs
   */
  useEffect(() => {
    if (logsLoaded && logsData) {
      const { logs, isCurrentlyOnBreak } = logsData;
      const localToday = new Date().toLocaleDateString('en-CA');

      let totalSeconds = 0;
      let activeTaskName = null;

      logs.forEach(log => {
        const logStart = new Date(log.startTime);
        if (logStart.toLocaleDateString('en-CA') === localToday) {
          if (log.isRunning) {
            activeTaskName = log.task?.title || log.taskTitle || "Active Mission";
            const diffSec = Math.floor((Date.now() - logStart.getTime()) / 1000);
            totalSeconds += diffSec;
          } else {
            totalSeconds += (log.durationSeconds || 0);
          }
        }
      });

      setRunningTask(activeTaskName);
      setIsOnBreak(isCurrentlyOnBreak);
      setTodaySeconds(totalSeconds);
    }
  }, [logsData, logsLoaded]);

  /**
   * Live Ticker Logic
   */
  useEffect(() => {
    if (runningTask && !isOnBreak) {
      timerRef.current = setInterval(() => {
        setTodaySeconds(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [runningTask, isOnBreak]);

  // Reset page on filter change
  useEffect(() => setCurrentPage(1), [searchTerm, statusFilter]);

  const formatTime = (sec) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h}h ${m}m ${s}s`;
  };

  if (tasksLoading && !tasksData) return <Loader message="Syncing Terminal..." />;

  return (
    <div className="min-h-screen bg-[#fdfdfd] relative">
      <Toaster position="bottom-right" />

      <div className="max-w-[1600px] mx-auto p-4 lg:p-10">
        
        {/* --- HEADER --- */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <motion.div 
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 4 }}
                className="bg-orange-600 text-white p-2.5 rounded-2xl shadow-lg shadow-orange-600/20"
              >
                <FiZap size={24} />
              </motion.div>
              <p className="text-orange-600 font-black uppercase text-[10px] tracking-[0.4em]">Operator Terminal</p>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter uppercase leading-tight">
              Mission <span className="text-slate-300 italic">Control</span>
            </h1>
          </div>
          <div className="flex items-center gap-4 bg-white border border-orange-100 px-8 py-5 rounded-[2.5rem] shadow-sm">
            <FiCalendar className="text-orange-500" size={20} />
            <span className="text-sm font-black text-slate-900 uppercase tracking-tight">
              {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </header>

        <div className="grid lg:grid-cols-12 gap-10">
          
          {/* --- LEFT: COMMAND CENTER --- */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="bg-[#0f1115] p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden group border border-slate-800">
              <div className="relative z-10">
                <ClockInOut />
              </div>
              <FiActivity className="absolute -right-16 -bottom-16 text-white/[0.03] group-hover:text-orange-600/10 transition-colors duration-700" size={300} />
            </div>

            <div className="space-y-4">
              <StatSmall label="Today's Shift" value={formatTime(todaySeconds)} icon={<FiClock />} color="orange" />
              <StatSmall label="Weekly Load" value={`${dashboardStats?.stats?.weeklyHours || 0}h`} icon={<FiTarget />} color="dark" />
              <StatSmall 
                label="Mission Queue" 
                value={paginationInfo.count || 0} 
                icon={<FiBriefcase />} 
                color="dark" 
              />
            </div>
          </aside>

          {/* --- RIGHT: TASK GRID --- */}
          <main className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {runningTask && (
                <ActiveTaskBanner task={runningTask} time={formatTime(todaySeconds)} />
              )}
            </AnimatePresence>

            {/* Inventory Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4 bg-white p-6 rounded-[2.5rem] border border-orange-50 shadow-sm">
              <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase ml-2">Inventory</h2>
              
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-none">
                  <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Identify mission..."
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="relative flex-1 sm:flex-none">
                  <FiFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <select 
                    className="w-full pl-11 pr-8 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold outline-none appearance-none cursor-pointer hover:bg-slate-100 transition-colors"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="All">All Levels</option>
                    <option value="Pending">Pending</option>
                    <option value="In Progress">Active</option>
                    <option value="Completed">Resolved</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Task Cards */}
            <div className="min-h-[400px]">
              {tasks.length > 0 ? (
                <motion.div layout className="grid grid-cols-1 gap-5 mb-10">
                  {tasks.map((task) => (
                    <motion.div 
                      layout 
                      key={task._id} 
                      initial={{ opacity: 0, y: 20 }} 
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                    >
                      <TaskCard task={task} isTracking={runningTask === task.title} />
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <EmptyState />
              )}
            </div>

            {/* Pagination Container */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-orange-50 shadow-sm">
              <Pagination 
                pagination={paginationInfo}
                onPageChange={(page) => setCurrentPage(page)}
                loading={tasksLoading}
                label="Missions"
              />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function ActiveTaskBanner({ task, time }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }} 
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="mb-8 p-10 bg-orange-600 text-white rounded-[3.5rem] flex flex-col md:flex-row items-center justify-between shadow-2xl shadow-orange-600/20 relative overflow-hidden"
    >
      <div className="relative z-10 text-center md:text-left mb-6 md:mb-0">
        <div className="flex items-center gap-3 mb-3 justify-center md:justify-start">
          <div className="flex h-3 w-3 relative">
            <span className="animate-ping absolute h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/80">Telemetry Active</p>
        </div>
        <h3 className="text-3xl md:text-5xl font-black tracking-tighter uppercase leading-none italic">{task}</h3>
      </div>
      <div className="text-center md:text-right relative z-10 border-t md:border-t-0 md:border-l border-white/20 pt-6 md:pt-0 md:pl-10">
        <p className="text-5xl md:text-7xl font-black italic tracking-tighter">{time}</p>
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/60 mt-2">Current Session Duration</p>
      </div>
      <FiPlayCircle className="absolute -left-10 -bottom-10 text-white/5" size={250} />
    </motion.div>
  );
}

function StatSmall({ label, value, icon, color }) {
  const isOrange = color === "orange";
  return (
    <div className="bg-white p-6 md:p-8 rounded-[2.5rem] flex justify-between items-center border border-orange-50 hover:border-orange-200 hover:shadow-xl hover:shadow-orange-500/5 transition-all group">
      <div className="flex items-center gap-5">
        <div className={`p-4 rounded-2xl transition-all duration-500 ${isOrange ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-900 group-hover:text-white'}`}>
          {React.cloneElement(icon, { size: 20 })}
        </div>
        <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">{label}</span>
      </div>
      <span className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter">{value}</span>
    </div>
  );
}

function EmptyState() {
  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="bg-white border-2 border-dashed border-orange-100 rounded-[3.5rem] py-24 text-center mb-10"
    >
      <div className="bg-orange-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
        <FiBriefcase className="text-orange-200" size={32} />
      </div>
      <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-[10px]">Radar Clear • No Missions Found</p>
    </motion.div>
  );
}
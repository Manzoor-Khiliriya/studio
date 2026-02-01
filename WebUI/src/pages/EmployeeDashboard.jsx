import React, { useEffect, useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster } from "react-hot-toast";
import {
  FiBriefcase, FiCalendar, FiClock, FiZap,
  FiPlayCircle, FiTarget, FiActivity, FiSearch
} from "react-icons/fi";

// RTK Query Hooks
import { useGetDashboardSummaryQuery } from "../services/dashboardApi";
import { useGetMyTasksQuery } from "../services/taskApi";
import { useGetMyLogsQuery } from "../services/timeLogApi"; // Ensure name matches your slice

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
    status: statusFilter
  });
  const { data: logsData, isSuccess: logsLoaded } = useGetMyLogsQuery();

  // Safely extract tasks and pagination
  const tasks = tasksData?.tasks || [];
  const paginationInfo = tasksData?.pagination || { current: 1, total: 1, count: 0 };

  /**
   * Effect: Process TimeLogs & Sync Live Stats
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
   * Effect: Live Ticker
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
    <div className="min-h-screen p-4 lg:p-10 bg-white relative overflow-hidden">
      <Toaster position="bottom-right" />

      <div className="max-w-[1500px] mx-auto">
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-orange-600 text-white p-2 rounded-xl"><FiZap size={24} /></span>
              <p className="text-orange-600 font-black uppercase text-[10px] tracking-[0.3em]">Operator Terminal</p>
            </div>
            <h1 className="text-7xl font-black text-slate-900 tracking-tighter uppercase leading-none">Mission Control</h1>
          </div>
          <div className="flex items-center gap-4 bg-slate-50 border-2 border-slate-100 px-8 py-5 rounded-[2.5rem]">
            <FiCalendar className="text-slate-400" size={20} />
            <span className="text-sm font-black text-slate-900 uppercase tracking-tight">
              {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-12">
          {/* --- LEFT: COMMAND CENTER --- */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-[#13151b] p-10 rounded-[4rem] shadow-2xl relative overflow-hidden group">
              <div className="relative z-10">
                <ClockInOut />
              </div>
              <FiActivity className="absolute -right-10 -bottom-10 text-white/5 group-hover:text-orange-600/10 transition-colors" size={240} />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <StatSmall label="Today's Shift" value={formatTime(todaySeconds)} icon={<FiClock />} color="orange" />
              <StatSmall label="Weekly Load" value={`${dashboardStats?.stats?.weeklyHours || 0}h`} icon={<FiTarget />} color="dark" />
              <StatSmall 
                label="Pending Tasks" 
                value={paginationInfo.count || 0} 
                icon={<FiBriefcase />} 
                color="dark" 
              />
            </div>
          </div>

          {/* --- RIGHT: TASK GRID --- */}
          <div className="lg:col-span-8">
            <ActiveTaskBanner task={runningTask} time={formatTime(todaySeconds)} />

            {/* Inventory Controls */}
            <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4 px-4">
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Inventory</h2>
              
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Search mission..."
                    className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:border-orange-500 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <select 
                  className="bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl text-xs font-bold outline-none cursor-pointer"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="All">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

            {tasks.length > 0 ? (
              <div className="grid grid-cols-1 gap-5 mb-10">
                {tasks.map((task) => (
                  <motion.div layout key={task._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <TaskCard task={task} isTracking={runningTask === task.title} />
                  </motion.div>
                ))}
              </div>
            ) : <EmptyState />}

            {/* Dashboard Pagination */}
            <div className="bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-50">
              <Pagination 
                pagination={paginationInfo}
                onPageChange={(page) => setCurrentPage(page)}
                loading={tasksLoading}
                label="Missions"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function ActiveTaskBanner({ task, time }) {
  if (!task) return null;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className="mb-10 p-10 bg-orange-600 text-white rounded-[4rem] flex flex-col md:flex-row items-center justify-between shadow-2xl shadow-orange-600/30 relative overflow-hidden"
    >
      <div className="relative z-10 text-center md:text-left mb-4 md:mb-0">
        <div className="flex items-center gap-2 mb-2 justify-center md:justify-start">
          <span className="w-2 h-2 bg-white rounded-full animate-ping" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80">Telemetry Active</p>
        </div>
        <h3 className="text-4xl font-black tracking-tighter uppercase leading-none italic">{task}</h3>
      </div>
      <div className="text-center md:text-right relative z-10">
        <p className="text-6xl font-black italic tracking-tighter drop-shadow-lg">{time}</p>
      </div>
      <FiPlayCircle className="absolute -left-10 -bottom-10 text-white/5" size={200} />
    </motion.div>
  );
}

function StatSmall({ label, value, icon, color }) {
  const isOrange = color === "orange";
  return (
    <div className="bg-white p-8 rounded-[3rem] flex justify-between items-center border-2 border-slate-50 hover:border-orange-100 transition-all group">
      <div className="flex items-center gap-6">
        <div className={`p-5 rounded-[1.5rem] transition-all ${isOrange ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-900 group-hover:text-white'}`}>
          {icon}
        </div>
        <span className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em]">{label}</span>
      </div>
      <span className="text-3xl font-black text-slate-900 tracking-tighter">{value}</span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-slate-50 border-4 border-dashed border-slate-100 rounded-[4rem] py-32 text-center">
      <FiBriefcase className="mx-auto text-slate-200 mb-6" size={64} />
      <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-xs">Radar Clear • No Pending Missions</p>
    </div>
  );
}
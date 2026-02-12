import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiZap, FiClock, FiTarget, FiBriefcase, FiSearch } from "react-icons/fi";
import { HiOutlineBolt } from 'react-icons/hi2';

// RTK Query Hooks
import { useGetDashboardSummaryQuery } from "../../services/dashboardApi";
import { useGetMyTasksQuery } from "../../services/taskApi";
import { useGetMyTodayLogsQuery } from "../../services/timeLogApi";

// Components
import ClockInOut from "../../components/ClockInOut";
import TaskCard from "../../components/TaskCard";
import Loader from "../../components/Loader";
import Pagination from "../../components/Pagination";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";

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

  // 1. CALCULATE CUMULATIVE DAILY TOTAL
  useEffect(() => {
    if (logsLoaded && logsData) {
      const { logs } = logsData;
      const localToday = new Date().toLocaleDateString('en-CA');
      
      let totalSeconds = 0;
      let activeTaskName = null;
      let isBreak = false;

      const activeLog = logs.find(log => log.isRunning);
      if (activeLog) {
        activeTaskName = activeLog.task?.title || "Active Mission";
        isBreak = activeLog.logType === "break";
      }

      logs.forEach(log => {
        const logStart = new Date(log.startTime);
        if (logStart.toLocaleDateString('en-CA') === localToday && log.logType === "work") {
          if (log.isRunning) {
            const diffSec = Math.floor((Date.now() - logStart.getTime()) / 1000);
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

  // 2. GLOBAL TICKER
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

  // 3. Reset to page 1 on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const formatTime = (sec) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h}h ${m}m ${s}s`;
  };

  if (tasksLoading && !tasksData) return <Loader message="Decrypting Mission Data..." />;

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="max-w-[1700px] mx-auto px-8 pt-10 pb-20">
        
        <PageHeader
          title="Operator Terminal"
          iconText="O"
          subtitle="Real-time telemetry and mission objective management."
        />

        {/* --- STAT MATRIX --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12 mt-10">
          <StatCard
            label="Active Shift Total"
            value={formatTime(todaySeconds)}
            icon={<FiClock size={22} className={runningTask && !isOnBreak ? "text-orange-500 animate-pulse" : "text-slate-400"} />}
            variant={runningTask && !isOnBreak ? "active" : "default"}
            delay={0.1}
          />
          <StatCard 
            label="Weekly Cumulative" 
            value={`${dashboardStats?.stats?.weeklyHours || 0}h`} 
            icon={<FiTarget size={22} className="text-slate-400" />} 
            delay={0.2} 
          />
          <StatCard 
            label="Mission Inventory" 
            value={paginationInfo.count || 0} 
            icon={<FiBriefcase size={22} className="text-slate-400" />} 
            delay={0.3} 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* --- LEFT: COMMAND CENTER --- */}
          <div className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-10">
            <div className="bg-[#0f1115] p-8 rounded-[3rem] shadow-2xl border border-slate-800 relative overflow-hidden group">
              <ClockInOut todaySeconds={todaySeconds} />
              <FiZap className="absolute -right-10 -bottom-10 text-white/[0.02] group-hover:text-orange-500/[0.05] transition-colors duration-700" size={200} />
            </div>

            <AnimatePresence>
              {runningTask && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className={`p-6 rounded-[2rem] text-white shadow-xl ${isOnBreak ? 'bg-slate-800' : 'bg-orange-600 shadow-orange-600/20'}`}
                >
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-60 mb-1.5">
                    {isOnBreak ? "Telemetry Suspended" : "Target Engaged"}
                  </p>
                  <h4 className="text-lg font-black uppercase tracking-tight truncate">
                    {isOnBreak ? "Break in Progress" : runningTask}
                  </h4>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* --- RIGHT: MISSION QUEUE --- */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            
            {/* Filter Bar */}
            <div className="bg-white rounded-[2rem] border border-slate-200 p-3 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
              <h3 className="font-black text-slate-900 text-[10px] uppercase tracking-[0.2em] flex items-center gap-3 ml-4">
                <HiOutlineBolt className="text-orange-500" size={16} /> Mission Queue
              </h3>
              
              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:flex-none">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input
                    type="text"
                    placeholder="Search IDs or Titles..."
                    className="w-full md:w-64 pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-black uppercase outline-none focus:ring-2 focus:ring-orange-500/10 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <select 
                   className="pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black uppercase outline-none cursor-pointer hover:bg-slate-100 transition-colors"
                   value={statusFilter}
                   onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="All">All Sectors</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">Active</option>
                  <option value="Completed">Completed</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>
            </div>

            {/* Scrollable Tasks Area */}
            <div className="h-[650px] overflow-y-auto pr-2 custom-scrollbar space-y-4">
              <AnimatePresence mode="popLayout">
                {tasks.length > 0 ? (
                  tasks.map((task) => (
                    <TaskCard 
                      key={task._id} 
                      task={task} 
                      isTracking={runningTask === task.title && !isOnBreak} 
                    />
                  ))
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-slate-100"
                  >
                    <div className="bg-slate-50 p-6 rounded-full mb-4">
                      <FiSearch size={32} className="text-slate-200" />
                    </div>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">No matching objectives found</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Pagination Footer */}
            <div className="bg-white p-4 rounded-[2rem] border border-slate-200 shadow-sm mt-2">
              <Pagination 
                pagination={paginationInfo} 
                onPageChange={setCurrentPage} 
                loading={tasksLoading} 
                label="Objectives" 
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
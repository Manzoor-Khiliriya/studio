import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster } from "react-hot-toast";
import { FiZap, FiClock, FiTarget, FiBriefcase, FiSearch, FiFilter } from "react-icons/fi";
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
            activeTaskName = log.task?.title || "Active Mission";
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

  useEffect(() => {
    if (runningTask && !isOnBreak) {
      timerRef.current = setInterval(() => setTodaySeconds(prev => prev + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [runningTask, isOnBreak]);

  useEffect(() => setCurrentPage(1), [searchTerm, statusFilter]);

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

        {/* --- TACTICAL HEADER --- */}
        <PageHeader
          title="Operator Terminal"
          iconText="O"
          subtitle="Real-time telemetry and mission objective management."
          actionLabel={runningTask ? "Active Session" : "Standby"}
          onAction={() => { }} // Could trigger the pop-out timer here!
        />

        {/* --- STATS MATRIX --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12 mt-10">
          <StatCard
            label="Today's Active Shift"
            value={formatTime(todaySeconds)}
            icon={<FiClock size={24} className={runningTask ? "text-orange-500" : "text-slate-900"} />}
            variant={runningTask ? "active" : "default"}
            delay={0.1}
          />
          <StatCard
            label="Weekly Cumulative"
            value={`${dashboardStats?.stats?.weeklyHours || 0}h`}
            icon={<FiTarget size={24} className="text-slate-900" />}
            delay={0.2}
          />
          <StatCard
            label="Mission Inventory"
            value={paginationInfo.count || 0}
            icon={<FiBriefcase size={24} className="text-slate-900" />}
            delay={0.3}
          />
        </div>

        {/* --- LIVE OPS & MISSION GRID --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* LEFT: COMMAND CENTER (The Clock) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-[#0f1115] p-8 rounded-[3rem] shadow-2xl border border-slate-800 relative overflow-hidden">
              <ClockInOut />
              <FiZap className="absolute -right-10 -bottom-10 text-white/[0.02]" size={200} />
            </div>

            {/* Dynamic Banner for Current Task */}
            <AnimatePresence>
              {runningTask && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-6 bg-orange-600 rounded-[2rem] text-white shadow-xl shadow-orange-600/20"
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mb-2">Target Locked</p>
                  <h4 className="text-xl font-black uppercase italic truncate">{runningTask}</h4>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* RIGHT: INVENTORY (Tasks) */}
          <div className="lg:col-span-8 flex flex-col gap-8">

            {/* Inventory Controls */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 p-6 shadow-xl shadow-slate-200/40 flex flex-col sm:flex-row items-center justify-between gap-4">
              <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest flex items-center gap-3 ml-4">
                <HiOutlineBolt className="text-orange-500" />
                Mission Queue
              </h3>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-none">
                  <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Identify Objective..."
                    className="pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold outline-none w-full sm:w-64 focus:ring-2 focus:ring-orange-500/10 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="relative">
                  <select
                    className="pl-6 pr-10 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold outline-none appearance-none cursor-pointer"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="All">All Status</option>
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Task Cards Container */}
            <div className="space-y-4">
              {tasks.length > 0 ? (
                tasks.map((task) => (
                  <TaskCard key={task._id} task={task} isTracking={runningTask === task.title} />
                ))
              ) : (
                <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-200">
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Radar Clear • No objectives found</p>
                </div>
              )}
            </div>

            {/* Pagination Component */}
            <div className="mt-4">
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
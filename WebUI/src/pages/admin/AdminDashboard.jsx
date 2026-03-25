import React, { useState } from 'react';
import {
  useGetDashboardSummaryQuery,
  useClearLogsMutation,
  useStopAllSessionsMutation
} from '../../services/dashboardApi';
import { useStopTimerMutation } from '../../services/timeLogApi';
import { HiOutlineArrowTrendingUp, HiOutlineBolt, HiOutlineUserGroup, HiOutlineFingerPrint } from 'react-icons/hi2';
import { BiTask, BiTimeFive, BiTrash } from 'react-icons/bi';
import { FiStopCircle, FiAlertTriangle } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

import Loader from '../../components/Loader';
import StatCard from '../../components/StatCard';
import { HiOutlineClipboardList } from 'react-icons/hi';
import PageHeader from '../../components/PageHeader';

const AdminDashboard = () => {
  // Queries & Mutations
  const { data, isLoading } = useGetDashboardSummaryQuery(undefined, {
    pollingInterval: 10000,
    refetchOnFocus: true
  });

  const [stopUserTimer] = useStopTimerMutation();
  const [stopAllSessions, { isLoading: isStoppingAll }] = useStopAllSessionsMutation();
  const [clearLogs, { isLoading: isClearing }] = useClearLogsMutation();

  if (isLoading) return <Loader message="Decrypting Operational Data..." />;

  const stats = data?.stats || {};
  const liveTracking = data?.liveTracking || [];
  const recentActivity = data?.recentActivity || [];

  // 🔹 Force Stop & Global Actions (Keep your existing handlers)
  const handleForceStop = async (userId) => {
    if (!window.confirm("Force terminate this user's active session?")) return;
    try {
      await stopUserTimer({ userId }).unwrap();
      toast.success("Personnel Terminated");
    } catch (err) {
      toast.error("Termination Failed");
    }
  };

  const handleStopAll = async () => {
    if (!window.confirm("CRITICAL: Terminate ALL active sessions globally?")) return;
    try {
      await stopAllSessions().unwrap();
      toast.success("All sessions terminated");
    } catch (err) {
      toast.error("Global shutdown failed");
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm("Clear operational log view? Records remain in database.")) return;
    try {
      await clearLogs().unwrap();
      toast.success("Dashboard log cleared");
    } catch (err) {
      toast.error("Failed to clear logs");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <PageHeader
        title="Admin Dashboard"
        iconText="D"
        subtitle="Manage operational objectives and real-time resource utilization."
      />

      {/* --- STATS MATRIX --- */}
      <div className=" mx-auto px-8 pb-10">

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-12 mt-10">
          {/* 1. Total Projects (Unique Project Numbers) */}
          <StatCard
            label="Total Projects"
            value={stats.totalProjects || 0}
            icon={<HiOutlineClipboardList size={22} />}
            delay={0.1}
          />

          {/* 2. Total Employees (Status: Active) */}
          <StatCard
            label="Active Employees"
            value={stats.totalActiveEmployees || 0}
            icon={<HiOutlineUserGroup size={22} />}
            delay={0.2}
          />

          {/* 3. On-Duty (Clocked In) */}
          <StatCard
            label="On Duty"
            value={stats.attendanceLive || 0}
            variant={stats.attendanceLive > 0 ? "active" : "default"}
            icon={<HiOutlineFingerPrint size={22} />}
            delay={0.3}
          />

          {/* 4. Tasks in Progress */}
          <StatCard
            label="Task In Progress"
            value={stats.tasksInProgress || 0}
            icon={<HiOutlineArrowTrendingUp size={22} />}
            delay={0.4}
          />

          {/* 5. Pending Leaves */}
          <StatCard
            label="Leave Requests"
            value={stats.pendingApprovals || 0}
            variant={stats.pendingApprovals > 0 ? "warning" : "default"}
            icon={<BiTask size={22} />}
            delay={0.5}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* --- LIVE TRACKING COLUMN --- */}
          <div className="lg:col-span-4 bg-white rounded-[3rem] border border-slate-200 p-8 shadow-xl flex flex-col h-[700px]">
            <div className="flex justify-between items-center mb-10 shrink-0">
              <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute h-3 w-3 rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative h-3 w-3 rounded-full bg-blue-500"></span>
                </span>
                Active Timers
              </h3>

              {liveTracking.length > 0 && (
                <button
                  onClick={handleStopAll}
                  disabled={isStoppingAll}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white rounded-full text-[10px] font-black uppercase tracking-tighter transition-all border border-red-100 cursor-pointer"
                >
                  <FiAlertTriangle size={12} /> {isStoppingAll ? 'Shutting Down...' : 'Kill All'}
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
              <AnimatePresence mode='popLayout'>
                {liveTracking.length > 0 ? (
                  liveTracking.map((timer) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, x: 20 }}
                      key={timer.id}
                      className="flex items-center gap-4 p-4 bg-slate-50 rounded-[1.8rem] border border-transparent hover:border-blue-200 hover:bg-white transition-all group"
                    >
                      <div className="relative shrink-0">
                        <img
                          src={timer.photo || `https://ui-avatars.com/api/?name=${timer.employee}&background=2563eb&color=fff`}
                          className="h-10 w-10 rounded-2xl object-cover"
                          alt="user"
                        />
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-black text-slate-900 uppercase truncate">{timer.employee}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase truncate">{timer.task}</p>
                        <p className="text-[8px] text-blue-600 font-black tracking-tighter">PROJECT #{timer.projectCode}</p>
                      </div>
                      <button
                        onClick={() => handleForceStop(timer.userId)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <FiStopCircle size={18} />
                      </button>
                      <HiOutlineBolt className="text-blue-500 animate-pulse shrink-0" size={18} />
                    </motion.div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center italic text-slate-300 gap-2">
                    <p className="text-[10px] uppercase tracking-[0.3em] font-black text-center px-10">No personnel currently logged into tasks</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* --- ACTIVITY LOG COLUMN --- */}
          {/* --- ACTIVITY LOG COLUMN --- */}
          <div className="lg:col-span-8 bg-slate-900 rounded-[3rem] p-8 shadow-2xl border border-slate-800 flex flex-col h-[700px]">
            <div className="flex justify-between items-center mb-10 shrink-0 px-2">
              <div>
                <h3 className="font-black text-white text-sm uppercase tracking-widest">Operational History</h3>
                <p className="text-[9px] text-slate-500 font-bold uppercase mt-1 italic">Tracking Start & Termination Events Only</p>
              </div>
              <button
                onClick={handleClearHistory}
                disabled={isClearing || recentActivity.length === 0}
                className="flex items-center gap-1 text-[12px] font-black text-red-500 hover:text-red-600 transition-colors uppercase tracking-widest cursor-pointer"
                title='Clear Logs'
              >
                <BiTrash size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((log, index) => {
                  // Determine the type of log for styling
                  const isStopAction = log.action === 'Stop' || log.action === 'Terminated';

                  return (
                    <div key={log.id} className="flex gap-6 items-start group">
                      <div className="flex flex-col items-center mt-2 shrink-0">
                        <div className={`w-2.5 h-2.5 rounded-full ${isStopAction ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : 'bg-emerald-500 shadow-[0_0_8px_#10b981]'
                          }`}></div>
                        {index !== recentActivity.length - 1 && <div className="w-[1px] h-16 bg-slate-800 mt-2"></div>}
                      </div>

                      <div className="flex-1">
                        <div className="flex justify-between items-center bg-white/5 p-5 rounded-[1.8rem] border border-white/5 hover:border-white/10 transition-all">
                          <div className="min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                              <span className="font-black text-white text-xs uppercase">{log.userName}</span>
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${isStopAction ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'
                                }`}>
                                {isStopAction ? 'TERMINATED' : 'DEPLOYED'}
                              </span>
                            </div>

                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                              {log.taskTitle}
                            </p>

                            <div className="flex items-center gap-4 mt-3">
                              <p className="text-[9px] font-black text-slate-600 uppercase tracking-tighter">
                                PRJ: {log.projectCode || 'INTERNAL'}
                              </p>

                              {/* SHOW DURATION ONLY ON TERMINATE/STOP */}
                              {isStopAction && log.duration && (
                                <div className="flex items-center gap-1.5 text-blue-400">
                                  <BiTimeFive size={12} />
                                  <span className="text-[10px] font-black uppercase tracking-tighter">
                                    Worked: {log.duration} Mins
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="text-right ml-4">
                            <div className="px-3 py-1 bg-slate-800 rounded-lg text-[10px] font-black text-slate-400 tabular-nums">
                              {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <p className="text-[8px] text-slate-600 font-black mt-2 uppercase italic">
                              {new Date(log.createdAt).toLocaleDateString('en-GB')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex items-center justify-center text-slate-700 text-[10px] font-black uppercase tracking-[0.4em]">
                  Awaiting Deployment...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
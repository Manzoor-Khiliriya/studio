import React from 'react';
import {
  useGetDashboardSummaryQuery,
  useClearLogsMutation,
  useStopAllSessionsMutation
} from '../../services/dashboardApi';
import { HiOutlineArrowTrendingUp, HiOutlineBolt, HiOutlineUserGroup, HiOutlineFingerPrint, HiOutlineCalendarDays } from 'react-icons/hi2';
import { BiTask, BiTimeFive, BiTrash } from 'react-icons/bi';
import { FiStopCircle, FiAlertTriangle } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import Loader from '../../components/Loader';
import StatCard from '../../components/StatCard';
import { HiOutlineClipboardList } from 'react-icons/hi';
import PageHeader from '../../components/PageHeader';

const AdminDashboard = () => {
  const { data, isLoading } = useGetDashboardSummaryQuery(undefined, {
    pollingInterval: 10000,
    refetchOnFocus: true
  });

  const [stopAllSessions, { isLoading: isStoppingAll }] = useStopAllSessionsMutation();
  const [clearLogs, { isLoading: isClearing }] = useClearLogsMutation();

  if (isLoading) return <Loader message="Decrypting Operational Data..." />;

  const stats = data?.stats || {};
  const liveTracking = data?.liveTracking || [];
  const recentActivity = data?.recentActivity || [];

  const groupedLogs = recentActivity.reduce((groups, log) => {
    const date = log.dateString;
    if (!groups[date]) groups[date] = [];
    groups[date].push(log);
    return groups;
  }, {});

  const handleStopAll = async () => {
    if (!window.confirm("CRITICAL: Terminate ALL active sessions globally?")) return;
    try {
      await stopAllSessions().unwrap();
      toast.success("All sessions terminated");
    } catch (err) {
      toast.error("Global shutdown failed");
    }
  };

  const handleClearDay = async (date) => {
    if (!window.confirm(`Clear all logs for ${date}?`)) return;
    try {
      await clearLogs({ date }).unwrap();
      toast.success(`Logs for ${date} cleared`);
    } catch (err) {
      toast.error(`Failed to clear logs for ${date}`);
    }
  };

  const getFriendlyDate = (dateStr) => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (dateStr === today) return "Today's Operations";
    if (dateStr === yesterday) return "Yesterday";

    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <PageHeader
        title="Admin Dashboard"
        iconText="A"
        subtitle="Manage operational objectives and real-time resource utilization."
      />

      <div className="mx-auto px-8 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-12 mt-10">
          <StatCard label="Total Projects" value={stats.totalProjects || 0} icon={<HiOutlineClipboardList size={22} />} delay={0.1} />
          <StatCard label="Total Employees" value={stats.totalActiveEmployees || 0} icon={<HiOutlineUserGroup size={22} />} delay={0.2} />
          <StatCard label="On Duty" value={stats.attendanceLive || 0} variant={stats.attendanceLive > 0 ? "active" : "default"} icon={<HiOutlineFingerPrint size={22} />} delay={0.3} />
          <StatCard label="Task In Progress" value={stats.tasksInProgress || 0} icon={<HiOutlineArrowTrendingUp size={22} />} delay={0.4} />
          <StatCard label="Leave Requests" value={stats.pendingApprovals || 0} variant={stats.pendingApprovals > 0 ? "warning" : "default"} icon={<BiTask size={22} />} delay={0.5} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* --- LIVE TRACKING --- */}
          <div className="lg:col-span-5 bg-white rounded-[3rem] border border-slate-200 p-8 shadow-xl flex flex-col h-[700px]">
            <div className="flex justify-between items-center mb-10 shrink-0">
              <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute h-3 w-3 rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative h-3 w-3 rounded-full bg-blue-500"></span>
                </span>
                Active Timers
              </h3>
              {liveTracking.length > 0 && (
                <button onClick={handleStopAll} disabled={isStoppingAll} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white rounded-full text-[10px] font-black uppercase tracking-tighter transition-all border border-red-100 cursor-pointer">
                  <FiAlertTriangle size={12} /> {isStoppingAll ? 'Shutting Down...' : 'Stop All'}
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
              <AnimatePresence mode='popLayout'>
                {liveTracking.length > 0 ? (
                  liveTracking.map((timer) => (
                    <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, x: 20 }} key={timer.id} className="flex items-center gap-4 p-4 bg-slate-100 rounded-[1.8rem] border border-transparent hover:border-gray-200 hover:bg-gray-200 transition-all group">
                      <div className="relative shrink-0">
                        <img src={`https://ui-avatars.com/api/?name=${timer.employee}&background=2563eb&color=fff`} className="h-10 w-10 rounded-2xl object-cover" alt="user" />
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-black text-slate-900 uppercase truncate">{timer.employee} {timer.employeeCode && `(${timer.employeeCode})`}</p>
                        <p className="text-[9px] text-slate-600 font-bold uppercase truncate">{timer.task} ({timer.projectCode})</p>
                      </div>
                      <HiOutlineBolt className="text-blue-500 animate-pulse shrink-0" size={18} />
                    </motion.div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center italic text-slate-300 gap-2"><p className="text-[10px] uppercase tracking-[0.3em] font-black text-center px-10">No personnel logged into tasks</p></div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* --- ACTIVITY LOG (DATE GROUPED) --- */}
          <div className="lg:col-span-7 bg-slate-900 rounded-[3rem] p-8 shadow-2xl border border-slate-800 flex flex-col h-[700px]">
            <div className="flex justify-between items-center mb-10 shrink-0 px-2">
              <h3 className="font-black text-white text-sm uppercase tracking-widest">Log History</h3>
            </div>

            <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar space-y-12">
              {Object.keys(groupedLogs).length > 0 ? (
                Object.keys(groupedLogs)
                  .sort((a, b) => b.localeCompare(a)) // Sort newest date first
                  .map((date) => (
                    <div key={date} className="space-y-3">
                      {/* Date Heading Group */}
                      <div className="flex justify-between items-center sticky top-0 z-10 bg-slate-900/80 backdrop-blur-sm py-1">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-500/10 p-2 rounded-xl">
                            <HiOutlineCalendarDays className="text-blue-400" size={16} />
                          </div>
                          <span className="text-white font-black text-xs uppercase tracking-[0.2em]">
                            {getFriendlyDate(date)}
                          </span>
                        </div>

                        <button
                          onClick={() => handleClearDay(date)}
                          disabled={isClearing}
                          className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-600 text-red-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-red-500/20 cursor-pointer"
                        >
                          <BiTrash size={16} />
                          <span>Clear Logs</span>
                        </button>
                      </div>

                      {/* Entries for this specific date */}
                      <div className="space-y-4 pl-4 border-l border-slate-800 ml-4">
                        {groupedLogs[date].map((log) => (
                          <div key={log.id} className="flex gap-6 items-start group">
                            <div className="flex-1">
                              <div className="flex justify-between items-center bg-white/5 p-5 rounded-[1.8rem] border border-white/5 hover:border-white/10 transition-all">
                                <span className="font-black text-white text-xs uppercase tracking-tight">
                                  {log.userName} {`(${log.employeeCode || ''})`}
                                </span>
                                <div className="flex items-center gap-2">
                                  <BiTimeFive className="text-emerald-400" size={14} />
                                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-tighter tabular-nums">
                                    Total : {log.totalDailyTime}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
              ) : (
                <div className="h-full flex items-center justify-center text-slate-700 text-[10px] font-black uppercase tracking-[0.4em]">
                  Awaiting Daily Summaries
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
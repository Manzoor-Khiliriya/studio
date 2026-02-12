import React, { useState, useMemo } from 'react';
import { 
  useGetDashboardSummaryQuery, 
  useClearLogsMutation,
  useStopAllSessionsMutation // Ensure this is added to your dashboardApi.js
} from '../../services/dashboardApi';
import { HiOutlineArrowTrendingUp, HiOutlineBolt, HiOutlineTrash, HiOutlineStopCircle } from 'react-icons/hi2';
import { BiTask, BiTimeFive } from 'react-icons/bi';
import { motion } from 'framer-motion';
import Loader from '../../components/Loader';
import StatCard from '../../components/StatCard';
import TaskModal from '../../components/TaskModal';
import { HiOutlineClipboardList } from 'react-icons/hi';
import PageHeader from '../../components/PageHeader';
import { toast } from 'react-hot-toast';

const AdminDashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 1. Hook for fetching data
  const { data, isLoading, isFetching } = useGetDashboardSummaryQuery(undefined, {
    pollingInterval: 30000,
    refetchOnFocus: true
  });

  // 2. Hooks for Actions
  const [clearLogs, { isLoading: isDeletingLogs }] = useClearLogsMutation();
  const [stopAllSessions, { isLoading: isStoppingSessions }] = useStopAllSessionsMutation();

  // 3. Handler: Clear Operational History (Permanent DB Delete)
  const handleClearHistory = async () => {
    if (window.confirm("CRITICAL: Delete all historical activity logs from the database permanently?")) {
      try {
        await clearLogs().unwrap();
        toast.success("Operational history cleared");
      } catch (err) {
        toast.error("Failed to clear logs");
      }
    }
  };

  // 4. Handler: Stop All Live Sessions (Forces isRunning to false)
  const handleStopAllLive = async () => {
    if (window.confirm("ACTION REQUIRED: This will forcibly stop all active employee timers. Proceed?")) {
      try {
        await stopAllSessions().unwrap();
        toast.success("All live sessions terminated");
      } catch (err) {
        toast.error("Failed to stop sessions");
      }
    }
  };

  // 5. Grouping Logic
  const groupedLogs = useMemo(() => {
    const activity = data?.recentActivity || [];
    const groups = {};
    activity.forEach((log) => {
      const date = new Date(log.createdAt).toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(log);
    });
    return groups;
  }, [data?.recentActivity]);

  if (isLoading) return <Loader message="Decrypting Operational Data..." />;

  const stats = data?.stats || {};
  const liveTracking = data?.liveTracking || [];

  return (
    <div className="min-h-screen">
      <div className="max-w-[1700px] mx-auto px-8 pt-10 pb-10">
        <PageHeader
          title="Admin Dashboard"
          iconText="D"
          subtitle="Manage operational objectives and real-time resource utilization."
          actionLabel="Assign Task"
          onAction={() => setIsModalOpen(true)}
        />

        {/* --- STATS MATRIX --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 mt-10">
          <StatCard label="Total Projects" value={stats.totalProjects || 0} icon={<HiOutlineClipboardList size={24} />} delay={0.1} />
          <StatCard label="Live Sessions" value={stats.currentlyWorking || 0} icon={<HiOutlineBolt size={24} className="text-orange-500" />} variant={stats.currentlyWorking > 0 ? "active" : "default"} delay={0.2} />
          <StatCard label="Pending Action" value={stats.pendingApprovals || 0} icon={<BiTask size={24} />} variant={stats.pendingApprovals > 0 ? "warning" : "default"} delay={0.3} />
          <StatCard label="In Progress" value={stats.statusBreakdown?.['In Progress'] || 0} icon={<HiOutlineArrowTrendingUp size={24} className="text-orange-500" />} delay={0.4} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* --- LIVE TRACKING COLUMN --- */}
          <div className="lg:col-span-4 bg-white rounded-[3rem] border border-slate-200 p-8 shadow-xl flex flex-col h-[650px]">
              <div className="flex justify-between items-center mb-10 shrink-0">
                <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest flex items-center gap-3">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute h-3 w-3 rounded-full bg-orange-400 opacity-75"></span>
                    <span className="relative h-3 w-3 rounded-full bg-orange-500"></span>
                  </span>
                  Live Ops
                </h3>
                
                {/* STOP ALL SESSIONS BUTTON */}
                <button 
                  onClick={handleStopAllLive}
                  disabled={isStoppingSessions || liveTracking.length === 0}
                  className="p-2 text-slate-400 hover:text-red-500 transition-all disabled:opacity-20"
                  title="Force Stop All Sessions"
                >
                  <HiOutlineStopCircle size={22} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                {liveTracking.length > 0 ? liveTracking.map(timer => (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    key={timer.id} 
                    className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-orange-100 transition-all"
                  >
                    <img src={`https://ui-avatars.com/api/?name=${timer.employee}&background=0f172a&color=fff`} className="h-10 w-10 rounded-xl" alt="" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-slate-900 uppercase truncate">{timer.employee}</p>
                      <p className="text-[10px] text-slate-400 font-bold truncate">{timer.task}</p>
                    </div>
                    <BiTimeFive className="text-orange-500 animate-pulse" size={18} />
                  </motion.div>
                )) : (
                  <div className="text-center py-20 text-slate-400 text-[10px] font-black uppercase italic">No active sessions</div>
                )}
              </div>
          </div>

          {/* --- OPERATIONAL LOG COLUMN --- */}
          <div className="lg:col-span-8 bg-slate-900 rounded-[3rem] p-8 shadow-2xl border border-slate-800 flex flex-col h-[650px]">
            <div className="flex justify-between items-center mb-8 shrink-0">
              <h3 className="font-black text-white text-sm uppercase tracking-widest">Operational Log</h3>
              
              {/* CLEAR HISTORY BUTTON */}
              <button 
                onClick={handleClearHistory}
                disabled={isDeletingLogs}
                className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 hover:text-red-400 transition-all px-4 py-2 bg-white/5 rounded-xl border border-white/5 disabled:opacity-50"
              >
                <HiOutlineTrash size={14} /> 
                {isDeletingLogs ? "Clearing..." : "Clear History"}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
              {Object.keys(groupedLogs).length > 0 ? (
                Object.entries(groupedLogs).map(([date, logs]) => (
                  <div key={date} className="mb-8">
                    <div className="sticky top-0 z-10 bg-slate-900/90 backdrop-blur-md py-2 mb-4">
                      <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest border-b border-orange-500/30 pb-1">
                        {date}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {logs.map((log) => (
                        <div key={log.id} className="flex gap-4 items-center bg-white/5 p-4 rounded-2xl hover:bg-white/10 transition-all border border-white/5">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-300">
                              <span className="font-black text-white uppercase">{log.userName}</span>
                              <span className="mx-2 opacity-40 text-[9px] uppercase font-black">logged</span>
                              <span className="text-orange-500 font-bold uppercase">{log.taskTitle}</span>
                            </p>
                          </div>
                          <div className="text-[10px] font-black text-slate-500 tabular-nums">
                            {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 text-[10px] font-black uppercase tracking-widest italic space-y-4">
                  <HiOutlineClipboardList size={24} className="opacity-20" />
                  <span>No operational records found</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <TaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default AdminDashboard;
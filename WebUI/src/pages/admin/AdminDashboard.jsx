import React, { useState } from 'react';
import { useGetDashboardSummaryQuery } from '../../services/dashboardApi';
import { HiOutlineArrowTrendingUp, HiOutlineBolt } from 'react-icons/hi2';
import { BiTask, BiTimeFive } from 'react-icons/bi';
import { motion } from 'framer-motion';

import Loader from '../../components/Loader';
import StatCard from '../../components/StatCard';
import TaskModal from '../../components/TaskModal';
import { HiOutlineClipboardList } from 'react-icons/hi';
import PageHeader from '../../components/PageHeader';

const AdminDashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, isLoading, isFetching } = useGetDashboardSummaryQuery(undefined, {
    pollingInterval: 30000,
    refetchOnFocus: true
  });

  if (isLoading) return <Loader message="Decrypting Operational Data..." />;

  const stats = data?.stats || {};
  const liveTracking = data?.liveTracking || [];
  const recentActivity = data?.recentActivity || [];

  return (
    <div className="min-h-screen">
      {/* --- TACTICAL HEADER --- */}
      <div className="max-w-[1700px] mx-auto px-8 pt-10 pb-10">
        <PageHeader
          title="Admin Dashboard"
          iconText="D"
          subtitle="Manage operational objectives and real-time resource utilization."
          actionLabel="Assign Task"
          // Fixed: matched the function name to your actual state setter
          onAction={() => setIsModalOpen(true)}
        />

        {/* --- STATS MATRIX --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 mt-10">
          <StatCard
            label="Total Projects"
            value={stats.totalProjects || 0}
            icon={<HiOutlineClipboardList size={24} className="text-slate-900" />}
            delay={0.1}
          />
          <StatCard
            label="Live Sessions"
            value={stats.currentlyWorking || 0}
            icon={<HiOutlineBolt size={24} className="text-orange-500" />}
            variant={stats.currentlyWorking > 0 ? "active" : "default"}
            delay={0.2}
          />
          <StatCard
            label="Pending Action"
            value={stats.pendingApprovals || 0}
            icon={<BiTask size={24} className="text-slate-900" />}
            variant={stats.pendingApprovals > 0 ? "warning" : "default"}
            delay={0.3}
          />
          <StatCard
            label="In Progress"
            value={stats.statusBreakdown?.['In Progress'] || 0}
            icon={<HiOutlineArrowTrendingUp size={24} className="text-orange-500" />}
            delay={0.4}
          />
        </div>

        {/* --- LIVE INTEL & ACTIVITY --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* LIVE TRACKING COLUMN */}
          <div className="lg:col-span-4 bg-white rounded-[3rem] border border-slate-200 p-8 shadow-xl shadow-slate-200/40">
            <div className="flex justify-between items-center mb-10">
              <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute h-3 w-3 rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative h-3 w-3 rounded-full bg-orange-500"></span>
                </span>
                Live Ops
              </h3>
              {isFetching && (
                <span className="text-[9px] font-black text-orange-500 animate-pulse uppercase tracking-[0.2em]">Syncing...</span>
              )}
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {liveTracking.length > 0 ? (
                liveTracking.map((timer) => (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={timer.id}
                    className="flex items-center gap-4 p-5 bg-slate-50 rounded-[1.8rem] border border-transparent hover:border-orange-200 hover:bg-white transition-all group"
                  >
                    <div className="relative">
                      <img
                        src={timer.photo || `https://ui-avatars.com/api/?name=${timer.employee}&background=0f172a&color=fff`}
                        className="h-12 w-12 rounded-2xl object-cover shadow-md"
                        alt="operator"
                      />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-slate-900 uppercase tracking-tight truncate">{timer.employee}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 truncate">
                        {timer.projectCode} • <span className="text-orange-600">{timer.task}</span>
                      </p>
                    </div>
                    <BiTimeFive className="text-orange-500 animate-pulse shrink-0" size={20} />
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-20 bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200">
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest italic">Zero active sessions</p>
                </div>
              )}
            </div>
          </div>

          {/* ACTIVITY LOG COLUMN */}
          <div className="lg:col-span-8 bg-slate-900 rounded-[3rem] p-8 shadow-2xl border border-slate-800">
            <h3 className="font-black text-white text-sm uppercase tracking-widest mb-10 px-2">Operational Log</h3>

            <div className="space-y-2">
              {recentActivity.length > 0 ? (
                recentActivity.map((log, index) => (
                  <div key={log.id} className="flex gap-6 items-start group">
                    <div className="flex flex-col items-center mt-2">
                      <div className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-orange-500 shadow-[0_0_10px_#f97316]' : 'bg-slate-700'}`}></div>
                      {index !== recentActivity.length - 1 && <div className="w-[1px] h-16 bg-slate-800 mt-2"></div>}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex justify-between items-center bg-white/5 group-hover:bg-white/10 p-5 rounded-2xl transition-all border border-white/5 group-hover:border-white/10">
                        <div className="min-w-0">
                          <p className="text-sm text-slate-400">
                            <span className="font-black text-white uppercase text-xs tracking-tight">{log.userName}</span>
                            <span className="mx-2 opacity-40 text-[10px] font-black uppercase">completed</span>
                            <span className="text-orange-500 font-black uppercase text-xs tracking-tight">{log.taskTitle}</span>
                          </p>
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1 truncate">{log.projectTitle}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[10px] font-black text-slate-400 bg-white/5 px-4 py-2 rounded-xl border border-white/5 tabular-nums">
                            {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 text-slate-600 text-[10px] font-black uppercase tracking-widest">
                  Scanning for system activity...
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
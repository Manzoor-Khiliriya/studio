import React, { useState } from 'react';
import { useGetDashboardSummaryQuery } from '../services/dashboardApi';
import { HiOutlineClock, HiOutlinePlus, HiOutlineArrowTrendingUp } from 'react-icons/hi2';
import { BiTask, BiTimeFive } from 'react-icons/bi';
import { motion } from 'framer-motion';

import Loader from '../components/Loader';
import StatCard from '../components/StatCard';
import TaskModal from '../components/TaskModal';
import { HiOutlineClipboardList } from 'react-icons/hi';

const AdminDashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { data, isLoading, isFetching } = useGetDashboardSummaryQuery(undefined, { 
    pollingInterval: 30000,
    refetchOnFocus: true 
  });

  if (isLoading) return <Loader message="Loading dashboard insights..." />;

  const stats = data?.stats || {};
  const liveTracking = data?.liveTracking || [];
  const recentActivity = data?.recentActivity || [];

  return (
    <div className="max-w-[1600px] mx-auto min-h-screen px-4 py-8 md:px-8">
      {/* --- HEADER SECTION --- */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-1 w-8 bg-orange-500 rounded-full"></div>
            <p className="text-orange-600 font-bold uppercase tracking-widest text-[11px]">Operational Insights</p>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">
            Dashboard <span className="text-slate-400 font-light">Overview</span>
          </h1>
        </div>

        <motion.button 
          whileHover={{ y: -2 }} 
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsModalOpen(true)}
          className="bg-orange-500 text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-all flex items-center gap-2 group cursor-pointer"
        >
          <HiOutlinePlus size={20} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-300" />
          Create New Task
        </motion.button>
      </header>

      {/* --- STATS GRID --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <StatCard 
          label="Total Projects" 
          value={stats.totalProjects || 0} 
          icon={<HiOutlineClipboardList size={24} className="text-slate-600"/>} 
          delay={0.1} 
        />
        <StatCard 
          label="Active Sessions" 
          value={stats.currentlyWorking || 0} 
          icon={<HiOutlineClock size={24} className="text-orange-500"/>} 
          variant={stats.currentlyWorking > 0 ? "active" : "default"} 
          delay={0.2} 
        />
        <StatCard 
          label="Pending Approvals" 
          value={stats.pendingApprovals || 0} 
          icon={<BiTask size={24} className="text-slate-600"/>} 
          variant={stats.pendingApprovals > 0 ? "warning" : "default"} 
          delay={0.3} 
        />
        <StatCard 
          label="Tasks In Progress" 
          value={stats.statusBreakdown?.['In Progress'] || 0} 
          icon={<HiOutlineArrowTrendingUp size={24} className="text-orange-500"/>} 
          delay={0.4} 
        />
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
        
        {/* LIVE TRACKING COLUMN */}
        <div className="lg:col-span-1 bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
               <span className="relative flex h-2 w-2">
                 <span className="animate-ping absolute h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                 <span className="relative h-2 w-2 rounded-full bg-orange-500"></span>
               </span>
               Live Activity
            </h3>
            {isFetching && <span className="text-[10px] font-bold text-orange-500 animate-pulse uppercase tracking-tighter">Updating...</span>}
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {liveTracking.length > 0 ? (
              liveTracking.map((timer) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={timer.id} 
                  className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-orange-200 transition-colors group"
                >
                  <img 
                    src={timer.photo || `https://ui-avatars.com/api/?name=${timer.employee}&background=fef2f2&color=f97316`} 
                    className="h-10 w-10 rounded-xl object-cover" 
                    alt="employee" 
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{timer.employee}</p>
                    <p className="text-[11px] text-slate-500 font-medium truncate">
                      {timer.projectCode} • <span className="text-orange-600 font-semibold">{timer.task}</span>
                    </p>
                  </div>
                  <BiTimeFive className="text-orange-500 animate-spin-slow" size={18} />
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-400 text-sm italic">No active work sessions</p>
              </div>
            )}
          </div>
        </div>

        {/* ACTIVITY LOG COLUMN */}
        <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm">
          <h3 className="font-bold text-slate-900 text-lg mb-6 px-2">Recent Activity</h3>
          
          <div className="space-y-1">
            {recentActivity.length > 0 ? (
              recentActivity.map((log, index) => (
                <div key={log.id} className="flex gap-4 items-start group">
                  <div className="flex flex-col items-center mt-1.5">
                    <div className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-orange-500 ring-4 ring-orange-50' : 'bg-slate-200'}`}></div>
                    {index !== recentActivity.length - 1 && <div className="w-[1px] h-14 bg-slate-100 mt-1"></div>}
                  </div>
                  <div className="flex-1 pb-6">
                    <div className="flex justify-between items-center bg-white group-hover:bg-slate-50 p-3 rounded-xl transition-colors">
                      <div>
                        <p className="text-sm text-slate-600">
                          <span className="font-bold text-slate-900">{log.userName}</span> 
                          <span className="mx-1.5 opacity-60">completed</span> 
                          <span className="text-orange-600 font-semibold">{log.taskTitle}</span>
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">{log.projectTitle}</p>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-lg">
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-slate-400 text-sm">
                Waiting for system activity...
              </div>
            )}
          </div>
        </div>
      </div>

      <TaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default AdminDashboard;
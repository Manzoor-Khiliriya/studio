import React, { useState } from 'react';
import { useGetDashboardSummaryQuery } from '../services/dashboardApi';
import { HiOutlineClock, HiOutlinePlus, HiOutlineArrowTrendingUp,  } from 'react-icons/hi2';
import { BiTask, BiTimeFive } from 'react-icons/bi';
import { motion, AnimatePresence } from 'framer-motion';

import Loader from '../components/Loader';
import StatCard from '../components/StatCard';
import TaskModal from '../components/TaskModal';
import { HiOutlineClipboardList } from 'react-icons/hi';

const AdminDashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Polling every 30s to keep the "Command Hub" live
  const { data, isLoading, isFetching } = useGetDashboardSummaryQuery(undefined, { 
    pollingInterval: 30000,
    refetchOnFocus: true 
  });

  if (isLoading) return <Loader message="Accessing Command Hub..." />;

  // Destructure for cleaner access
  const stats = data?.stats || {};
  const liveTracking = data?.liveTracking || [];
  const recentActivity = data?.recentActivity || [];

  return (
    <div className="max-w-[1600px] mx-auto min-h-screen">
      {/* HEADER SECTION */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="h-1 w-12 bg-orange-600 rounded-full"></span>
            <p className="text-orange-500 font-black uppercase tracking-[0.3em] text-[10px]">Fleet Intelligence</p>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter uppercase leading-none">
            Command <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-500">Hub</span>
          </h1>
        </div>

        <motion.button 
          whileHover={{ scale: 1.05, boxShadow: "0 20px 25px -5px rgb(249 115 22 / 0.2)" }} 
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsModalOpen(true)}
          className="bg-slate-900 text-white px-8 py-5 rounded-[2rem] font-black text-lg shadow-2xl hover:bg-orange-600 transition-all flex items-center gap-3 group"
        >
          <div className="bg-white/20 p-2 rounded-xl group-hover:rotate-90 transition-transform duration-500">
            <HiOutlinePlus size={20} strokeWidth={3} />
          </div>
          Assign Mission
        </motion.button>
      </header>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <StatCard 
          label="Total Projects" 
          value={stats.totalProjects || 0} 
          icon={<HiOutlineClipboardList size={24}/>} 
          delay={0.1} 
        />
        <StatCard 
          label="Live Assets" 
          value={stats.currentlyWorking || 0} 
          icon={<HiOutlineClock size={24}/>} 
          variant={stats.currentlyWorking > 0 ? "active" : "default"} 
          delay={0.2} 
        />
        <StatCard 
          label="Pending Leaves" 
          value={stats.pendingApprovals || 0} 
          icon={<BiTask size={24}/>} 
          variant={stats.pendingApprovals > 0 ? "warning" : "default"} 
          delay={0.3} 
        />
        <StatCard 
          label="Active Load" 
          value={`${stats.statusBreakdown?.['In Progress'] || 0} Tasks`} 
          icon={<HiOutlineArrowTrendingUp size={24}/>} 
          delay={0.4} 
        />
      </div>

      {/* MAIN CONTENT SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
        
        {/* LIVE FEED - LEFT COLUMN */}
        <div className="lg:col-span-1 bg-white rounded-[3rem] border border-orange-100 p-8 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-black text-slate-900 uppercase tracking-tighter text-xl flex items-center gap-3">
               <span className="relative flex h-3 w-3">
                 <span className="animate-ping absolute h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                 <span className="relative h-3 w-3 rounded-full bg-orange-500"></span>
               </span>
               Live Feed
            </h3>
            {isFetching && <span className="text-[10px] font-bold text-orange-500 animate-pulse uppercase">Syncing...</span>}
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {liveTracking.length > 0 ? (
              liveTracking.map((timer) => (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={timer.id} 
                  className="flex items-center gap-4 p-4 bg-slate-50/50 hover:bg-orange-50 rounded-[2rem] transition-all border border-transparent hover:border-orange-100"
                >
                  <img 
                    src={timer.photo || `https://ui-avatars.com/api/?name=${timer.employee}&background=f97316&color=fff`} 
                    className="h-12 w-12 rounded-2xl object-cover shadow-md" 
                    alt="user" 
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-slate-800 uppercase truncate">{timer.employee}</p>
                    <p className="text-[10px] text-orange-600 font-black uppercase tracking-widest truncate">
                      #{timer.projectCode} • {timer.task}
                    </p>
                  </div>
                  <BiTimeFive className="text-orange-500 animate-spin-slow" size={18} />
                </motion.div>
              ))
            ) : (
              <div className="text-center py-20">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No Active Sessions</p>
              </div>
            )}
          </div>
        </div>

        {/* TRANSMISSION LOG - RIGHT COLUMN */}
        <div className="lg:col-span-2 bg-white rounded-[3rem] border border-orange-100 p-8 shadow-sm">
          <h3 className="font-black text-slate-900 uppercase tracking-tighter text-xl mb-8">Transmission Log</h3>
          
          <div className="space-y-2">
            {recentActivity.length > 0 ? (
              recentActivity.map((log, index) => (
                <div key={log.id} className="flex gap-6 items-start group">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full border-2 border-white shadow-sm ${index === 0 ? 'bg-orange-500 scale-125' : 'bg-slate-300'}`}></div>
                    {index !== recentActivity.length - 1 && <div className="w-0.5 h-16 bg-slate-100"></div>}
                  </div>
                  <div className="flex-1 pb-8">
                    <div className="flex justify-between items-start bg-slate-50/30 group-hover:bg-orange-50/50 p-4 rounded-3xl transition-colors">
                      <div className="space-y-1">
                        <p className="text-sm text-slate-700">
                          <span className="font-black uppercase text-slate-900">{log.userName}</span> 
                          <span className="mx-2 text-slate-400 font-medium">completed</span> 
                          <span className="text-orange-600 font-black uppercase tracking-tight">{log.taskTitle}</span>
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">{log.projectTitle}</p>
                      </div>
                      <span className="text-[10px] font-black text-slate-400 bg-white border border-slate-100 px-3 py-1 rounded-full shadow-sm">
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 text-slate-400 font-bold uppercase text-xs tracking-widest">
                System Idle • Waiting for Activity
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
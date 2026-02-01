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
  const { data, isLoading } = useGetDashboardSummaryQuery(undefined, { pollingInterval: 30000 });

  if (isLoading) return <Loader message="Accessing Command Hub..." />;

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-10 min-h-screen">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div>
          <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none">Command Hub</h1>
          <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] mt-2">Fleet Intelligence</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => setIsModalOpen(true)}
          className="bg-slate-900 text-white px-10 py-5 rounded-[2rem] font-black text-lg shadow-2xl hover:bg-orange-600 transition-all flex items-center gap-3"
        >
          <HiOutlinePlus size={22} strokeWidth={3} /> Assign Mission
        </motion.button>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard label="Total Projects" value={data?.stats?.totalProjects || 0} icon={<HiOutlineClipboardList size={24}/>} delay={0.1} />
        <StatCard label="Live Assets" value={data?.stats?.currentlyWorking || 0} icon={<HiOutlineClock size={24}/>} variant={data?.stats?.currentlyWorking > 0 ? "active" : "default"} delay={0.2} />
        <StatCard label="Pending Leaves" value={data?.stats?.pendingApprovals || 0} icon={<BiTask size={24}/>} variant={data?.stats?.pendingApprovals > 0 ? "warning" : "default"} delay={0.3} />
        <StatCard label="Active Load" value={`${data?.stats?.statusBreakdown?.['In Progress'] || 0} Tasks`} icon={<HiOutlineArrowTrendingUp size={24}/>} delay={0.4} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-white rounded-[3rem] border-2 border-slate-50 p-8 shadow-sm">
          <h3 className="font-black text-slate-900 uppercase tracking-tighter text-xl mb-8 flex items-center gap-3">
             <span className="relative flex h-3 w-3"><span className="animate-ping absolute h-full w-full rounded-full bg-orange-400 opacity-75"></span><span className="relative h-3 w-3 rounded-full bg-orange-500"></span></span>
             Live Feed
          </h3>
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {data?.liveTracking?.map((timer) => (
              <div key={timer.id} className="flex items-center gap-4 p-5 bg-slate-50/50 hover:bg-orange-50 rounded-[2rem] transition-all">
                <img src={timer.photo || `https://ui-avatars.com/api/?name=${timer.employee}&background=f97316&color=fff`} className="h-12 w-12 rounded-2xl object-cover" alt="user" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-slate-800 uppercase truncate">{timer.employee}</p>
                  <p className="text-[10px] text-orange-600 font-black uppercase tracking-widest truncate">#{timer.projectCode} • {timer.task}</p>
                </div>
                <BiTimeFive className="text-orange-500 animate-pulse" size={18} />
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-[3rem] border-2 border-slate-50 p-8 shadow-sm">
          <h3 className="font-black text-slate-900 uppercase tracking-tighter text-xl mb-8">Transmission Log</h3>
          <div className="space-y-6">
            {data?.recentActivity?.map((log) => (
              <div key={log.id} className="flex gap-6 items-start group">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <div className="w-0.5 h-12 bg-slate-100"></div>
                </div>
                <div className="flex-1 pb-6">
                  <div className="flex justify-between">
                    <p className="text-sm text-slate-800"><span className="font-black uppercase">{log.userName}</span> completed <span className="text-orange-600 font-black uppercase">{log.taskTitle}</span></p>
                    <span className="text-[9px] font-black text-slate-400 bg-slate-50 px-2 py-1 rounded">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <TaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default AdminDashboard;
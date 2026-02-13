import React from 'react';
import { useGetTaskPerformanceReportQuery } from '../../services/timeLogApi';
import Loader from '../../components/Loader';
import PageHeader from '../../components/PageHeader';
import { motion } from 'framer-motion';

const AdminTaskReportPage = () => {
  const { data: report, isLoading } = useGetTaskPerformanceReportQuery();

  if (isLoading) return <Loader message="Analyzing Task Metrics..." />;

  // Filter out completed tasks if you only want active ones
  const activeTasks = report?.filter(task => task.status !== 'Completed') || [];

  return (
    <div className="min-h-screen p-8 max-w-[1400px] mx-auto">
      <PageHeader 
        title="Task Progression Analytics" 
        subtitle="Real-time monitoring of time consumption vs. allocated limits."
      />

      <div className="mt-12 space-y-8">
        {activeTasks.map((task) => {
          // Calculate percentage (Limit to 100 for the bar, but keep actual for text)
          const percentage = (task.totalWorkHours / task.allocatedTime) * 100;
          const isOverBudget = percentage > 100;

          return (
            <div key={task._id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
              {/* Task Info Header */}
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h3 className="font-black text-slate-900 uppercase tracking-tight text-lg">
                    {task.title}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                    Project: {task.projectNumber} • Status: <span className="text-orange-500">{task.status}</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className={`text-2xl font-black tabular-nums ${isOverBudget ? 'text-red-500' : 'text-slate-900'}`}>
                    {percentage.toFixed(1)}%
                  </span>
                  <p className="text-[9px] font-black text-slate-400 uppercase">Utilization</p>
                </div>
              </div>

              {/* Progress Track */}
              <div className="relative h-10 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200">
                
                {/* Breakpoint Markers (25%, 50%, 75%) */}
                {[25, 50, 75].map(marker => (
                  <div 
                    key={marker}
                    className="absolute top-0 bottom-0 w-[2px] bg-slate-300 z-10"
                    style={{ left: `${marker}%` }}
                  >
                    <span className="absolute -bottom-1 left-1 text-[7px] font-black text-slate-400 uppercase">
                      {marker}%
                    </span>
                  </div>
                ))}

                {/* Actual Progress Bar */}
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(percentage, 100)}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={`h-full rounded-r-xl ${
                    isOverBudget ? 'bg-red-500' : 'bg-gradient-to-r from-orange-400 to-orange-600'
                  }`}
                />
              </div>

              {/* Time Details Footer */}
              <div className="flex gap-6 mt-4">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Time Consumed</span>
                  <span className="text-sm font-bold text-slate-700">{task.totalWorkHours} hrs</span>
                </div>
                <div className="flex flex-col border-l border-slate-200 pl-6">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Allocated Budget</span>
                  <span className="text-sm font-bold text-slate-700">{task.allocatedTime} hrs</span>
                </div>
                {isOverBudget && (
                  <div className="flex flex-col border-l border-slate-200 pl-6">
                    <span className="text-[10px] font-black text-red-500 uppercase tracking-widest italic animate-pulse underline underline-offset-4">Over Budget</span>
                    <span className="text-sm font-bold text-red-600">{(task.totalWorkHours - task.allocatedTime).toFixed(2)} hrs extra</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminTaskReportPage;
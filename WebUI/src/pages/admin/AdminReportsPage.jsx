import React from 'react';
import { useGetTaskPerformanceReportQuery } from '../../services/timeLogApi';
import Loader from '../../components/Loader';
import PageHeader from '../../components/PageHeader';
import { motion } from 'framer-motion';

const AdminTaskReportPage = () => {
  const { data: report, isLoading } = useGetTaskPerformanceReportQuery();

  if (isLoading) return <Loader message="Analyzing Task Metrics..." />;

  // Filter out completed tasks to focus on active ones
  const activeTasks = report?.filter(task => task.status !== 'Completed') || [];

  return (
    <div className="min-h-screen">
      <PageHeader 
        title="Task Analytics" 
        subtitle="Real-time monitoring of time consumption vs. allocated limits."
      />

      <div className="mt-8 space-y-4">
        {activeTasks.map((task) => {
          const percentage = (task.totalWorkHours / task.allocatedTime) * 100;
          const isOverBudget = percentage > 100;

          return (
            <div key={task._id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              
              {/* Header: Title and Percentage */}
              <div className="flex justify-between items-end mb-3">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm uppercase tracking-tight leading-none">
                    {task.title}
                  </h3>
                  <p className="text-[10px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">
                    Project: {task.projectNumber} • <span className="text-orange-500">{task.status}</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className={`text-xl font-black tabular-nums ${isOverBudget ? 'text-red-500' : 'text-slate-900'}`}>
                    {percentage.toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Slim Progress Track with Breakpoints */}
              <div className="relative">
                <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  
                  {/* Breakpoint Markers (Background) */}
                  {[25, 50, 75].map(marker => (
                    <div 
                      key={marker}
                      className="absolute top-0 bottom-0 w-[1px] bg-slate-300 z-0"
                      style={{ left: `${marker}%` }}
                    />
                  ))}

                  {/* Actual Progress Bar */}
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(percentage, 100)}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full relative z-10 ${
                      isOverBudget ? 'bg-red-500' : 'bg-orange-500'
                    }`}
                  />
                </div>

                {/* Micro Breakpoint Labels */}
                <div className="flex justify-between px-0.5 mt-1">
                  {[0, 25, 50, 75, 100].map(m => (
                    <span key={m} className="text-[7px] font-bold text-slate-300 uppercase tracking-tighter">
                      {m}%
                    </span>
                  ))}
                </div>
              </div>

              {/* Footer: Detailed Metrics */}
              <div className="flex gap-4 mt-3 pt-3 border-t border-slate-50">
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Consumed</span>
                  <span className="text-xs font-bold text-slate-700">{task.totalWorkHours}h</span>
                </div>
                
                <div className="flex flex-col border-l border-slate-200 pl-4">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Budget</span>
                  <span className="text-xs font-bold text-slate-700">{task.allocatedTime}h</span>
                </div>

                {isOverBudget && (
                  <div className="flex flex-col border-l border-slate-200 pl-4">
                    <span className="text-[9px] font-bold text-red-500 uppercase tracking-tighter italic animate-pulse">
                      Exceeded
                    </span>
                    <span className="text-xs font-bold text-red-600">
                      +{(task.totalWorkHours - task.allocatedTime).toFixed(1)}h
                    </span>
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
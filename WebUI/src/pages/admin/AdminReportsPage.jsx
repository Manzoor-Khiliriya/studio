import React, { useState, useMemo } from 'react';
import { useGetTaskPerformanceReportQuery } from '../../services/timeLogApi';
import Loader from '../../components/Loader';
import PageHeader from '../../components/PageHeader';
import { motion, AnimatePresence } from 'framer-motion';
import { HiChevronDown, HiOutlineChartBarSquare, HiOutlineMagnifyingGlass } from 'react-icons/hi2';

const AdminTaskReportPage = () => {
  const { data: report, isLoading } = useGetTaskPerformanceReportQuery();
  const [expandedProject, setExpandedProject] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // --- ANALYTICS & GROUPING ---
  const projectGroups = useMemo(() => {
    if (!report) return [];

    // Filter report by search term (Title or Project Number)
    const filteredReport = report.filter(task =>
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.projectNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const grouped = filteredReport.reduce((acc, task) => {
      const pCode = task.projectNumber || "UNASSIGNED";
      if (!acc[pCode]) {
        acc[pCode] = {
          projectNumber: pCode,
          taskList: [],
          totalBudget: 0,
          totalConsumed: 0
        };
      }
      acc[pCode].taskList.push(task);
      acc[pCode].totalBudget += (task.allocatedTime || 0);
      acc[pCode].totalConsumed += (task.totalWorkHours || 0);
      return acc;
    }, {});

    return Object.values(grouped);
  }, [report, searchTerm]);

  if (isLoading) return <Loader message="Analyzing Active Mission Metrics..." />;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <PageHeader
        title="Live Performance"
        subtitle="Tracking time consumption for all active (non-completed) tasks."
      />

      <main className="px-8 -mt-10">

        {/* Search Bar */}
        <div className="bg-white border border-slate-200 p-4 rounded-[2rem] shadow-xl shadow-slate-200/50 mb-8">
          <div className="relative group">
            <HiOutlineMagnifyingGlass className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={20} />
            <input
              type="text"
              placeholder="Search by Task Name or Project ID..."
              className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-orange-500 outline-none font-bold text-sm transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Project Group List */}
        <div className="space-y-6">
          {projectGroups.length > 0 ? (
            projectGroups.map((group) => {
              const projectPerc = (group.totalConsumed / group.totalBudget) * 100 || 0;
              const isProjectOver = projectPerc > 100;
              const isExpanded = expandedProject === group.projectNumber;

              return (
                <div key={group.projectNumber} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">

                  {/* HEADER */}
                  <div
                    onClick={() => setExpandedProject(isExpanded ? null : group.projectNumber)}
                    className={`p-6 flex items-center justify-between cursor-pointer transition-all ${isExpanded ? 'bg-slate-900 text-white' : 'hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center gap-6">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isExpanded ? 'bg-orange-500' : 'bg-slate-100 text-slate-500'}`}>
                        <HiOutlineChartBarSquare size={26} />
                      </div>
                      <div>
                        <h3 className="font-black text-lg uppercase tracking-tight">{group.projectNumber}</h3>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          {group.taskList.length} Active Tasks
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-8">
                      <div className="hidden md:flex flex-col items-end min-w-[180px]">
                        <span className="text-[10px] font-black uppercase mb-1">Sector Usage: {projectPerc.toFixed(0)}%</span>
                        <div className="w-full h-2 bg-slate-200/20 rounded-full overflow-hidden border border-slate-700/10">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(projectPerc, 100)}%` }}
                            className={`h-full ${isProjectOver ? 'bg-red-500' : 'bg-emerald-500'}`}
                          />
                        </div>
                      </div>
                      <HiChevronDown className={`transition-transform duration-300 ${isExpanded ? 'rotate-180 text-orange-500' : 'text-slate-300'}`} size={28} />
                    </div>
                  </div>

                  {/* EXPANDED CONTENT */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-slate-50/50"
                      >
                        <div className="p-6 grid grid-cols-1 gap-4">
                          {group.taskList.map((task) => {
                            const taskPerc = (task.totalWorkHours / task.allocatedTime) * 100;
                            const isTaskOver = taskPerc > 100;

                            return (
                              <div key={task._id} className="bg-white px-5 py-3 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
                                <div className="flex flex-col md:flex-row md:items-center gap-4">

                                  {/* 1. Task Info (30% Width) */}
                                  <div className="md:w-1/3 min-w-0">
                                    <h4 className="font-bold text-slate-800 text-[13px] uppercase truncate tracking-tight">
                                      {task.title}
                                    </h4>
                                    <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest flex items-center gap-2">
                                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                                      {task.status}
                                    </p>
                                  </div>

                                  {/* 2. Progress Bar (40% Width) */}
                                  <div className="flex-1 flex items-center gap-3">
                                    <div className="relative flex-1 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-100">
                                      <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(taskPerc, 100)}%` }}
                                        className={`h-full relative z-10 ${isTaskOver ? 'bg-red-500' : 'bg-orange-500'}`}
                                      />
                                    </div>
                                    <span className={`text-[12px] font-black tabular-nums w-10 text-right ${isTaskOver ? 'text-red-500' : 'text-slate-900'}`}>
                                      {taskPerc.toFixed(0)}%
                                    </span>
                                  </div>

                                  {/* 3. Quick Stats (30% Width) */}
                                  <div className="md:w-1/4 flex items-center justify-end gap-4 border-l border-slate-100 pl-4">
                                    <div className="flex flex-col items-end">
                                      <span className="text-[8px] font-black text-slate-400 uppercase">Used</span>
                                      <span className="text-[11px] font-bold text-slate-700">{task.totalWorkHours}h</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                      <span className="text-[8px] font-black text-slate-400 uppercase">Limit</span>
                                      <span className="text-[11px] font-bold text-slate-700">{task.allocatedTime}h</span>
                                    </div>
                                    {isTaskOver && (
                                      <div className="flex flex-col items-end">
                                        <span className="text-[8px] font-black text-red-500 uppercase italic">Extra</span>
                                        <span className="text-[11px] font-black text-red-600">
                                          +{(task.totalWorkHours - task.allocatedTime).toFixed(1)}h
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-[3rem] p-24 text-center border-2 border-dashed border-slate-200">
              <p className="text-slate-300 font-black uppercase italic text-xl">No active tasks match your search.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

// Simple reusable metric component
const Metric = ({ label, value }) => (
  <div className="flex flex-col border-r border-slate-100 pr-6 last:border-0">
    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{label}</span>
    <span className="text-xs font-black text-slate-700">{value}</span>
  </div>
);

export default AdminTaskReportPage;
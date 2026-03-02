import React, { useState } from 'react';
import { useGetTaskPerformanceReportQuery } from '../../services/timeLogApi';
import Loader from '../../components/Loader';
import PageHeader from '../../components/PageHeader';
import Pagination from '../../components/Pagination';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiChevronDown, 
  HiOutlineChartBarSquare, 
  HiOutlineMagnifyingGlass, 
  HiOutlineXMark,
  HiOutlineExclamationTriangle 
} from 'react-icons/hi2';

// --- SUB-COMPONENT: REUSABLE PROGRESS BAR WITH BREAKPOINTS ---
const CustomProgressBar = ({ percentage, isOver }) => {
  const breakpoints = [25, 50, 75];

  return (
    <div className="relative w-full">
      <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50 shadow-inner">
        {/* Breakpoint Markers (Vertical Lines) */}
        {breakpoints.map((pt) => (
          <div 
            key={pt} 
            className="absolute top-0 bottom-0 border-r border-slate-300/40 z-20" 
            style={{ left: `${pt}%` }} 
          />
        ))}

        {/* Progress Fill */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(percentage, 100)}%` }}
          className={`h-full relative z-10 transition-colors duration-700 ${
            isOver 
              ? 'bg-gradient-to-r from-rose-500 to-rose-600' 
              : percentage > 75 
                ? 'bg-gradient-to-r from-orange-400 to-orange-500' 
                : 'bg-gradient-to-r from-emerald-400 to-emerald-500'
          }`}
        />
      </div>
      
      {/* Breakpoint Labels */}
      <div className="flex justify-between w-full px-0.5 mt-1 opacity-30 text-[7px] font-black tracking-tighter uppercase">
        <span>0%</span>
        <span>25%</span>
        <span>50%</span>
        <span>75%</span>
        <span>100%</span>
      </div>
    </div>
  );
};

// --- SUB-COMPONENT: METRIC ITEM ---
const Metric = ({ label, value, colorClass = "text-slate-700" }) => (
  <div className="flex flex-col items-end min-w-[55px]">
    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</span>
    <span className={`text-[11px] font-bold tabular-nums ${colorClass}`}>{value}</span>
  </div>
);

const AdminTaskReportPage = () => {
  // --- STATE ---
  const [expandedProject, setExpandedProject] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(5);

  // --- API CALL (Server-Side Pagination & Search) ---
  const { data, isLoading, isFetching } = useGetTaskPerformanceReportQuery({
    page: currentPage,
    limit: limit,
    search: searchTerm
  });

  const projectGroups = data?.projects || [];
  const pagination = data?.pagination || { totalPages: 0, totalProjects: 0 };

  if (isLoading) return <Loader message="Analyzing Mission Metrics..." />;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <PageHeader
        title="Live Performance"
        subtitle="Tracking time consumption and budget limits for active projects."
      />

      <main className="max-w-[1700px] mx-auto px-8 -mt-10">

        {/* --- SEARCH BAR --- */}
        <div className="bg-white border border-slate-200 p-5 rounded-[2.5rem] shadow-xl shadow-slate-200/50 mb-8 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative group flex-1 w-full">
            <HiOutlineMagnifyingGlass className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={20} />
            <input
              type="text"
              placeholder="Filter by Project Code or Project Title..."
              className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-orange-500 outline-none font-bold text-sm transition-all"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm("")}
              className="px-6 py-4 bg-rose-50 text-rose-500 rounded-2xl font-bold text-xs flex items-center gap-2 hover:bg-rose-100 transition-all"
            >
              <HiOutlineXMark size={18}/> CLEAR SEARCH
            </button>
          )}
        </div>

        {/* --- PROJECT LIST --- */}
        <div className="space-y-6 mb-10">
          {projectGroups.length > 0 ? (
            projectGroups.map((group) => {
              const projectPerc = (group.totalConsumed / group.totalBudget) * 100 || 0;
              const isProjectOver = projectPerc > 100;
              const isExpanded = expandedProject === group._id;

              return (
                <div key={group._id} className={`bg-white rounded-[2.5rem] border transition-all duration-300 overflow-hidden ${isExpanded ? 'border-orange-500/20 shadow-xl' : 'border-slate-200 shadow-sm'}`}>

                  {/* PROJECT HEADER CARD */}
                  <div
                    onClick={() => setExpandedProject(isExpanded ? null : group._id)}
                    className={`p-6 flex items-center justify-between cursor-pointer transition-all ${isExpanded ? 'bg-slate-900 text-white' : 'hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center gap-6">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isExpanded ? 'bg-orange-500 scale-110 shadow-lg shadow-orange-500/40' : 'bg-slate-100 text-slate-500'}`}>
                        <HiOutlineChartBarSquare size={28} />
                      </div>
                      <div>
                        <h3 className="font-black text-lg uppercase tracking-tight">{group.project_code || "UNKNOWN PROJECT"}</h3>
                        <p className={`text-[10px] font-black uppercase tracking-widest ${isExpanded ? 'text-slate-400' : 'text-slate-400'}`}>
                          {group.taskList.length} Active Tasks
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-8">
                      {/* Project Wide Progress */}
                      <div className="hidden lg:flex flex-col items-end min-w-[250px]">
                        <div className="flex justify-between w-full mb-1 px-1">
                           <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Global Consumption</span>
                           <span className={`text-[10px] font-black ${isProjectOver ? 'text-rose-400' : ''}`}>
                             {projectPerc.toFixed(1)}%
                           </span>
                        </div>
                        <CustomProgressBar percentage={projectPerc} isOver={isProjectOver} />
                      </div>

                      <HiChevronDown className={`transition-transform duration-500 ${isExpanded ? 'rotate-180 text-orange-500' : 'text-slate-300'}`} size={28} />
                    </div>
                  </div>

                  {/* TASK LIST (EXPANDABLE) */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-slate-50/50"
                      >
                        <div className="p-6 space-y-3">
                          {group.taskList.map((task) => {
                            const taskPerc = (task.totalWorkHours / task.allocatedTime) * 100 || 0;
                            const isTaskOver = taskPerc > 100;
                            const isNearLimit = taskPerc > 75 && !isTaskOver;

                            return (
                              <div key={task._id} className="bg-white px-6 py-5 rounded-2xl border border-slate-200 shadow-sm hover:border-orange-500/30 transition-all group/task">
                                <div className="flex flex-col md:flex-row md:items-center gap-8">
                                  
                                  {/* Task Title & Warning */}
                                  <div className="md:w-1/4 flex items-center gap-3">
                                    <div className="flex-1">
                                      <h4 className="font-black text-slate-800 text-[13px] uppercase truncate tracking-tight group-hover/task:text-orange-600 transition-colors">
                                        {task.title}
                                      </h4>
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className={`w-1.5 h-1.5 rounded-full ${isTaskOver ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'}`} />
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{task.status}</span>
                                      </div>
                                    </div>
                                    {isNearLimit && <HiOutlineExclamationTriangle className="text-orange-500" size={20} title="Budget Alert: Over 75%" />}
                                  </div>

                                  {/* Progress Visual with Breakpoints */}
                                  <div className="flex-1 flex items-center gap-4">
                                    <CustomProgressBar percentage={taskPerc} isOver={isTaskOver} />
                                    <span className={`text-[12px] font-black tabular-nums w-12 text-right ${isTaskOver ? 'text-rose-500' : 'text-slate-900'}`}>
                                      {taskPerc.toFixed(0)}%
                                    </span>
                                  </div>

                                  {/* Detailed Hours */}
                                  <div className="md:w-1/3 flex items-center justify-end gap-6 border-l border-slate-100 pl-8">
                                    <Metric label="Burned" value={`${task.totalWorkHours.toFixed(1)}h`} />
                                    <Metric label="Budget" value={`${task.allocatedTime}h`} />
                                    
                                    {isTaskOver && (
                                      <div className="flex flex-col items-end">
                                        <span className="text-[8px] font-black text-rose-500 uppercase italic tracking-tighter">Overrun</span>
                                        <span className="text-[11px] font-black text-rose-600">
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
            <div className="bg-white rounded-[3rem] p-32 text-center border-2 border-dashed border-slate-200">
              <p className="text-slate-300 font-black uppercase italic text-xl tracking-tighter">No Active Project Metrics Found.</p>
            </div>
          )}
        </div>

        {/* --- PAGINATION FOOTER --- */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-200 pr-3">View Limit</span>
            <select
              value={limit}
              onChange={(e) => { setLimit(Number(e.target.value)); setCurrentPage(1); }}
              className="bg-transparent text-[10px] font-black outline-none cursor-pointer text-slate-700"
            >
              {[5, 10, 20, 50].map((v) => <option key={v} value={v}>{v} Projects</option>)}
            </select>
          </div>

          <Pagination
            pagination={{
              current: currentPage,
              total: pagination.totalPages,
              count: pagination.totalProjects,
              limit: limit,
            }}
            onPageChange={setCurrentPage}
            loading={isFetching}
            label="Projects"
          />
        </div>
      </main>
    </div>
  );
};

export default AdminTaskReportPage;
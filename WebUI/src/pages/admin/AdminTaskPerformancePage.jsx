import React, { useState, useEffect } from 'react';
import { useGetTaskPerformanceReportQuery } from '../../services/projectApi';
import Loader from '../../components/Loader';
import PageHeader from '../../components/PageHeader';
import Pagination from '../../components/Pagination';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiChevronDown,
  HiOutlineChartBarSquare,
  HiOutlineMagnifyingGlass,
  HiOutlineXMark,
  HiOutlineExclamationTriangle,
  HiOutlineCalendarDays
} from 'react-icons/hi2';

// --- SUB-COMPONENT: COMPACT PROGRESS BAR WITH BREAKPOINTS ---
const CustomProgressBar = ({ percentage, isOver }) => {
  const breakpoints = [25, 50, 75];
  return (
    <div className="relative w-full">
      <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50 shadow-inner">
        {/* Breakpoint Markers */}
        {breakpoints.map((pt) => (
          <div
            key={pt}
            className="absolute top-0 bottom-0 border-r border-slate-300/30 z-20"
            style={{ left: `${pt}%` }}
          />
        ))}

        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(percentage, 100)}%` }}
          className={`h-full relative z-10 transition-colors duration-700 ${isOver
            ? 'bg-rose-500'
            : percentage > 75
              ? 'bg-orange-500'
              : 'bg-indigo-600'
            }`}
        />
      </div>
      <div className="flex justify-between w-full px-0.5 mt-0.5 opacity-40 text-[6px] font-black uppercase tracking-tighter">
        <span>0%</span>
        <span>25</span>
        <span>50</span>
        <span>75</span>
        <span>100%</span>
      </div>
    </div>
  );
};

const Metric = ({ label, value, colorClass = "text-slate-700" }) => (
  <div className="flex flex-col items-end min-w-[50px]">
    <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter leading-none mb-0.5">{label}</span>
    <span className={`text-[10px] font-black tabular-nums ${colorClass}`}>{value}</span>
  </div>
);

const AdminTaskPerformancePage = () => {
  const [expandedProject, setExpandedProject] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(5);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data, isLoading, isFetching } = useGetTaskPerformanceReportQuery({
    page: currentPage,
    limit: limit,
    search: debouncedSearch
  });

  const projectGroups = data?.projects || [];
  const pagination = data?.pagination || { totalPages: 0, totalProjects: 0 };

  if (isLoading) return <Loader message="Accessing Mission Logs..." />;

  return (
    <div className="max-w-[1750px] mx-auto min-h-screen bg-slate-50/50 font-sans text-slate-900">
      <PageHeader
        title="Project Performance"
        subtitle="Tracking time consumption and budget limits."
      />

      <main className="max-w-[1750px] mx-auto px-8 pb-10 -mt-10">

        {/* --- COMPACT SEARCH BAR --- */}
        <div className="bg-white border border-slate-200 p-5 rounded-[1.5rem] shadow-lg shadow-slate-200/40 mb-6 flex flex-col md:flex-row gap-2 items-center">
          <div className="relative flex-1 w-full group">
            <HiOutlineMagnifyingGlass className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search Project Code..."
              className="w-full pl-12 pr-6 py-3.5 bg-white border border-slate-200 rounded-2xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/5 outline-none font-bold text-xs transition-all shadow-sm group"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="px-4 py-2 text-rose-600 font-black text-[9px] uppercase hover:underline">
              Clear
            </button>
          )}
        </div>

        {/* --- PROJECT LIST --- */}
        <div className="space-y-3 mb-8">
          {projectGroups.length > 0 ? (
            projectGroups.map((group) => {
              const projectPerc = group.progressPercent ?? ((group.totalConsumed / group.totalBudget) * 100 || 0);
              const isProjectOver = projectPerc > 100;
              const isExpanded = expandedProject === group._id;

              // Date Calculation
              const subDate = group.endDate ? new Date(group.endDate) : null;
              const formattedDate = subDate ? subDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';

              return (
                <div key={group._id} className={`bg-white rounded-[1.5rem] border transition-all duration-300 ${isExpanded ? 'border-orange-500 shadow-md' : 'border-slate-200'}`}>

                  {/* MINI PROJECT HEADER */}
                  <div
                    onClick={() => setExpandedProject(isExpanded ? null : group._id)}
                    className={`px-5 py-3 flex items-center justify-between cursor-pointer rounded-[1.5rem] ${isExpanded ? 'bg-slate-900 text-white' : 'hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isExpanded ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                        <HiOutlineChartBarSquare size={20} />
                      </div>
                      <div className="min-w-[120px]">
                        <h3 className="font-black text-sm uppercase tracking-tighter italic leading-none">{group.title || "N/A"}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[7px] font-black uppercase opacity-50">{group.taskList?.length || 0} Tasks</span>
                        </div>
                      </div>

                      {/* SUBMISSION DATE (HEADER) */}
                      <div className="hidden sm:flex items-center gap-2 border-l border-slate-200/20 pl-4">
                        <HiOutlineCalendarDays className={isExpanded ? 'text-orange-500' : 'text-slate-300'} size={14} />
                        <div>
                          <p className="text-[6px] font-black uppercase opacity-40 leading-none">Submission</p>
                          <p className={`text-[10px] font-black uppercase ${isExpanded ? 'text-white' : 'text-slate-600'}`}>{formattedDate}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 flex-1">
                      <div className="hidden lg:flex flex-col items-end min-w-[280px] flex-1">
                        <div className="flex justify-between w-full mb-1">
                          <span className="text-[7px] font-black uppercase opacity-50">Usage</span>
                          <span className={`text-[9px] font-black ${isProjectOver ? 'text-rose-400' : isExpanded ? 'text-white' : 'text-slate-900'}`}>
                            {projectPerc.toFixed(1)}%
                          </span>
                        </div>
                        <CustomProgressBar percentage={projectPerc} isOver={isProjectOver} />
                      </div>
                      <HiChevronDown className={`transition-transform ${isExpanded ? 'rotate-180 text-orange-500' : 'text-slate-300'}`} size={16} />
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
                        <div className="p-4 space-y-2">
                          {group.taskList?.map((task) => {
                            const taskPerc = (task.consumedHours / task.allocatedTime) * 100 || 0;
                            const isTaskOver = taskPerc > 100;

                            return (
                              <div key={task._id} className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center gap-4">
                                <div className="md:w-1/4 min-w-0">
                                  <h4 className="font-black text-slate-900 text-[11px] uppercase truncate">{task.title}</h4>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className={`w-1 h-1 rounded-full ${isTaskOver ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                                    <span className="text-[7px] font-black text-slate-400 uppercase">{task.status}</span>
                                  </div>
                                </div>

                                <div className="flex-1 flex items-center gap-4">
                                  <CustomProgressBar percentage={taskPerc} isOver={isTaskOver} />
                                  <span className={`text-[10px] font-black tabular-nums min-w-[30px] text-right ${isTaskOver ? 'text-rose-500' : 'text-slate-900'}`}>
                                    {taskPerc.toFixed(0)}%
                                  </span>
                                </div>

                                <div className="flex items-center justify-end gap-5 border-l border-slate-100 pl-5">
                                  <Metric label="Done" value={`${(task.consumedHours || 0).toFixed(1)}h`} />
                                  <Metric label="Target" value={`${task.allocatedTime}h`} />
                                  {isTaskOver && (
                                    <div className="text-right bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                                      <span className="block text-[6px] font-black text-rose-500 uppercase italic">Over</span>
                                      <span className="text-[10px] font-black text-rose-600">+{(task.consumedHours - task.allocatedTime).toFixed(1)}</span>
                                    </div>
                                  )}
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
            <div className="bg-white rounded-[2rem] py-20 text-center border-2 border-dashed border-slate-200">
              <p className="text-slate-300 font-black uppercase italic text-sm">No Metrics Found</p>
            </div>
          )}
        </div>

        {/* --- MINI PAGINATION FOOTER --- */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-200 pr-3">
                Page Limit
              </span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-transparent text-[9px] font-black outline-none focus:ring-0 cursor-pointer text-slate-700"
              >
                {[5, 10, 25, 50].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            {data?.pagination?.totalProjects && (
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight ml-2">
                Total {data?.pagination?.totalProjects} projects
              </span>
            )}
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
            variant="dark"
          />
        </div>
      </main>
    </div>
  );
};

export default AdminTaskPerformancePage;
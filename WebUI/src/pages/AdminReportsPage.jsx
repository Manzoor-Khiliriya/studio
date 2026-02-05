import { useState } from "react";
import { motion } from "framer-motion";
import { 
  FiFileText, FiClock, FiDownload, FiPieChart, FiBarChart2, FiUsers, FiSearch, FiRefreshCw 
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import { format } from "date-fns";

// RTK Query Hooks
import { useGetAllTasksQuery } from "../services/taskApi";
import { useGetDailyReportQuery } from "../services/timeLogApi";

export default function AdminReportsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const today = format(new Date(), "yyyy-MM-dd");

  // 1. RTK Queries
  const { 
    data: tasksData, 
    isLoading: tasksLoading, 
    isFetching: tasksFetching 
  } = useGetAllTasksQuery({ status: "All" });

  const { 
    data: reportData, 
    isLoading: reportLoading 
  } = useGetDailyReportQuery(today);

  // 2. Derived State
  const tasks = tasksData?.tasks || [];
  const attendance = reportData?.report || [];
  
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === "Completed").length;
  const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.projectNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.assignedTo?.some(u => u.employee?.name?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleExport = () => {
    toast.success("Compiling Analytics CSV...", { icon: '📊' });
    // Implementation for CSV export would go here
  };

  if (tasksLoading || reportLoading) return <LoadingScreen />;

  return (
    <div className="max-w-[1600px] mx-auto pb-20 px-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-12 gap-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter">Command Intelligence</h1>
            {(tasksFetching) && <FiRefreshCw className="animate-spin text-orange-500" />}
          </div>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.4em]">
            Operational Metrics • {format(new Date(), "MMMM do, yyyy")}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
          <div className="relative flex-1 sm:w-80">
            <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-orange-500" size={18} />
            <input 
              type="text" 
              placeholder="Filter assignments or operators..."
              className="w-full pl-14 pr-6 py-5 bg-white border border-slate-100 rounded-[2rem] outline-none focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500/20 transition-all text-sm font-bold shadow-sm"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={handleExport}
            className="flex items-center justify-center gap-3 bg-slate-900 hover:bg-orange-600 text-white px-10 py-5 rounded-[2rem] font-black transition-all shadow-2xl shadow-slate-900/10 group active:scale-95"
          >
            <FiDownload className="group-hover:translate-y-1 transition-transform" /> 
            <span className="uppercase text-[11px] tracking-[0.2em]">Extract Data</span>
          </button>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        <StatSummary title="Efficiency" value={`${completionRate}%`} desc="Tasks Finalized" icon={<FiPieChart />} color="orange" />
        <StatSummary title="Active Hubs" value={totalTasks - completedTasks} desc="Operations in progress" icon={<FiBarChart2 />} color="dark" />
        <StatSummary title="Deployment" value={attendance.length} desc="Operators online" icon={<FiUsers />} color="orange" />
        <StatSummary title="Resource Load" value={`${(totalTasks * 1.5).toFixed(1)}h`} desc="Current projected delta" icon={<FiClock />} color="dark" />
      </div>

      <div className="grid lg:grid-cols-3 gap-12">
        
        {/* TASK DISTRIBUTION TABLE */}
        <section className="lg:col-span-2">
          <SectionTitle icon={<FiBarChart2 />} title="Live Mission Distribution" />
          <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-10 py-7 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Operator Squad</th>
                    <th className="px-10 py-7 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Assignment</th>
                    <th className="px-10 py-7 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredTasks.map(t => (
                    <tr key={t._id} className="hover:bg-orange-50/30 transition-all group">
                      <td className="px-10 py-8">
                        <div className="flex -space-x-3 group-hover:space-x-1 transition-all duration-500">
                          {t.assignedTo?.map((u, i) => (
                            <div key={i} className="relative">
                              <img 
                                title={u.employee?.name}
                                src={`https://ui-avatars.com/api/?name=${u.employee?.name}&background=0f172a&color=fff&bold=true`} 
                                className="w-11 h-11 rounded-[1rem] border-4 border-white shadow-md object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1">{t.projectNumber || "GENERAL"}</p>
                        <p className="font-black text-slate-900 text-lg tracking-tighter group-hover:text-orange-600 transition-colors">{t.title}</p>
                      </td>
                      <td className="px-10 py-8">
                        <StatusBadge status={t.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* RECENT ACTIVITY FEED */}
        <section>
          <SectionTitle icon={<FiClock />} title="Live Pulse Feed" />
          <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-6">
            <div className="space-y-4">
              {attendance.map((a, i) => (
                <div key={i} className="flex items-center justify-between p-6 rounded-[2rem] bg-slate-50 hover:bg-orange-50 transition-all border border-transparent hover:border-orange-100">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-slate-900 text-orange-500 flex items-center justify-center font-black text-lg shadow-lg">
                      {a.employee.charAt(0)}
                    </div>
                    <div>
                      <p className="text-md font-black text-slate-900 tracking-tight">{a.employee}</p>
                      <p className="text-[9px] text-orange-600 font-black uppercase tracking-[0.3em]">Telemetry Active</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-slate-900 block tracking-tighter">
                      {a.totalHours.toFixed(1)}h
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Shift Total</span>
                  </div>
                </div>
              ))}
              
              {attendance.length === 0 && (
                <div className="py-24 text-center">
                  <FiClock size={40} className="text-slate-100 mx-auto mb-4" />
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">No telemetry received today</p>
                </div>
              )}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

/* UI SUB-COMPONENTS */

function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-4">
      <div className="w-16 h-16 border-8 border-slate-100 border-t-orange-600 rounded-full animate-spin" />
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">Synchronizing Analytics...</p>
    </div>
  );
}

function SectionTitle({ icon, title }) {
  return (
    <div className="flex items-center gap-4 mb-8 ml-4">
      <div className="w-12 h-12 bg-orange-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-orange-600/20">{icon}</div>
      <h2 className="text-3xl font-black text-slate-900 tracking-tighter">{title}</h2>
    </div>
  );
}

function StatSummary({ title, value, desc, icon, color }) {
  const themes = {
    orange: "bg-orange-600",
    dark: "bg-slate-900",
  };

  return (
    <motion.div 
      whileHover={{ y: -10, scale: 1.02 }}
      className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden group"
    >
      <div className={`w-16 h-16 rounded-3xl ${themes[color]} text-white flex items-center justify-center text-3xl mb-8 shadow-2xl transition-transform group-hover:rotate-12`}>
        {icon}
      </div>
      <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mb-2">{title}</p>
      <h3 className="text-5xl font-black text-slate-900 mb-2 tracking-tighter">{value}</h3>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{desc}</p>
      </div>
      
      {/* Background Icon Watermark */}
      <div className="absolute -right-6 -bottom-6 opacity-[0.03] text-slate-950 scale-150 rotate-12">
        {icon}
      </div>
    </motion.div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    Completed: "bg-emerald-50 text-emerald-600 border-emerald-100",
    Pending: "bg-orange-50 text-orange-600 border-orange-100",
    "In Progress": "bg-sky-50 text-sky-600 border-sky-100"
  };
  return (
    <span className={`px-6 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] border-2 ${styles[status] || "bg-slate-50 border-slate-100 text-slate-400"}`}>
      {status}
    </span>
  );
}
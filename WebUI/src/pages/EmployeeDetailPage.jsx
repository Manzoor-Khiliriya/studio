import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import {
  HiOutlineClock,
  HiOutlineUser,
  HiOutlineCheckCircle,
  HiOutlineArrowLeft,
  HiOutlineBriefcase,
  HiOutlineEnvelope,
  HiOutlineCalendarDays,
  HiOutlineInboxStack,
  HiOutlineClipboardDocumentList,
} from "react-icons/hi2";
import { HiOutlineLightningBolt } from "react-icons/hi";

// RTK Query Hooks
import { useGetUserByIdQuery } from "../services/userApi";
import { useGetTasksByEmployeeQuery } from "../services/taskApi";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // 1. DATA ACQUISITION
  const { data: employee, isLoading: userLoading } = useGetUserByIdQuery(id);
  const { data: taskData, isLoading: tasksLoading } = useGetTasksByEmployeeQuery(id);

  // 2. INTELLIGENCE NORMALIZATION
  const tasks = Array.isArray(taskData) ? taskData : taskData?.tasks || [];

  // Flat-map logs and sort by newest first
  const timeLogs = tasks
    .flatMap((task) =>
      (task.timeLogs || []).map((log) => ({
        ...log,
        taskTitle: task.title,
        taskId: task._id,
      }))
    )
    .sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

  const activeTasks = tasks.filter((t) => ["In Progress", "Pending"].includes(t.status));
  const completedTasks = tasks.filter((t) => t.status === "Completed");
  const totalMinsWorked = timeLogs.reduce((acc, log) => acc + (log.duration || 0), 0);

  // Calculate theoretical capacity based on efficiency rating
  const effectiveHours = employee
    ? ((540 * (employee.efficiency || 100)) / 6000).toFixed(1)
    : 0;

  // 3. VISUAL ANALYTICS CONFIG
  const chartData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Output (Hrs)",
        data: [effectiveHours, effectiveHours * 0.8, effectiveHours, effectiveHours * 0.9, effectiveHours * 0.5, 0, 0],
        backgroundColor: "#f97316",
        borderRadius: 12,
        barThickness: 15,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, border: { display: false }, ticks: { font: { weight: 'bold', size: 10 } } },
      y: { grid: { color: "#f1f5f9" }, border: { display: false }, beginAtZero: true },
    },
  };

  if (userLoading || tasksLoading) return <LoadingPulse />;

  return (
    <div className="max-w-[1700px] mx-auto pb-24 px-8 pt-6">
      {/* HEADER NAV */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-3 text-slate-400 hover:text-orange-600 font-black uppercase text-[10px] tracking-[0.3em] mb-10 transition-all group"
      >
        <HiOutlineArrowLeft className="group-hover:-translate-x-2 transition-transform" strokeWidth={3} /> 
        Return to Directory
      </button>

      {/* OPERATOR DOSSIER TOP BAR */}
      <div className="grid lg:grid-cols-12 gap-8 mb-12">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-8 bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm flex flex-col xl:flex-row items-center gap-12"
        >
          <div className="relative group">
            <img
              src={employee?.photo || `https://ui-avatars.com/api/?name=${employee?.name}&background=0f172a&color=fff&bold=true`}
              className="w-56 h-56 rounded-[4rem] object-cover border-[10px] border-slate-50 shadow-2xl transition-transform group-hover:scale-105 duration-500"
              alt={employee?.name}
            />
            <div className="absolute inset-0 rounded-[4rem] ring-1 ring-inset ring-black/5" />
          </div>

          <div className="flex-1 text-center xl:text-left">
            <div className="flex flex-wrap items-center justify-center xl:justify-start gap-4 mb-4">
              <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                {employee?.name}
              </h1>
              <span className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 ${
                  employee?.status === "Enable" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                }`}>
                {employee?.status === "Enable" ? "Active Clearance" : "Access Revoked"}
              </span>
            </div>
            
            <p className="text-orange-500 font-black uppercase tracking-[0.4em] text-xs mb-10 flex items-center justify-center xl:justify-start gap-3">
              <HiOutlineBriefcase size={18} /> {employee?.designation || "Primary Operator"}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100 flex items-center gap-5">
                <div className="p-3.5 bg-white rounded-2xl shadow-sm text-slate-400"><HiOutlineEnvelope size={20} /></div>
                <div className="truncate">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Secure Channel</p>
                  <p className="text-sm font-bold text-slate-700 truncate">{employee?.email}</p>
                </div>
              </div>
              <div className="bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100 flex items-center gap-5">
                <div className="p-3.5 bg-white rounded-2xl shadow-sm text-slate-400"><HiOutlineUser size={20} /></div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Tactical ID</p>
                  <p className="text-sm font-bold text-slate-700">#{employee?._id?.slice(-6).toUpperCase()}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* PERFORMANCE CARD */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-4 bg-slate-900 p-12 rounded-[4rem] text-white flex flex-col justify-between relative overflow-hidden group shadow-2xl shadow-slate-900/30"
        >
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-12">
              <div className="p-5 bg-orange-600 rounded-3xl shadow-xl shadow-orange-600/40 rotate-3 group-hover:rotate-12 transition-transform duration-500">
                <HiOutlineLightningBolt size={32} />
              </div>
              <div className="text-right">
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-1">Efficiency Index</p>
                <div className="flex items-center gap-2 justify-end">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-[10px] font-black uppercase text-emerald-500">Peak Signal</p>
                </div>
              </div>
            </div>
            
            <div className="mb-8">
              <h2 className="text-9xl font-black text-orange-500 tracking-tighter leading-none">
                {employee?.efficiency || 100}<span className="text-3xl text-white/10 ml-2">%</span>
              </h2>
            </div>

            <div className="flex items-center gap-3 bg-white/5 border border-white/10 w-fit px-6 py-3 rounded-2xl backdrop-blur-md">
              <HiOutlineClock className="text-orange-500" size={16} />
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-300">
                {effectiveHours}h Daily Capacity
              </span>
            </div>
          </div>
          
          {/* Decorative blur element */}
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-orange-600/20 rounded-full blur-[100px] group-hover:bg-orange-600/30 transition-all duration-700" />
        </motion.div>
      </div>

      {/* DETAILED LOGS & QUEUE GRID */}
      <div className="grid lg:grid-cols-12 gap-10">
        
        {/* ANALYTICS & LOGS (LEFT) */}
        <div className="lg:col-span-8 space-y-10">
          
          {/* PRODUCTIVITY CHART */}
          <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-12">
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-4">
                <div className="w-3 h-10 bg-orange-600 rounded-full" />
                Performance Flow
              </h3>
              <div className="flex items-center gap-3 text-[11px] font-black uppercase text-slate-400 bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100">
                 <HiOutlineCalendarDays className="text-orange-500" size={18} /> Operational Cycle
              </div>
            </div>
            <div className="h-[300px]">
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>

          {/* TELEMETRY TABLE */}
          <div className="bg-white rounded-[4rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-4">
                <HiOutlineClock className="text-orange-500" size={24} /> Telemetry Logs
              </h3>
              <span className="text-[11px] font-black bg-slate-900 text-white px-6 py-3 rounded-2xl uppercase tracking-[0.2em] shadow-lg shadow-slate-900/10">
                {Math.floor(totalMinsWorked / 60)}h Total Logged
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Mission</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {timeLogs.slice(0, 10).map((log, idx) => (
                    <tr key={idx} className="hover:bg-orange-50/30 transition-all group">
                      <td className="px-10 py-7">
                        <div className="flex items-center gap-4">
                          <div className="w-1.5 h-10 bg-slate-200 rounded-full group-hover:bg-orange-500 transition-colors" />
                          <div>
                            <p className="text-sm font-black text-slate-700 leading-none mb-1">
                              {new Date(log.startTime).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                              {new Date(log.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} Logged
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-7">
                        <p className="text-xs font-black text-slate-800 uppercase group-hover:text-orange-600 transition-colors">
                          {log.taskTitle}
                        </p>
                      </td>
                      <td className="px-10 py-7 text-center">
                        <span className="inline-block px-5 py-2 bg-white border-2 border-slate-100 text-slate-900 rounded-2xl text-[11px] font-black shadow-sm group-hover:border-orange-200">
                          {log.duration >= 60 ? `${Math.floor(log.duration / 60)}h ${log.duration % 60}m` : `${log.duration}m`}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* LIVE MISSION QUEUE (RIGHT) */}
        <div className="lg:col-span-4 space-y-10">
          <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm sticky top-10">
            <div className="flex items-center justify-between mb-12">
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-4">
                <HiOutlineInboxStack className="text-orange-500" size={24} /> Live Queue
              </h3>
              <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 rounded-full">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-ping" />
                <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Syncing</span>
              </div>
            </div>

            <div className="space-y-6">
              {activeTasks.length > 0 ? (
                activeTasks.map((t) => (
                  <div 
                    key={t._id} 
                    className={`p-8 rounded-[3rem] border-2 transition-all relative group overflow-hidden ${
                      t.status === "In Progress" 
                        ? "bg-orange-500 text-white border-orange-600 shadow-xl shadow-orange-500/20" 
                        : "bg-slate-50 border-transparent hover:border-slate-200"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-8 relative z-10">
                      <span className={`text-[10px] font-black px-4 py-1.5 rounded-xl uppercase tracking-[0.2em] ${
                        t.status === "In Progress" ? "bg-white/20" : "bg-slate-200 text-slate-500"
                      }`}>
                        {t.status}
                      </span>
                      {t.status === "In Progress" && <HiOutlineClock className="animate-spin" size={24} />}
                    </div>
                    
                    <p className={`font-black uppercase text-lg mb-8 tracking-tighter leading-tight relative z-10 ${
                      t.status === "In Progress" ? "text-white" : "text-slate-800"
                    }`}>
                      {t.title}
                    </p>
                    
                    <div className={`flex justify-between items-center text-[11px] font-black border-t pt-6 relative z-10 ${
                      t.status === "In Progress" ? "border-white/20 text-white/60" : "border-slate-100 text-slate-400"
                    }`}>
                      <span className="tracking-[0.2em]">MISSION LOAD</span>
                      <span className={t.status === "In Progress" ? "text-white" : "text-slate-900"}>
                        {(t.allocatedTime || t.estimatedTime / 60).toFixed(1)}H
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-24 border-4 border-dashed border-slate-50 rounded-[4rem]">
                   <HiOutlineCheckCircle className="mx-auto text-slate-100 mb-6" size={64} />
                   <p className="text-slate-300 font-black uppercase text-xs tracking-[0.3em] italic">All Systems Clear</p>
                </div>
              )}
            </div>

            {/* LOAD INDICATOR */}
            <div className="mt-12 bg-slate-900 p-10 rounded-[3rem] text-white">
               <div className="flex items-center gap-5 mb-6">
                  <div className="w-14 h-14 bg-orange-600 rounded-3xl flex items-center justify-center text-2xl font-black shadow-lg">
                     {activeTasks.length}
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Active Momentum</p>
                    <p className="text-sm font-bold">Concurrent Projects</p>
                  </div>
               </div>
               <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((activeTasks.length / 5) * 100, 100)}%` }}
                    className="bg-orange-500 h-full rounded-full shadow-[0_0_15px_rgba(249,115,22,0.5)]" 
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingPulse() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen space-y-6">
      <div className="w-20 h-20 border-[8px] border-slate-100 border-t-orange-600 rounded-full animate-spin" />
      <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.6em] animate-pulse">De-encrypting Personnel Dossier</p>
    </div>
  );
}
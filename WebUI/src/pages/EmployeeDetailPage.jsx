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
} from "react-icons/hi2";
import { HiOutlineLightningBolt } from "react-icons/hi";

// RTK Query Hooks
import { useGetUserByIdQuery } from "../services/userApi";
import { useGetTasksByEmployeeQuery } from "../services/taskApi";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: employee, isLoading: userLoading } = useGetUserByIdQuery(id);
  const { data: taskData, isLoading: tasksLoading } = useGetTasksByEmployeeQuery(id);

  const tasks = Array.isArray(taskData) ? taskData : taskData?.tasks || [];

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
  const totalMinsWorked = timeLogs.reduce((acc, log) => acc + (log.duration || 0), 0);
  const effectiveHours = employee ? ((540 * (employee.efficiency || 100)) / 6000).toFixed(1) : 0;

  const chartData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Hours Worked",
        data: [effectiveHours, effectiveHours * 0.8, effectiveHours, effectiveHours * 0.9, effectiveHours * 0.5, 0, 0],
        backgroundColor: "#f97316",
        borderRadius: 8,
        barThickness: 12,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { weight: '600', size: 10 } } },
      y: { grid: { color: "#f8fafc" }, beginAtZero: true },
    },
  };

  if (userLoading || tasksLoading) return <LoadingPulse />;

  return (
    <div className="max-w-[1600px] mx-auto pb-20 px-4 md:px-8 pt-4">
      {/* BACK NAVIGATION */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-400 hover:text-orange-600 font-bold uppercase text-[11px] tracking-widest mb-8 transition-all group cursor-pointer"
      >
        <HiOutlineArrowLeft className="group-hover:-translate-x-1 transition-transform" /> 
        Back to Directory
      </button>

      {/* PROFILE HEADER SECTION */}
      <div className="grid lg:grid-cols-12 gap-6 mb-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-8 bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-10"
        >
          <div className="relative">
            <img
              src={employee?.photo || `https://ui-avatars.com/api/?name=${employee?.name}&background=f8fafc&color=0f172a&bold=true`}
              className="w-44 h-44 rounded-[2rem] object-cover border-4 border-slate-50 shadow-lg"
              alt={employee?.name}
            />
          </div>

          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-3">
              <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
                {employee?.name}
              </h1>
              <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                  employee?.status === "Enable" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
                }`}>
                {employee?.status === "Enable" ? "Active" : "Disabled"}
              </span>
            </div>
            
            <p className="text-orange-600 font-bold uppercase tracking-widest text-[11px] mb-8 flex items-center justify-center md:justify-start gap-2">
              <HiOutlineBriefcase size={16} /> {employee?.designation || "Team Member"}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-4">
                <HiOutlineEnvelope className="text-slate-400" size={20} />
                <div className="truncate text-left">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Email Address</p>
                  <p className="text-xs font-bold text-slate-700 truncate">{employee?.email}</p>
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-4">
                <HiOutlineUser className="text-slate-400" size={20} />
                <div className="text-left">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Employee ID</p>
                  <p className="text-xs font-bold text-slate-700">#{employee?._id?.slice(-6).toUpperCase()}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* PERFORMANCE SCORE CARD */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-4 bg-slate-900 p-8 rounded-[2.5rem] text-white flex flex-col justify-between relative overflow-hidden group shadow-xl"
        >
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-orange-500 rounded-2xl shadow-lg shadow-orange-500/20">
                <HiOutlineLightningBolt size={24} />
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Performance Rating</p>
                <div className="flex items-center gap-1.5 justify-end mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-[9px] font-bold uppercase text-emerald-500">Optimal</p>
                </div>
              </div>
            </div>
            
            <h2 className="text-7xl font-bold text-orange-500 tracking-tighter leading-none mb-6">
              {employee?.efficiency || 100}<span className="text-2xl text-white/20 ml-1">%</span>
            </h2>

            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl backdrop-blur-sm">
              <HiOutlineClock className="text-orange-500" size={14} />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                {effectiveHours}h Target Capacity
              </span>
            </div>
          </div>
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-orange-600/10 rounded-full blur-3xl group-hover:bg-orange-600/20 transition-all duration-700" />
        </motion.div>
      </div>

      {/* CHARTS & ACTIVITY GRID */}
      <div className="grid lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: ACTIVITY & LOGS */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                <div className="w-1.5 h-6 bg-orange-500 rounded-full" />
                Productivity Trends
              </h3>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-slate-400 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                 <HiOutlineCalendarDays className="text-orange-500" size={16} /> Weekly Cycle
              </div>
            </div>
            <div className="h-[250px]">
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>

          {/* TIME LOGS TABLE */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-3">
                <HiOutlineClock className="text-orange-500" size={20} /> Time Logs
              </h3>
              <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-4 py-2 rounded-xl uppercase tracking-wider">
                {Math.floor(totalMinsWorked / 60)}h Total Recorded
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Project / Task</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {timeLogs.slice(0, 8).map((log, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-all group">
                      <td className="px-8 py-5">
                        <p className="text-xs font-bold text-slate-700">
                          {new Date(log.startTime).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {new Date(log.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-xs font-bold text-slate-800 group-hover:text-orange-600 transition-colors uppercase tracking-tight">
                          {log.taskTitle}
                        </p>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <span className="text-[11px] font-bold text-slate-600 bg-slate-50 px-3 py-1 rounded-lg">
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

        {/* RIGHT COLUMN: QUEUE */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-3 mb-6">
              <HiOutlineInboxStack className="text-orange-500" size={20} /> Project Queue
            </h3>

            <div className="space-y-4">
              {activeTasks.length > 0 ? (
                activeTasks.map((t) => (
                  <div 
                    key={t._id} 
                    className={`p-6 rounded-2xl border transition-all ${
                      t.status === "In Progress" 
                        ? "bg-orange-500 text-white border-orange-600 shadow-lg shadow-orange-500/10" 
                        : "bg-slate-50 border-slate-100"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <span className={`text-[9px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${
                        t.status === "In Progress" ? "bg-white/20" : "bg-slate-200 text-slate-500"
                      }`}>
                        {t.status}
                      </span>
                      {t.status === "In Progress" && <HiOutlineClock className="animate-spin" size={18} />}
                    </div>
                    
                    <p className={`font-bold text-sm mb-4 leading-tight ${
                      t.status === "In Progress" ? "text-white" : "text-slate-800"
                    }`}>
                      {t.title}
                    </p>
                    
                    <div className={`flex justify-between items-center text-[10px] font-bold border-t pt-4 ${
                      t.status === "In Progress" ? "border-white/10 text-white/60" : "border-slate-100 text-slate-400"
                    }`}>
                      <span>EST. TIME</span>
                      <span className={t.status === "In Progress" ? "text-white" : "text-slate-900"}>
                        {(t.allocatedTime || t.estimatedTime / 60).toFixed(1)}H
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-2xl">
                   <HiOutlineCheckCircle className="mx-auto text-slate-200 mb-4" size={48} />
                   <p className="text-slate-400 font-bold text-[11px] uppercase tracking-widest">Queue Empty</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingPulse() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <div className="w-12 h-12 border-4 border-slate-100 border-t-orange-500 rounded-full animate-spin" />
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loading Analytics...</p>
    </div>
  );
}
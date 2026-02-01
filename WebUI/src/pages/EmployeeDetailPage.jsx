import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/apiSlice";
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
import { toast } from "react-hot-toast";
import {
  HiOutlineClock,
  HiOutlineUser,
  HiOutlineCheckCircle,
  HiOutlineChartBar,
  HiOutlineArrowLeft,
  HiOutlineBriefcase,
  HiOutlineClipboardDocumentList,
  HiOutlineEnvelope,
  HiOutlineCalendarDays,
  HiOutlineArrowUpRight,
  HiOutlineInboxStack,
} from "react-icons/hi2";
import { HiOutlineLightningBolt } from "react-icons/hi";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [timeLogs, setTimeLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Constants
  const DAILY_LIMIT_MINS = 540; // 9 Hours

  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      try {
        const [empRes, taskRes] = await Promise.all([
          API.get(`/users/${id}`),
          API.get(`/tasks/admin/employee-tasks/${id}`),
        ]);

        setEmployee(empRes.data);
        setTasks(taskRes.data);

        // Process logs from all tasks into a single chronological timeline
        const allLogs = taskRes.data
          .flatMap((task) =>
            (task.timeLogs || []).map((log) => ({
              ...log,
              taskTitle: task.title,
              taskId: task._id,
            }))
          )
          .sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

        setTimeLogs(allLogs);
      } catch (err) {
        console.error(err);
        toast.error("Security Clearance Failure: Could not sync logs");
      } finally {
        setLoading(false);
      }
    };
    loadAllData();
  }, [id]);

  // Data Aggregates
  const activeTasks = tasks.filter((t) => ["In Progress", "Pending"].includes(t.status));
  const completedTasks = tasks.filter((t) => t.status === "Completed");
  const totalMinsWorked = timeLogs.reduce((acc, log) => acc + (log.duration || 0), 0);
  const effectiveHours = employee
    ? ((DAILY_LIMIT_MINS * (employee.efficiency || 100)) / 6000).toFixed(1)
    : 0;

  // Chart Configuration
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
      x: { grid: { display: false }, border: { display: false } },
      y: { grid: { color: "#f8fafc" }, border: { display: false }, beginAtZero: true },
    },
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-orange-100 border-t-orange-600 rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="max-w-[1600px] mx-auto pb-20 px-6 pt-4">
      {/* NAVIGATION */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-400 hover:text-orange-600 font-black uppercase text-[10px] tracking-[0.2em] mb-8 transition-all group"
      >
        <HiOutlineArrowLeft className="group-hover:-translate-x-1 transition-transform" strokeWidth={3} /> 
        Back to Personnel Directory
      </button>

      {/* HEADER SECTION: EMPLOYEE DOSSIER */}
      <div className="grid lg:grid-cols-12 gap-8 mb-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-8 bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-10"
        >
          <img
            src={employee?.photo || `https://ui-avatars.com/api/?name=${employee?.name}&background=f97316&color=fff`}
            className="w-48 h-48 rounded-[3.5rem] object-cover border-8 border-slate-50 shadow-2xl shadow-orange-900/10"
            alt={employee?.name}
          />
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-3">
              <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                {employee?.name}
              </h1>
              <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                  employee?.status === "Enable" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                }`}>
                {employee?.status === "Enable" ? "Active Duty" : "Restricted"}
              </span>
            </div>
            <p className="text-orange-500 font-black uppercase tracking-[0.3em] text-sm mb-8 flex items-center justify-center md:justify-start gap-2">
              <HiOutlineBriefcase /> {employee?.designation || "Executive Talent"}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50/80 p-5 rounded-[2rem] border border-slate-100 flex items-center gap-4">
                <div className="p-3 bg-white rounded-2xl shadow-sm"><HiOutlineEnvelope className="text-slate-400" /></div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Comm Channel</p>
                  <p className="text-sm font-bold text-slate-700">{employee?.email}</p>
                </div>
              </div>
              <div className="bg-slate-50/80 p-5 rounded-[2rem] border border-slate-100 flex items-center gap-4">
                <div className="p-3 bg-white rounded-2xl shadow-sm"><HiOutlineUser className="text-slate-400" /></div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Operator ID</p>
                  <p className="text-sm font-bold text-slate-700">{employee?._id.slice(-8).toUpperCase()}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* EFFICIENCY KPI */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-4 bg-[#1a1d23] p-10 rounded-[3.5rem] text-white flex flex-col justify-between relative overflow-hidden group shadow-2xl shadow-slate-900/20"
        >
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-10">
              <div className="p-4 bg-orange-600 rounded-[1.5rem] shadow-xl shadow-orange-600/40">
                <HiOutlineLightningBolt size={28} />
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Efficiency Rating</p>
                <p className="text-[10px] font-black uppercase text-orange-500">Peak Performance</p>
              </div>
            </div>
            <h2 className="text-8xl font-black text-orange-500 tracking-tighter leading-none mb-4">
              {employee?.efficiency || 100}<span className="text-3xl text-white/20">%</span>
            </h2>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 w-fit px-4 py-2 rounded-full">
              <HiOutlineClock className="text-orange-500" size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                {effectiveHours}h Capacity / Day
              </span>
            </div>
          </div>
          <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-orange-600/10 rounded-full blur-[80px] group-hover:bg-orange-600/20 transition-all duration-700" />
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: ANALYTICS & LOGS */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* PRODUCTIVITY FLOW */}
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                <div className="w-2 h-8 bg-orange-500 rounded-full" />
                Productivity Flow
              </h3>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 bg-slate-50 px-4 py-2 rounded-xl">
                 <HiOutlineCalendarDays className="text-orange-500" /> Last 7 Days
              </div>
            </div>
            <div className="h-[280px]">
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>

          {/* OPERATIONAL TIME LOG */}
          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                <HiOutlineClock className="text-orange-500" /> Operational Time Log
              </h3>
              <span className="text-[10px] font-black bg-slate-100 px-4 py-2 rounded-xl text-slate-500 uppercase tracking-widest">
                {Math.floor(totalMinsWorked / 60)}h Total Logged
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50">
                  <tr className="border-b border-slate-100">
                    <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Date / Session</th>
                    <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Associated Mission</th>
                    <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Duration</th>
                    <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {timeLogs.length > 0 ? (
                    timeLogs.slice(0, 8).map((log, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/30 transition-colors group">
                        <td className="px-8 py-5">
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-slate-700">
                              {new Date(log.startTime).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 lowercase">
                              {new Date(log.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              {log.endTime ? ` — ${new Date(log.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : " (Active)"}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-600 uppercase group-hover:text-orange-600 transition-colors">
                              {log.taskTitle}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-center">
                          <span className="inline-block px-3 py-1 bg-white border border-slate-200 text-slate-600 rounded-lg text-[10px] font-black shadow-sm">
                            {log.duration >= 60 ? `${Math.floor(log.duration / 60)}h ${log.duration % 60}m` : `${log.duration}m`}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex justify-end">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="4" className="px-8 py-20 text-center text-slate-300 italic font-bold uppercase tracking-widest text-xs">No activity logs found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* MISSION ARCHIVE */}
          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                <HiOutlineClipboardDocumentList className="text-orange-500" /> Mission Archive
              </h3>
              <span className="text-[10px] font-black bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl uppercase tracking-widest">
                {completedTasks.length} Completed
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Project Name</th>
                    <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Final Time</th>
                    <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Outcome</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {completedTasks.map((task) => (
                    <tr key={task.taskId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5 font-bold text-slate-700 text-xs uppercase">{task.title}</td>
                      <td className="px-8 py-5 text-xs font-black text-slate-400">{(task.estimatedTime / 60).toFixed(1)}h</td>
                      <td className="px-8 py-5 text-right">
                        <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg uppercase tracking-tighter">Success</span>
                      </td>
                    </tr>
                  ))}
                  {completedTasks.length === 0 && (
                    <tr><td colSpan="3" className="px-8 py-20 text-center text-slate-300 italic font-bold uppercase text-xs">Archive Empty</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: LIVE QUEUE */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm sticky top-10">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                <HiOutlineInboxStack className="text-orange-500" /> Live Queue
              </h3>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-ping" />
                <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Live</span>
              </div>
            </div>

            <div className="space-y-4">
              {activeTasks.length > 0 ? (
                activeTasks.map((t) => (
                  <div 
                    key={t.taskId} 
                    className={`p-6 rounded-[2.5rem] border-2 transition-all group relative overflow-hidden ${
                      t.status === "In Progress" 
                        ? "bg-orange-50/50 border-orange-100" 
                        : "bg-slate-50 border-transparent hover:bg-white hover:border-slate-200"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-6 relative z-10">
                      <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                        t.status === "In Progress" ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" : "bg-slate-200 text-slate-500"
                      }`}>
                        {t.status}
                      </span>
                      {t.status === "In Progress" && <HiOutlineClock className="text-orange-500 animate-spin-slow" size={20} />}
                    </div>
                    
                    <p className="font-black text-slate-800 uppercase text-sm mb-6 leading-tight relative z-10 group-hover:text-orange-600 transition-colors">
                      {t.title}
                    </p>
                    
                    <div className="flex justify-between items-center text-[10px] font-black text-slate-400 border-t border-slate-100 pt-4 relative z-10">
                      <span className="tracking-widest">ALLOCATED TIME</span>
                      <span className="text-slate-900 font-black">{(t.estimatedTime / 60).toFixed(1)}H</span>
                    </div>

                    {t.status === "In Progress" && (
                      <div className="absolute top-0 right-0 p-2">
                         <div className="w-20 h-20 bg-orange-500/5 rounded-full -mr-10 -mt-10 blur-2xl" />
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-20 border-4 border-dashed border-slate-50 rounded-[3rem]">
                   <HiOutlineCheckCircle className="mx-auto text-slate-100 mb-4" size={50} />
                   <p className="text-slate-300 font-black uppercase text-[10px] tracking-widest italic">All Missions Clear</p>
                </div>
              )}
            </div>

            {/* QUICK STATS BOX */}
            <div className="mt-8 bg-[#1a1d23] p-8 rounded-[2.5rem] text-white">
               <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center font-black">
                     {activeTasks.length}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Current Load</p>
                    <p className="text-xs font-bold">Active Projects</p>
                  </div>
               </div>
               <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-orange-500 h-full rounded-full transition-all duration-1000" 
                    style={{ width: `${Math.min((activeTasks.length / 5) * 100, 100)}%` }}
                  />
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
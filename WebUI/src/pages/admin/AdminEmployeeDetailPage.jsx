import React from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  HiOutlineArrowLeft,
  HiOutlineBriefcase,
  HiOutlineEnvelope,
  HiOutlineCalendarDays,
  HiOutlineInboxStack,
} from "react-icons/hi2";
import { HiOutlineLightningBolt } from "react-icons/hi";

import { useGetEmployeeProfileQuery } from "../../services/employeeApi";
import { useGetTasksByEmployeeQuery } from "../../services/taskApi";
import Loader from "../../components/Loader";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function EmployeeDetailPage() {
  const { id } = useParams(); // This is the userId from the URL
  const navigate = useNavigate();

  // RTK Query using the dedicated Employee Profile endpoint
  const { data: employee, isLoading: userLoading } = useGetEmployeeProfileQuery(id);
  const { data: taskData, isLoading: tasksLoading } = useGetTasksByEmployeeQuery(id);

  const tasks = Array.isArray(taskData) ? taskData : taskData?.tasks || [];
  const timeLogs = tasks
    .flatMap((task) => (task.timeLogs || []).map((log) => ({ ...log, taskTitle: task.title })))
    .sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

  const activeTasks = tasks.filter((t) => ["In Progress", "Pending"].includes(t.status));
  
  // Logic using employee profile efficiency
  const effectiveHours = employee ? ((540 * (employee.efficiency || 100)) / 6000).toFixed(1) : 0;

  if (userLoading || tasksLoading) return <Loader message="Accessing Personnel Files..." />;

  const chartData = {
    labels: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
    datasets: [{
      label: "Hours",
      data: [effectiveHours, effectiveHours * 0.8, effectiveHours, effectiveHours * 0.9, effectiveHours * 0.5, 0, 0],
      backgroundColor: "#f97316",
      borderRadius: 4,
      barThickness: 10,
    }],
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      <header className="bg-white border-b border-slate-200 pt-8 pb-10">
        <div className="max-w-[1600px] mx-auto px-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-400 hover:text-orange-600 font-bold uppercase text-[10px] tracking-[0.2em] mb-6 transition-all group cursor-pointer border-none bg-transparent"
          >
            <HiOutlineArrowLeft className="group-hover:-translate-x-1" /> Back to Directory
          </button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-slate-900 rounded-[1.5rem] flex items-center justify-center text-orange-500 font-black text-3xl italic shadow-2xl shadow-slate-200">
                {employee?.user?.name?.charAt(0)}
              </div>
              <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-2">
                  {employee?.user?.name}
                </h1>
                <div className="flex items-center gap-3">
                  <StatusBadge status={employee?.user?.status} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-8 -mt-6">
        <div className="grid lg:grid-cols-12 gap-6">
          
          {/* MAIN COLUMN */}
          <div className="lg:col-span-8 space-y-6">
            {/* TACTICAL METRIC GRID */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricTile label="Efficiency" value={`${employee?.efficiency || 100}%`} icon={<HiOutlineLightningBolt className="text-orange-500" />} />
              <MetricTile label="Shift Capacity" value={`${effectiveHours}h`} icon={<HiOutlineClock className="text-slate-400" />} />
              <MetricTile label="Active Tasks" value={activeTasks.length} icon={<HiOutlineInboxStack className="text-slate-400" />} />
              <MetricTile label="Designation" value={employee?.designation || "Operator"} icon={<HiOutlineBriefcase className="text-slate-400" />} />
            </div>

            {/* PERFORMANCE CHART */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                  Performance Analytics
                </h3>
              </div>
              <div className="h-[260px]">
                <Bar data={chartData} options={chartOptions} />
              </div>
            </div>

            {/* ACTIVITY LOGS */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Operational History</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50/30">
                      <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-left">Mission</th>
                      <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {timeLogs.slice(0, 5).map((log, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-5">
                          <p className="text-[11px] font-bold text-slate-800 uppercase tracking-tight">{log.taskTitle}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{new Date(log.startTime).toLocaleDateString('en-GB')}</p>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <span className="text-[10px] font-black text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg">
                            {log.duration}M
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* SIDEBAR */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-slate-300 relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Active Mission Queue</h3>
                <div className="space-y-4">
                  {activeTasks.length > 0 ? activeTasks.map(t => (
                    <div key={t._id} className="p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all">
                      <p className="text-xs font-bold uppercase tracking-tight text-slate-200">{t.title}</p>
                      <div className="flex justify-between items-center mt-4">
                        <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest">{t.status}</span>
                        <span className="text-[10px] font-black text-white italic">{(t.allocatedTime || 0).toFixed(1)}H</span>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-10">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Queue Empty</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-orange-600/10 rounded-full blur-3xl" />
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Comms Protocol</h3>
              <div className="space-y-6">
                <ContactItem icon={<HiOutlineEnvelope />} label="Secure Email" value={employee?.user?.email} />
                <ContactItem icon={<HiOutlineCalendarDays />} label="Joined Date" value={employee?.joinedDate ? new Date(employee.joinedDate).toLocaleDateString() : 'N/A'} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// --- TACTICAL SUB-COMPONENTS ---

function MetricTile({ label, value, icon }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-orange-200 transition-all">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">{label}</span>
      </div>
      <p className="text-md font-black text-slate-900 tracking-tighter uppercase">{value}</p>
    </div>
  );
}

function ContactItem({ icon, label, value }) {
  return (
    <div className="flex items-center gap-4 group">
      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 group-hover:bg-orange-50 group-hover:text-orange-600 transition-all">
        {React.cloneElement(icon, { size: 18 })}
      </div>
      <div className="min-w-0">
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
        <p className="text-xs font-bold text-slate-700 truncate">{value || 'N/A'}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const isEnabled = status === "Enable";
  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest ${
      isEnabled ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
      {isEnabled ? "Authorized" : "Revoked"}
    </div>
  );
}

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 9, weight: '800' }, color: '#94a3b8' } },
    y: { grid: { color: '#f1f5f9', drawTicks: false }, border: { display: false }, ticks: { font: { size: 9, weight: '600' }, color: '#cbd5e1' } }
  },
};
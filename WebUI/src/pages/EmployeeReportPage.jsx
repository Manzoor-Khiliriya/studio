import React, { useMemo } from "react";
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
import { FiBarChart2, FiTrendingUp, FiClock, FiActivity } from "react-icons/fi";
import { useGetMyTodayLogsQuery } from "../services/timeLogApi";
import Loader from "../components/Loader";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function EmployeeReportsPage() {
  // --- DATA FETCHING (RTK QUERY) ---
  const { data: logsData, isLoading } = useGetMyTodayLogsQuery();

  // --- ANALYTICS ENGINE ---
  const analytics = useMemo(() => {
    if (!logsData?.logs) return { weekly: [], totalHours: 0, avgHours: 0 };

    const logs = logsData.logs;
    
    // Generate last 7 days keys
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toLocaleDateString('en-CA'); // YYYY-MM-DD
    }).reverse();

    let totalSec = 0;

    const grouped = last7Days.map(date => {
      const dayTotalSec = logs
        .filter(l => {
          const logDate = new Date(l.startTime).toLocaleDateString('en-CA');
          return logDate === date && l.logType === "work";
        })
        .reduce((sum, l) => sum + (l.durationSeconds || 0), 0);

      totalSec += dayTotalSec;
      return { 
        date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }), 
        hours: parseFloat((dayTotalSec / 3600).toFixed(2)) 
      };
    });

    return {
      weekly: grouped,
      totalHours: (totalSec / 3600).toFixed(1),
      avgHours: (totalSec / (7 * 3600)).toFixed(1)
    };
  }, [logsData]);

  const chartData = {
    labels: analytics.weekly.map(d => d.date),
    datasets: [
      {
        label: "Mission Hours",
        data: analytics.weekly.map(d => d.hours),
        backgroundColor: "#f97316", // Orange-500
        hoverBackgroundColor: "#0f172a", // Slate-900
        borderRadius: 12,
        borderSkipped: false,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#0f172a",
        titleFont: { size: 12, weight: 'bold', family: 'Inter' },
        padding: 12,
        cornerRadius: 12,
        displayColors: false
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { weight: 'bold', size: 10 } } },
      y: { beginAtZero: true, grid: { color: "#f1f5f9" }, ticks: { font: { weight: 'bold' } } }
    }
  };

  if (isLoading) return <Loader message="Compiling Telemetry..." />;

  return (
    <div className="max-w-[1400px] mx-auto p-10 pb-32">
      {/* HEADER */}
      <div className="mb-16">
        <h1 className="text-7xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Telemetry</h1>
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mt-6 flex items-center gap-3">
          <FiBarChart2 className="text-orange-500" /> Operational Efficiency & Time Distribution
        </p>
      </div>

      {/* QUICK METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <MetricCard 
            label="Cycle Total" 
            value={`${analytics.totalHours}h`} 
            sub="Past 7 Days" 
            icon={<FiClock />} 
        />
        <MetricCard 
            label="Daily Average" 
            value={`${analytics.avgHours}h`} 
            sub="Per Shift" 
            icon={<FiTrendingUp />} 
            color="orange" 
        />
        <MetricCard 
            label="System Status" 
            value="Optimal" 
            sub="Deployment Active" 
            icon={<FiActivity />} 
        />
      </div>

      {/* CHART SECTION */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-3xl shadow-slate-200/50"
      >
        <div className="flex justify-between items-center mb-10">
            <div>
                <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Velocity Report</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Hours logged per solar cycle</p>
            </div>
            <div className="flex gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Active Work</span>
            </div>
        </div>

        <div className="h-[400px]">
          <Bar data={chartData} options={chartOptions} />
        </div>
      </motion.div>
    </div>
  );
}

const MetricCard = ({ label, value, sub, icon, color }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group"
  >
    <div className={`absolute -top-4 -right-4 text-7xl opacity-5 transition-transform group-hover:scale-110 group-hover:rotate-12 ${color === 'orange' ? 'text-orange-500' : 'text-slate-900'}`}>
        {icon}
    </div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{label}</p>
    <h3 className={`text-5xl font-black tracking-tighter tabular-nums mb-1 ${color === 'orange' ? 'text-orange-500' : 'text-slate-900'}`}>
        {value}
    </h3>
    <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">{sub}</p>
  </motion.div>
);
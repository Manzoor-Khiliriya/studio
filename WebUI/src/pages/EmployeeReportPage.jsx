import { useEffect, useState } from "react";
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

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function EmployeeReportsPage() {
  const [weeklyData, setWeeklyData] = useState([]);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await API.get("/time/my");
      const logs = res.data;

      const last7 = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split("T")[0];
      }).reverse();

      const grouped = last7.map(date => {
        const total = logs
          .filter(l => l.date === date)
          .reduce((sum, l) => sum + (l.duration || 0), 0);
        return { date, hours: (total / 60).toFixed(2) };
      });

      setWeeklyData(grouped);
    } catch {
      toast.error("Failed to load report");
    }
  };

  const chartData = {
    labels: weeklyData.map(d => d.date.slice(5)),
    datasets: [
      {
        label: "Hours Worked",
        data: weeklyData.map(d => d.hours),
        backgroundColor: "#6366f1",
        borderRadius: 8,
      },
    ],
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-3xl font-black mb-8"
      >
        Weekly Productivity Report
      </motion.h1>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white p-8 rounded-3xl shadow-sm border"
      >
        <Bar data={chartData} />
      </motion.div>
    </div>
  );
}

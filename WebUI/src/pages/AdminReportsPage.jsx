// import { useEffect, useState } from "react";
// import API from "../services/apiSlice";
// import { motion } from "framer-motion";
// import {
//   FiFileText, FiClock, FiDownload, FiPieChart, FiBarChart2, FiUsers, FiSearch
// } from "react-icons/fi";
// import { toast } from "react-hot-toast";

// export default function AdminReportsPage() {
//   const [tasks, setTasks] = useState([]);
//   const [attendance, setAttendance] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [searchTerm, setSearchTerm] = useState("");

//   const today = new Date().toISOString().split("T")[0];

//   useEffect(() => {
//     const fetchReports = async () => {
//       try {
//         const [taskRes, timeRes] = await Promise.all([
//           API.get("/tasks"),
//           API.get(`/time/report?date=${today}`)
//         ]);
//         setTasks(taskRes.data);
//         setAttendance(timeRes.data);
//       } catch {
//         toast.error("Failed to fetch reports");
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchReports();
//   }, [today]);

//   const totalTasks = tasks.length;
//   const completedTasks = tasks.filter(t => t.status === "Completed").length;
//   const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

//   const filteredTasks = tasks.filter(t => 
//     t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
//     t.assignedTo?.some(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()))
//   );

//   const handleExport = () => {
//     toast.success("Compiling Analytics CSV...");
//   };

//   if (loading) return (
//     <div className="flex items-center justify-center min-h-[60vh]">
//       <div className="w-12 h-12 border-4 border-orange-100 border-t-orange-600 rounded-full animate-spin" />
//     </div>
//   );

//   return (
//     <div className="max-w-[1500px] mx-auto pb-20 px-2">

//       {/* HEADER */}
//       <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
//         <div>
//           <h1 className="text-5xl font-black text-slate-900 tracking-tight">System Analytics</h1>
//           <p className="text-slate-500 font-bold mt-1 uppercase text-xs tracking-[0.1em]">Daily productivity & resource utilization</p>
//         </div>
        
//         <div className="flex gap-3 w-full md:w-auto">
//           <div className="relative flex-1 md:w-72">
//             <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500" strokeWidth={3} />
//             <input 
//               type="text" 
//               placeholder="Search reports..."
//               className="w-full pl-12 pr-4 py-4 bg-white border border-orange-100 rounded-2xl outline-none focus:ring-4 focus:ring-orange-50 transition-all text-sm font-bold shadow-sm"
//               onChange={(e) => setSearchTerm(e.target.value)}
//             />
//           </div>
//           <button 
//             onClick={handleExport}
//             className="flex items-center gap-2 bg-[#1a1d23] hover:bg-orange-600 text-white px-8 py-4 rounded-2xl font-black transition-all shadow-xl shadow-slate-200 group"
//           >
//             <FiDownload className="group-hover:translate-y-1 transition-transform" /> 
//             <span className="hidden md:inline uppercase text-xs tracking-widest">Export</span>
//           </button>
//         </div>
//       </div>

//       {/* KPI GRID */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
//         <StatSummary title="Success Rate" value={`${completionRate}%`} desc="Tasks cleared" icon={<FiPieChart />} color="orange" />
//         <StatSummary title="Active Pipelines" value={totalTasks - completedTasks} desc="Work in progress" icon={<FiFileText />} color="dark" />
//         <StatSummary title="Staff Online" value={attendance.length} desc="Active pulse" icon={<FiUsers />} color="orange" />
//         <StatSummary title="Total Bandwidth" value={`${(totalTasks * 1.5).toFixed(1)}h`} desc="Projected load" icon={<FiClock />} color="dark" />
//       </div>

//       <div className="grid lg:grid-cols-3 gap-10">
        
//         {/* TASK DISTRIBUTION */}
//         <section className="lg:col-span-2">
//           <SectionTitle icon={<FiBarChart2 />} title="Live Distribution" />
//           <div className="bg-white rounded-[3rem] border border-orange-100/50 shadow-sm overflow-hidden">
//             <div className="overflow-x-auto">
//               <table className="w-full text-left">
//                 <thead>
//                   <tr className="bg-orange-50/50">
//                     <th className="px-8 py-6 text-[10px] font-black text-orange-900/40 uppercase tracking-[0.2em]">Team</th>
//                     <th className="px-8 py-6 text-[10px] font-black text-orange-900/40 uppercase tracking-[0.2em]">Assignment</th>
//                     <th className="px-8 py-6 text-[10px] font-black text-orange-900/40 uppercase tracking-[0.2em]">Timeline</th>
//                     <th className="px-8 py-6 text-[10px] font-black text-orange-900/40 uppercase tracking-[0.2em]">Status</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-orange-50">
//                   {filteredTasks.map(t => (
//                     <tr key={t._id} className="hover:bg-orange-50/20 transition-all group">
//                       <td className="px-8 py-6">
//                         <div className="flex -space-x-3 group-hover:-space-x-1 transition-all duration-300">
//                           {t.assignedTo?.map((u, i) => (
//                             <img 
//                               key={i}
//                               title={u.name}
//                               src={`https://ui-avatars.com/api/?name=${u.name}&background=f97316&color=fff`} 
//                               className="w-9 h-9 rounded-xl border-2 border-white shadow-sm"
//                             />
//                           ))}
//                         </div>
//                       </td>
//                       <td className="px-8 py-6">
//                         <p className="font-black text-slate-800 text-sm group-hover:text-orange-600 transition-colors">{t.title}</p>
//                       </td>
//                       <td className="px-8 py-6">
//                          <span className="text-[10px] font-black text-slate-400 uppercase">
//                           {Math.floor(t.estimatedTime / 60)}h {t.estimatedTime % 60}m
//                         </span>
//                       </td>
//                       <td className="px-8 py-6">
//                         <StatusBadge status={t.status} />
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         </section>

//         {/* ACTIVITY FEED */}
//         <section>
//           <SectionTitle icon={<FiClock />} title="Activity Feed" />
//           <div className="bg-white rounded-[3rem] border border-orange-100/50 shadow-sm p-4">
//             <div className="space-y-2">
//               {attendance.map((a, i) => (
//                 <div key={i} className="flex items-center justify-between p-5 rounded-[2rem] bg-orange-50/30 hover:bg-orange-50 transition-all">
//                   <div className="flex items-center gap-4">
//                     <div className="w-12 h-12 rounded-2xl bg-[#1a1d23] text-orange-500 flex items-center justify-center font-black text-sm">
//                       {a.employee.charAt(0)}
//                     </div>
//                     <div>
//                       <p className="text-sm font-black text-slate-900">{a.employee}</p>
//                       <p className="text-[9px] text-orange-600 font-black uppercase tracking-widest">Logged In</p>
//                     </div>
//                   </div>
//                   <div className="text-right">
//                     <span className="text-xs font-black text-slate-900 block">
//                         {a.totalHours.toFixed(1)}h
//                     </span>
//                     <span className="text-[9px] font-bold text-slate-400 uppercase">Today</span>
//                   </div>
//                 </div>
//               ))}
//               {attendance.length === 0 && (
//                 <div className="py-20 text-center">
//                     <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
//                         <FiClock className="text-slate-200" />
//                     </div>
//                     <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">No Logs Found</p>
//                 </div>
//               )}
//             </div>
//           </div>
//         </section>

//       </div>
//     </div>
//   );
// }

// /* UI Helpers */
// function SectionTitle({ icon, title }) {
//   return (
//     <div className="flex items-center gap-3 mb-8 ml-2">
//       <div className="w-10 h-10 bg-orange-600 text-white rounded-[1rem] flex items-center justify-center shadow-lg shadow-orange-200">{icon}</div>
//       <h2 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h2>
//     </div>
//   );
// }

// function StatSummary({ title, value, desc, icon, color }) {
//   const themes = {
//     orange: "bg-orange-600 shadow-orange-200",
//     dark: "bg-[#1a1d23] shadow-slate-200",
//   };

//   return (
//     <motion.div 
//       whileHover={{ y: -8 }}
//       className="bg-white p-8 rounded-[2.5rem] border border-orange-100/50 shadow-sm relative overflow-hidden"
//     >
//       <div className={`w-14 h-14 rounded-2xl ${themes[color]} text-white flex items-center justify-center text-2xl mb-6 shadow-xl`}>
//         {icon}
//       </div>
//       <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">{title}</p>
//       <h3 className="text-4xl font-black text-slate-900 mb-1 tracking-tighter">{value}</h3>
//       <p className="text-xs text-orange-600 font-bold uppercase tracking-tighter">{desc}</p>
      
//       {/* Decorative background element */}
//       <div className="absolute -right-4 -bottom-4 opacity-[0.03] text-slate-900">
//         {icon}
//       </div>
//     </motion.div>
//   );
// }

// function StatusBadge({ status }) {
//   const styles = {
//     Completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
//     Pending: "bg-orange-100 text-orange-700 border-orange-200",
//     "In Progress": "bg-blue-100 text-blue-700 border-blue-200"
//   };
//   return (
//     <span className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border ${styles[status] || "bg-slate-100 border-slate-200 text-slate-500"}`}>
//       {status}
//     </span>
//   );
// }
import { motion } from "framer-motion";
import { FiRefreshCcw, FiAlertCircle, FiHash, FiClock, FiMinusCircle, FiCheckCircle, FiActivity } from "react-icons/fi";
import { formatDistanceToNow } from "date-fns";

export default function TaskCard({ task, isTracking }) {
  // HELPER: Status Visual Styles
  const getStatusStyles = (currentStatus) => {
    switch (currentStatus) {
      case "Completed": return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "In Progress": return "bg-orange-50 text-orange-600 border-orange-100";
      case "Overdue": return "bg-red-50 text-red-600 border-red-100 animate-pulse";
      case "Pending": return "bg-slate-50 text-slate-500 border-slate-200";
      default: return "bg-slate-50 text-slate-500 border-slate-100";
    }
  };

  // HELPER: Side Bar Colors
  const getSideBarColor = () => {
    if (isTracking) return 'bg-orange-500';
    if (task.status === "Completed") return 'bg-emerald-500';
    if (task.status === "Overdue") return 'bg-red-600';
    if (task.status === "In Progress") return 'bg-orange-400';
    return 'bg-slate-200'; // Pending/Default
  };

  const lastUpdated = task.updatedAt 
    ? formatDistanceToNow(new Date(task.updatedAt), { addSuffix: true })
    : "Recently Assigned";

  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`bg-white border rounded-[1.5rem] transition-all relative group flex flex-col md:flex-row overflow-hidden ${
        isTracking 
          ? 'border-orange-500 shadow-lg shadow-orange-500/5 ring-1 ring-orange-500/20' 
          : task.status === "Overdue" 
          ? 'border-red-200 shadow-sm bg-red-50/5' 
          : 'border-slate-100'
      }`}
    >
      {/* Visual Status Indicator */}
      <div className={`w-1.5 transition-colors duration-500 ${getSideBarColor()}`} />

      <div className="flex flex-col lg:flex-row flex-1 p-5 gap-6 items-center">
        
        {/* LEFT: CONTENT SECTION */}
        <div className="flex-1 space-y-3 w-full">
          <div className="flex items-center flex-wrap gap-2">
            <span className={`text-[8px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md border ${getStatusStyles(task.status)}`}>
              {task.status}
            </span>
            <div className="flex items-center gap-1.5 text-slate-400 text-[9px] font-bold uppercase bg-slate-50 px-2 py-1 rounded-md">
              <FiRefreshCcw size={10} />
              Synced {lastUpdated}
            </div>
            {isTracking && (
              <span className="flex items-center gap-1 text-orange-600 text-[8px] font-black uppercase px-2 py-1 bg-orange-100 rounded-md animate-pulse">
                <FiActivity size={10} /> Live Telemetry
              </span>
            )}
          </div>
          
          <div>
            <div className="flex items-center gap-2 mb-1">
               <span className="text-slate-400 text-[10px] font-black flex items-center">
                 <FiHash className="mr-0.5" /> {task.projectNumber || "GEN"}
               </span>
               <h3 className={`font-black text-xl tracking-tight ${
                 isTracking ? 'text-orange-600' : task.status === "Overdue" ? 'text-red-700' : 'text-slate-800'
               }`}>
                {task.title}
              </h3>
            </div>
            <p className="text-slate-500 text-xs font-medium leading-relaxed line-clamp-1 italic">
              {task.projectDetails || "Mission details encrypted. Contact supervisor for brief."}
            </p>
          </div>
        </div>

        {/* RIGHT: READ-ONLY STATUS DISPLAY */}
        <div className={`lg:w-48 w-full flex items-center justify-center p-4 rounded-2xl border ${
          task.status === "Completed" ? 'bg-emerald-50 border-emerald-100' :
          task.status === "Overdue" ? 'bg-red-50 border-red-100' : 
          isTracking ? 'bg-orange-50 border-orange-100' : 'bg-slate-50 border-slate-100'
        }`}>
          <div className="flex flex-col items-center gap-1">
            {task.status === "Completed" ? (
              <FiCheckCircle className="text-emerald-500" size={20} />
            ) : task.status === "Overdue" ? (
              <FiAlertCircle className="text-red-500" size={20} />
            ) : task.status === "Pending" ? (
              <FiMinusCircle className="text-slate-400" size={20} />
            ) : (
              <FiClock className="text-orange-500" size={20} />
            )}
            <span className={`text-[10px] font-black uppercase tracking-tighter ${
              task.status === "Completed" ? 'text-emerald-600' :
              task.status === "Overdue" ? 'text-red-600' :
              task.status === "Pending" ? 'text-slate-500' : 'text-orange-600'
            }`}>
              {task.status === "In Progress" ? "System Active" : task.status}
            </span>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
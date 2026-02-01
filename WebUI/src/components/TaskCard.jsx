import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { FiSave, FiActivity, FiRefreshCcw, FiChevronDown } from "react-icons/fi";
import { formatDistanceToNow } from "date-fns";

// Import your RTK hook
import { useUpdateTaskMutation } from "../services/taskApi";

export default function TaskCard({ task }) {
  const [status, setStatus] = useState(task.status);

  // 1. RTK Mutation Hook
  const [updateTaskMutation, { isLoading: isUpdating }] = useUpdateTaskMutation();

  // Sync local state if task prop changes externally
  useEffect(() => {
    setStatus(task.status);
  }, [task.status]);

  const getStatusStyles = (currentStatus) => {
    switch (currentStatus) {
      case "Completed": return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "In Progress": return "bg-orange-50 text-orange-600 border-orange-100";
      default: return "bg-slate-50 text-slate-500 border-slate-100";
    }
  };

  // 2. Updated Handler using RTK Query
  const handleUpdate = async () => {
    try {
      // .unwrap() allows us to use try/catch with RTK Query mutations
      await updateTaskMutation({ 
        id: task._id, 
        status: status 
      }).unwrap();
      
      toast.success("Progress Synchronized");
    } catch (err) {
      toast.error(err.data?.message || "Sync Failed");
    }
  };

  const lastUpdated = task.updatedAt 
    ? formatDistanceToNow(new Date(task.updatedAt), { addSuffix: true })
    : "Original Assignment";

  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ y: -5 }}
      className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:shadow-orange-500/5 transition-all relative overflow-hidden group"
    >
      {/* Dynamic Status Vertical Bar */}
      <div className={`absolute top-0 left-0 w-2 h-full transition-colors duration-500 ${
        status === "Completed" ? 'bg-emerald-500' : status === "In Progress" ? 'bg-orange-500' : 'bg-slate-200'
      }`} />

      <div className="flex flex-col xl:flex-row justify-between gap-8">
        
        {/* LEFT: MISSION BRIEF */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center flex-wrap gap-4">
            <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-xl border-2 ${getStatusStyles(status)}`}>
              {status}
            </span>
            <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest">
              <FiRefreshCcw size={14} className={`${isUpdating ? "animate-spin text-orange-500" : "text-slate-300"}`} />
              {lastUpdated}
            </div>
          </div>
          
          <div>
            <h3 className="font-black text-2xl text-slate-900 tracking-tight mb-2 group-hover:text-orange-600 transition-colors">
              {task.title}
            </h3>
            <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-2xl">
              {task.projectDetails || "Primary objective assigned by administration."}
            </p>
          </div>

          <div className="flex items-center gap-6 pt-2">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Project Number</span>
              <span className="text-xs font-bold text-slate-700">{task.projectNumber || "N/A"}</span>
            </div>
            <div className="w-[1px] h-6 bg-slate-100" />
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Priority</span>
              <span className={`text-xs font-bold uppercase ${task.priority === 'High' ? 'text-red-500' : 'text-slate-700'}`}>
                {task.priority || 'Medium'}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT: COMMAND PANEL */}
        <div className="flex flex-col md:flex-row xl:flex-col md:w-full xl:w-64 gap-4 bg-slate-50/80 p-6 rounded-[2rem] border border-slate-100">
          
          <div className="flex-1 space-y-2">
            <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-[0.15em] flex items-center gap-2">
              <FiActivity className="text-orange-500" /> State
            </label>
            <div className="relative">
              <select
                value={status}
                disabled={isUpdating}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-white border-2 border-transparent focus:border-orange-500 rounded-2xl px-4 py-3 text-sm font-black text-slate-800 outline-none cursor-pointer appearance-none shadow-sm transition-all disabled:opacity-50"
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
              <FiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
            </div>
          </div>

          <button
            onClick={handleUpdate}
            disabled={isUpdating || status === task.status}
            className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all 
              ${isUpdating || status === task.status
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                : 'bg-slate-900 text-white hover:bg-orange-600 shadow-xl shadow-slate-200 active:scale-95'}`}
          >
            {isUpdating ? "Syncing..." : <><FiSave size={14} /> Update Task</>}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
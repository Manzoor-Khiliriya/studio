import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { FiSave, FiActivity, FiRefreshCcw, FiChevronDown, FiAlertCircle } from "react-icons/fi";
import { formatDistanceToNow } from "date-fns";

// RTK hook
import { useUpdateTaskMutation } from "../services/taskApi";

export default function TaskCard({ task, isTracking }) {
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

  const handleUpdate = async () => {
    try {
      await updateTaskMutation({ 
        id: task._id, 
        status: status 
      }).unwrap();
      
      toast.success("Progress Synchronized", {
        style: { borderRadius: '15px', background: '#0f172a', color: '#fff', fontSize: '12px', fontWeight: 'bold' }
      });
    } catch (err) {
      toast.error(err.data?.message || "Sync Failed");
    }
  };

  const lastUpdated = task.updatedAt 
    ? formatDistanceToNow(new Date(task.updatedAt), { addSuffix: true })
    : "Original Assignment";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white border p-8 rounded-[2.5rem] transition-all relative overflow-hidden group ${
        isTracking 
          ? 'border-orange-500 shadow-2xl shadow-orange-500/10' 
          : 'border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50'
      }`}
    >
      {/* Dynamic Status Vertical Bar */}
      <div className={`absolute top-0 left-0 w-2 h-full transition-all duration-500 ${
        isTracking ? 'bg-orange-600' : status === "Completed" ? 'bg-emerald-500' : status === "In Progress" ? 'bg-orange-500' : 'bg-slate-200'
      }`} />

      {/* TRACKING INDICATOR OVERLAY */}
      {isTracking && (
        <div className="absolute top-0 right-0 px-6 py-2 bg-orange-600 text-white rounded-bl-[1.5rem] flex items-center gap-2 shadow-lg">
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
          <span className="text-[9px] font-black uppercase tracking-widest">Live Tracking Active</span>
        </div>
      )}

      <div className="flex flex-col xl:flex-row justify-between gap-8">
        
        {/* LEFT: MISSION BRIEF */}
        <div className="flex-1 space-y-5">
          <div className="flex items-center flex-wrap gap-4">
            <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-xl border-2 ${getStatusStyles(status)}`}>
              {status}
            </span>
            <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg">
              <FiRefreshCcw size={14} className={`${isUpdating ? "animate-spin text-orange-500" : "text-slate-300"}`} />
              {lastUpdated}
            </div>
            {task.priority === 'High' && (
              <span className="flex items-center gap-1.5 text-red-500 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 bg-red-50 rounded-lg animate-pulse">
                <FiAlertCircle size={14} /> Critical Priority
              </span>
            )}
          </div>
          
          <div>
            <h3 className="font-black text-3xl text-slate-900 tracking-tighter mb-3 group-hover:text-orange-600 transition-colors">
              {task.title}
            </h3>
            <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-2xl bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
              {task.projectDetails || "Primary objective assigned by administration. Monitor telemetry for updates."}
            </p>
          </div>

          <div className="flex items-center gap-8 pt-2">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Project Ref</span>
              <span className="text-sm font-black text-slate-800 tracking-tight">{task.projectNumber || "PRJ-99"}</span>
            </div>
            <div className="w-[1px] h-8 bg-slate-200" />
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Task Category</span>
              <span className="text-sm font-black text-slate-800 tracking-tight">{task.category || "General Operations"}</span>
            </div>
          </div>
        </div>

        {/* RIGHT: COMMAND PANEL */}
        <div className="flex flex-col md:flex-row xl:flex-col md:w-full xl:w-72 gap-4 bg-slate-50/80 p-6 rounded-[2.5rem] border border-slate-100">
          <div className="flex-1 space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-[0.2em] flex items-center gap-2">
              <FiActivity className="text-orange-500" /> Operational State
            </label>
            <div className="relative">
              <select
                value={status}
                disabled={isUpdating || isTracking} // Prevent changing status while timer is running
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-white border-2 border-slate-100 focus:border-orange-500 rounded-2xl px-5 py-4 text-xs font-black text-slate-800 outline-none cursor-pointer appearance-none shadow-sm transition-all disabled:opacity-50"
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
              <FiChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
            </div>
          </div>

          <button
            onClick={handleUpdate}
            disabled={isUpdating || status === task.status || isTracking}
            className={`w-full flex items-center justify-center gap-3 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.25em] transition-all 
              ${isUpdating || status === task.status || isTracking
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                : 'bg-slate-900 text-white hover:bg-orange-600 shadow-xl shadow-slate-200 active:scale-95'}`}
          >
            {isUpdating ? "Syncing..." : isTracking ? "Mission Active" : <><FiSave size={16} /> Sync Progress</>}
          </button>
          
          {isTracking && (
            <p className="text-[8px] text-center font-bold text-orange-600 uppercase tracking-widest mt-1">
              Lock active during telemetry
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
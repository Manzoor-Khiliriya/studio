import { motion } from "framer-motion";
import {  FiClock, FiMinusCircle, FiActivity } from "react-icons/fi";

export default function TaskCard({ task, isTracking }) {

  const getStatusStyles = (status) => {
    switch (status) {
      case "In progress":
        return "bg-orange-50 text-orange-600 border-orange-100";
      case "Started":
        return "bg-yellow-50 text-yellow-600 border-yellow-100";
      case "To be started":
        return "bg-slate-50 text-slate-500 border-slate-100";
      default:
        return "bg-blue-50 text-blue-600 border-blue-100";
    }
  };

  const getSideBarColor = () => {
    if (isTracking) return 'bg-orange-500';
    if (task.status === "To be started") return 'bg-slate-400';
    if (task.status === "Started") return 'bg-yellow-500';
    return 'bg-orange-400';
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`bg-white border rounded-[1.5rem] transition-all relative group flex flex-col md:flex-row overflow-hidden ${
        isTracking
          ? 'border-orange-500 shadow-lg shadow-orange-500/5 ring-1 ring-orange-500/20'
          : 'border-slate-100'
      }`}
    >
      {/* LEFT BAR */}
      <div className={`w-1.5 ${getSideBarColor()}`} />

      <div className="flex flex-col lg:flex-row flex-1 p-5 gap-6 items-center">

        {/* LEFT CONTENT */}
        <div className="flex-1 space-y-3 w-full">

          <div className="flex items-center flex-wrap gap-2">

            {/* OPTIONAL: SHOW WORKFLOW STATUS */}
            <span className="text-[8px] font-bold px-2 py-1 bg-blue-100 text-blue-600 rounded-md">
              {task.status}
            </span>


            {isTracking && (
              <span className="flex items-center gap-1 text-orange-600 text-[8px] font-black uppercase px-2 py-1 bg-orange-100 rounded-md animate-pulse">
                <FiActivity size={10} /> Live
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-slate-600 font-bold">
                {task.projectTitle} {task.projectCode && task.projectCode !== "N/A" ? `(${task.projectCode})` : "(GEN)"}
              </span>
              <h3 className={`font-black capitalize tracking-tight ${isTracking ? 'text-orange-600' : 'text-slate-800'}`}>
                {task.title}
              </h3>
            </div>

            <p className="text-slate-500 text-xs font-medium leading-relaxed line-clamp-1 italic">
              {task?.description || "Mission details encrypted."}
            </p>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="lg:w-48 w-full flex items-center justify-center p-4 rounded-2xl border bg-slate-50 border-slate-100">
          <div className="flex flex-col items-center gap-1">

            {task.status === "In progress" ? (
              <FiActivity className="text-orange-500" size={20} />
            ) : task.status === "Started" ? (
              <FiClock className="text-yellow-500" size={20} />
            ) : (
              <FiMinusCircle className="text-slate-400" size={20} />
            )}

            <span className="text-[10px] font-black uppercase text-slate-600">
              {task?.status}
            </span>

          </div>
        </div>

      </div>
    </motion.div>
  );
}
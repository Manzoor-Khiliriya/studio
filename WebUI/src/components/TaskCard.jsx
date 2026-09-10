import { motion } from "framer-motion";
import { FiClock, FiMinusCircle, FiActivity } from "react-icons/fi";
import TruncateText from "./TruncateText";

const getStatusTextColor = (status) => {
  switch (status) {
    case "In progress":
      return "text-green-600";
    case "Started":
      return "text-yellow-600";
    case "To be started":
      return "text-blue-500";
    default:
      return "text-blue-600";
  }
};

export default function TaskCard({ user, task, isTracking }) {
  const getSideBarColor = () => {
    if (isTracking) return "bg-orange-500";
    if (task.status === "To be started") return "bg-slate-400";
    if (task.status === "Started") return "bg-yellow-500";
    return "bg-orange-400";
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`bg-white border rounded-2xl sm:rounded-[1.5rem] transition-all relative group flex overflow-hidden ${isTracking
        ? "border-orange-500 shadow-lg shadow-orange-500/5 ring-1 ring-orange-500/20"
        : "border-slate-100"
        }`}
    >
      {/* LEFT BAR */}
      <div className={`w-1 sm:w-1.5 shrink-0 ${getSideBarColor()}`} />

      <div className="flex flex-col lg:flex-row flex-1 p-4 sm:p-5 gap-4 sm:gap-6 items-stretch lg:items-center min-w-0">
        {/* LEFT CONTENT */}
        <div className="flex-1 space-y-3 w-full min-w-0">
          {/* BADGES */}
          <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
            <span
              className={`text-[10px] font-black uppercase ${getStatusTextColor(
                task?.status
              )}`}
            >
              {task?.status}
            </span>
            {user?.role !== "Admin" && (
              <>
                <span className="px-2 py-1 text-[9px] font-bold bg-slate-100 text-slate-900 rounded-md">
                  {task.allocation?.role || "Main"}
                </span>

                <span className="px-2 py-1 text-[9px] font-bold bg-red-100 text-red-600 rounded-md">
                  Priority {task.allocation?.priorityOrder || "-"}
                </span>

                <span className="px-2 py-1 text-[9px] font-bold bg-yellow-100 text-gray-900 rounded-md">
                  {task.allocation?.todayAllocatedFormatted ||
                    "0 Hrs 0 Mins 0 Secs"}
                </span>
              </>
            )}

            {isTracking && (
              <span className="flex items-center gap-1 text-orange-600 text-[8px] font-black uppercase px-2 py-1 bg-orange-100 rounded-md animate-pulse">
                <FiActivity size={10} />
                Live
              </span>
            )}
          </div>

          {/* PROJECT + TASK */}
          <div className="min-w-0">
            <div className="flex flex-row sm:items-center gap-1 sm:gap-2 mb-1 min-w-0">
              <TruncateText
                text={`${task.projectTitle} ${task.projectCode && task.projectCode !== "N/A"
                  ? `(${task.projectCode})`
                  : "(GEN)"
                  }`}
                maxWidth="max-w-[150px] lg:max-w-[300px]"
                className="text-slate-800 font-bold text-sm sm:text-base"
              />
              <span className="text-slate-800 font-bold text-sm sm:text-base"> - </span>
              <TruncateText
                text={task.title}
                maxWidth="max-w-[150px] lg:max-w-[300px]"
                className={`font-black capitalize tracking-tight text-sm sm:text-base ${isTracking ? "text-orange-600" : "text-slate-800"
                  }`}
              />
            </div>

            <p
              className="text-slate-500 text-xs font-medium leading-relaxed line-clamp-2 sm:line-clamp-1 italic"
              title={task?.description}
            >
              {task?.description || "Mission details encrypted."}
            </p>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="w-full lg:w-48 shrink-0 flex items-center justify-center p-3 sm:p-4 rounded-xl sm:rounded-2xl border bg-slate-50 border-slate-100">
          <div className="flex flex-row lg:flex-col items-center justify-center gap-2 lg:gap-1">
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
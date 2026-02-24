import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  HiOutlineArrowLeft,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineClock,
  HiOutlineUserGroup,
  HiOutlineQueueList,
  HiOutlineCalendarDays,
  HiOutlineBolt // New icon for Live Status
} from "react-icons/hi2";
import { toast } from "react-hot-toast";

// RTK Query & Shared Components
import { useGetTaskDetailQuery, useDeleteTaskMutation } from "../../services/taskApi";
import Loader from "../../components/Loader";
import TaskModal from "../../components/TaskModal";

export default function AdminTaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [editingTask, setEditingTask] = useState(null);

  const { data: task, isLoading, isError } = useGetTaskDetailQuery(id);
  const [deleteTask] = useDeleteTaskMutation();

  const consumed = Number(task?.totalConsumedHours || 0);
  const allocated = Number(task?.allocatedTime || 0);
  const isOver = consumed > allocated;

  const handleDelete = async () => {
    if (!window.confirm("CONFIRM PURGE: Permanent deletion of all mission logs?")) return;
    try {
      await deleteTask(id).unwrap();
      toast.success("Task Purged");
      navigate("/tasks");
    } catch {
      toast.error("Deletion Failed");
    }
  };

  if (isLoading) return <Loader />;

  if (isError || !task) return (
    <div className="flex flex-col items-center justify-center p-20 text-center">
      <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Mission Data Not Found</p>
      <button onClick={() => navigate("/tasks")} className="mt-4 text-orange-600 font-bold text-xs">RETURN TO LIST</button>
    </div>
  );

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-slate-200 pt-8 pb-10">
        <div className="max-w-[1600px] mx-auto px-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-400 hover:text-orange-600 font-bold uppercase text-[10px] tracking-[0.2em] mb-6 transition-all group cursor-pointer"
          >
            <HiOutlineArrowLeft className="group-hover:-translate-x-1" /> Back to Dashboard
          </button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <span className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-orange-500 font-black text-2xl italic shadow-xl">
                {task.title?.charAt(0)}
              </span>
              <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-2">
                  {task.title}
                </h1>
                <div className="flex items-center gap-2">
                  {/* NEW: Live Status Badge (Indigo/Blue) */}
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter border shadow-sm flex items-center gap-1 ${
                    task.liveStatus?.toLowerCase() === "in progress"
                      ? "bg-blue-50 text-blue-600 border-blue-100"
                      : "bg-indigo-50 text-indigo-500 border-indigo-100"
                  }`}>
                    <HiOutlineBolt size={10} />
                    {task.liveStatus || "To be started"}
                  </span>

                  {/* Initiative Status Badge (Themed) */}
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter border shadow-sm ${
                    task.status === "Completed"
                      ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                      : task.status === "On hold"
                      ? "bg-slate-100 text-slate-600 border-slate-300"
                      : "bg-purple-50 text-purple-600 border-purple-100"
                  }`}>
                    {task.status}
                  </span>

                  {/* Priority Badge */}
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter border shadow-sm ${
                    task.priority === "Urgent" || task.priority === "High"
                      ? "bg-rose-50 text-rose-600 border-rose-100 animate-pulse"
                      : task.priority === "Medium"
                        ? "bg-amber-50 text-amber-600 border-amber-100"
                        : "bg-slate-50 text-slate-500 border-slate-200"
                  }`}>
                    {task.priority || "Normal"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setEditingTask(task)}
                className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-5 py-3 rounded-xl font-bold text-xs uppercase hover:border-orange-500 hover:text-orange-600 transition-all cursor-pointer shadow-sm"
              >
                <HiOutlinePencilSquare size={16} /> Update
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 bg-rose-50 text-rose-600 px-5 py-3 rounded-xl font-bold text-xs uppercase hover:bg-rose-600 hover:text-white transition-all cursor-pointer"
              >
                <HiOutlineTrash size={16} /> Delete
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-8 -mt-6">
        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <MetricBox label="Progress" value={`${task.progressPercent}%`} icon={<HiOutlineQueueList />} />
              <MetricBox label="Spent" value={`${consumed.toFixed(1)}h`} icon={<HiOutlineClock />} />
              <MetricBox label="Estimate" value={`${Number(task.estimatedTime || 0).toFixed(1)}h`} icon={<HiOutlinePencilSquare />} />
              <MetricBox label="Allocation" value={`${allocated.toFixed(1)}h`} icon={<HiOutlineCalendarDays />} />
              <MetricBox
                label="Efficiency"
                value={isOver ? "Overload" : "Nominal"}
                color={isOver ? "text-rose-600" : "text-emerald-600"}
              />
            </div>

            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Project Details</p>
              <p className="text-slate-600 text-sm font-medium leading-relaxed">
                {task.projectDetails || "No additional briefing data available."}
              </p>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <HiOutlineUserGroup className="text-orange-500" /> Active Operators
                </h3>
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-50">
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Operator</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Contribution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {task.assignedTo?.map((emp) => (
                    <tr key={emp._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-900 flex items-center justify-center font-bold text-xs border border-slate-200 uppercase">
                            {emp.user?.name?.charAt(0)}
                          </div>
                          <span className="text-xs font-bold text-slate-700 uppercase tracking-tight">{emp.user?.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-xs font-black text-slate-900">{(emp.totalConsumedHours || 0).toFixed(1)}h</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Progress Monitor</p>
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-6xl font-black tracking-tighter italic">{task.progressPercent}</span>
                  <span className="text-xl font-bold text-orange-500">%</span>
                </div>
                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-1000 ${isOver ? 'bg-rose-500' : 'bg-orange-500'}`}
                    style={{ width: `${Math.min(task.progressPercent, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 border-b border-slate-50 pb-4">Schedule Timeline</p>
              <div className="space-y-4">
                <DateItem label="Created At" date={task.createdAt} />
                <DateItem label="Start Date" date={task.startDate} />
                <DateItem label="End Date" date={task.endDate} />
              </div>
            </div>
          </div>
        </div>
      </main>

      <TaskModal
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        editTask={editingTask}
      />
    </div>
  );
}

// --- SUB-COMPONENTS (COMPACT) ---

function MetricBox({ label, value, icon, color = "text-slate-900" }) {
  return (
    <div className="bg-white p-5 rounded-4xl border border-slate-200 shadow-sm">
      <div className="flex items-center gap-2 mb-2 text-slate-400">
        {icon && React.cloneElement(icon, { size: 14 })}
        <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <p className={`text-lg font-black tracking-tight ${color}`}>{value}</p>
    </div>
  );
}

function DateItem({ label, date }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{label}</span>
      <span className="text-[11px] font-bold text-slate-800 uppercase">
        {date ? new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'NOT SET'}
      </span>
    </div>
  );
}
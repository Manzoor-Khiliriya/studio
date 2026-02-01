import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  FiArrowLeft, FiEdit, FiTrash2, FiClock, 
  FiActivity, FiUsers, FiCalendar, FiHash, FiShield 
} from "react-icons/fi";
import { toast } from "react-hot-toast";

// RTK Query & Shared Components
import { useGetTaskDetailQuery, useDeleteTaskMutation } from "../services/taskApi";
import Loader from "../components/Loader";
import TaskModal from "../components/TaskModal";

export default function AdminTaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [editingTask, setEditingTask] = useState(null);

  // --- RTK QUERY ---
  const { data: task, isLoading, isError } = useGetTaskDetailQuery(id);
  const [deleteTask] = useDeleteTaskMutation();

  // --- CALCULATIONS ---
  const totalMinutesConsumed = task?.assignedTo?.reduce((acc, emp) => acc + (emp.totalMinutesConsumed || 0), 0) || 0;
  const consumedHours = (totalMinutesConsumed / 60).toFixed(1);
  const allocatedHours = (task?.allocatedTime / 60).toFixed(1);
  const estimatedHours = (task?.estimatedTime / 60).toFixed(1);

  const isOverBudget = totalMinutesConsumed > (task?.allocatedTime || 0);
  const progressPercent = task?.allocatedTime > 0 
    ? Math.round((totalMinutesConsumed / task.allocatedTime) * 100) 
    : 0;

  const handleDelete = async () => {
    if (!window.confirm("Are you sure? This action cannot be undone.")) return;
    try {
      await deleteTask(id).unwrap();
      toast.success("Task purged successfully");
      navigate("/tasks");
    } catch {
      toast.error("Deletion failed");
    }
  };

  if (isLoading) return <Loader message="Analyzing Task Footprint..." />;
  
  if (isError || !task) return (
    <div className="p-20 text-center">
      <p className="font-black text-slate-400 uppercase tracking-widest">Task footprint not found</p>
      <button onClick={() => navigate("/tasks")} className="mt-4 text-orange-600 font-bold uppercase text-xs hover:underline">Return to Hub</button>
    </div>
  );

  return (
    <div className="mx-auto pb-20 max-w-6xl px-4">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10 mt-10">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-orange-600 font-black text-xs uppercase tracking-widest hover:gap-4 transition-all mb-4"
          >
            <FiArrowLeft strokeWidth={3} /> Back to Hub
          </button>

          <h1 className="text-5xl font-black text-slate-900 tracking-tighter">{task.title}</h1>
          <div className="flex items-center gap-3 mt-4">
            <span className="flex items-center gap-2 bg-slate-900 text-white text-[10px] font-black px-4 py-1.5 rounded-lg uppercase">
              <FiHash className="text-orange-500" /> Project #{task.projectNumber}
            </span>
            <span className={`text-[10px] font-black uppercase px-4 py-1.5 rounded-lg border ${
              task.status === "Completed" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-orange-50 text-orange-700 border-orange-100"
            }`}>
              {task.status}
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setEditingTask(task)}
            className="flex items-center gap-2 bg-white border-2 border-slate-100 text-slate-600 hover:border-orange-600 hover:text-orange-600 transition-all px-6 py-4 rounded-2xl font-black text-sm shadow-sm"
          >
            <FiEdit /> Edit Details
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 bg-rose-50 text-rose-500 hover:bg-rose-600 hover:text-white transition-all px-6 py-4 rounded-2xl font-black text-sm shadow-sm"
          >
            <FiTrash2 /> Purge
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* DESCRIPTION */}
          <div className="bg-white rounded-[3rem] border-2 border-slate-50 shadow-sm p-10">
            <h3 className="text-orange-500 text-[10px] font-black uppercase tracking-[0.2em] mb-6">Detailed Explanation</h3>
            <p className="text-slate-600 leading-relaxed text-lg font-medium">
              {task.projectDetails || "No further explanation provided."}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 pt-10 border-t border-slate-50">
              <Info label="Assigned Date" value={task.createdAt} icon={<FiCalendar className="text-blue-500" />} />
              <Info label="Kickoff Date" value={task.startDate} icon={<FiCalendar className="text-emerald-500" />} />
              <Info label="Deadline" value={task.endDate} icon={<FiCalendar className="text-rose-500" />} />
            </div>
          </div>

          {/* RESOURCE CONSUMPTION */}
          <div className="bg-white rounded-[3rem] border-2 border-slate-50 shadow-sm p-10">
            <div className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-3">
                <FiUsers className="text-orange-500" size={24} />
                <h3 className="text-xl font-black text-slate-900">Personnel & Logs</h3>
              </div>
              <div className="text-right">
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">System Est. Time</span>
                <span className="text-2xl font-black text-slate-400">{estimatedHours}h</span>
              </div>
            </div>

            <div className="grid gap-4">
              {task.assignedTo?.map(log => (
                <div key={log._id} className="bg-slate-50/50 border border-slate-100 p-6 rounded-[2rem] flex flex-col md:flex-row justify-between items-center gap-4 hover:bg-white hover:shadow-md transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xl uppercase">
                      {log.employee?.name?.charAt(0)}
                    </div>
                    <div>
                      <span className="block font-black text-slate-900 text-lg uppercase">{log.employee?.name}</span>
                      <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Assigned Resource</span>
                    </div>
                  </div>

                  <div className="text-center md:text-right">
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Time Contributed</span>
                    <span className="text-xl font-black text-slate-900">
                      {Math.floor(log.totalMinutesConsumed / 60)}h {log.totalMinutesConsumed % 60}m
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: PERFORMANCE */}
        <div className="space-y-8">
          <div className={`rounded-[3rem] p-10 text-white shadow-2xl transition-colors duration-500 ${isOverBudget ? 'bg-rose-600' : 'bg-slate-900'}`}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-white/10 rounded-lg"><FiActivity className="text-white" /></div>
              <h3 className="font-black text-sm uppercase tracking-widest text-white/60">Budget Utilization</h3>
            </div>
            <p className="text-6xl font-black tracking-tighter mb-2">{progressPercent}%</p>
            <p className="text-white/60 text-xs font-bold leading-relaxed">
              {isOverBudget 
                ? "Operation has exceeded the allocated time budget set by admin." 
                : `Resources are currently at ${progressPercent}% of the ${allocatedHours}h budget.`
              }
            </p>
          </div>

          <div className="bg-white rounded-[3rem] border-2 border-slate-50 shadow-sm p-10">
            <div className="flex items-center gap-3 mb-6">
              <FiShield className="text-orange-500" size={20} />
              <h3 className="font-black text-slate-900 uppercase text-[10px] tracking-widest">Admin Allocation</h3>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-slate-900">{Math.floor(task.allocatedTime / 60)}h</span>
              <span className="text-xl font-bold text-slate-400">{task.allocatedTime % 60}m</span>
            </div>
            <div className="mt-6 h-3 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${isOverBudget ? 'bg-rose-500' : 'bg-emerald-500'}`}
                style={{ width: `${Math.min(progressPercent, 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between mt-4">
              <div className="text-left">
                <span className="block text-[8px] font-black text-slate-400 uppercase">Consumed</span>
                <span className={`text-xs font-black ${isOverBudget ? 'text-rose-600' : 'text-slate-900'}`}>{consumedHours}h</span>
              </div>
              <div className="text-right">
                <span className="block text-[8px] font-black text-slate-400 uppercase">Budget</span>
                <span className="text-xs font-black text-slate-900">{allocatedHours}h</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <TaskModal
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        editTask={editingTask}
      />
    </div>
  );
}

function Info({ label, value, icon }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-1">{icon}</div>
      <div>
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</h3>
        <p className="text-slate-900 font-black text-sm">
          {value ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '---'}
        </p>
      </div>
    </div>
  );
}
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  FiArrowLeft, FiEdit, FiTrash2, FiClock, 
  FiActivity, FiUsers, FiCalendar, FiHash, FiShield,
  FiAlertCircle, FiCheckCircle
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

  // --- DATA ACQUISITION ---
  const { data: task, isLoading, isError } = useGetTaskDetailQuery(id);
  const [deleteTask] = useDeleteTaskMutation();

  // --- TACTICAL CALCULATIONS ---
  const totalMinutesConsumed = task?.assignedTo?.reduce((acc, emp) => acc + (emp.totalMinutesConsumed || 0), 0) || 0;
  const consumedHours = (totalMinutesConsumed / 60).toFixed(1);
  const allocatedHours = (task?.allocatedTime / 60).toFixed(1);
  const estimatedHours = (task?.estimatedTime / 60).toFixed(1);

  const isOverBudget = totalMinutesConsumed > (task?.allocatedTime || 0);
  const progressPercent = task?.allocatedTime > 0 
    ? Math.round((totalMinutesConsumed / task.allocatedTime) * 100) 
    : 0;

  const handleDelete = async () => {
    if (!window.confirm("CONFIRM PURGE: This operation will permanently remove all logs associated with this mission ID.")) return;
    const toastId = toast.loading("Purging mission footprint...");
    try {
      await deleteTask(id).unwrap();
      toast.success("Mission purged from database", { id: toastId });
      navigate("/tasks");
    } catch {
      toast.error("Protocol failure: Could not delete task", { id: toastId });
    }
  };

  if (isLoading) return <Loader message="Decrypting Task Intel..." />;
  
  if (isError || !task) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-20 text-center">
      <FiAlertCircle size={48} className="text-rose-500 mb-6" />
      <p className="font-black text-slate-400 uppercase tracking-[0.3em]">Signal Lost: Task not found</p>
      <button onClick={() => navigate("/tasks")} className="mt-8 bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-orange-600 transition-all">Return to Command Hub</button>
    </div>
  );

  return (
    <div className="mx-auto pb-24 max-w-7xl px-8 pt-10">
      
      {/* NAVIGATION & ACTIONS */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-8 mb-12">
        <div className="space-y-4">
          <button
            onClick={() => navigate(-1)}
            className="group flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] hover:text-orange-600 transition-all"
          >
            <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" strokeWidth={3} /> Return to Mission List
          </button>

          <div className="flex items-center gap-4">
             <div className="w-3 h-12 bg-orange-500 rounded-full" />
             <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase">{task.title}</h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 bg-slate-900 text-white text-[9px] font-black px-4 py-2 rounded-xl uppercase tracking-widest shadow-lg shadow-slate-900/10">
              <FiHash className="text-orange-500" /> REF: {task.projectNumber || id.slice(-6)}
            </span>
            <span className={`text-[9px] font-black uppercase px-4 py-2 rounded-xl border-2 tracking-widest ${
              task.status === "Completed" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-orange-50 text-orange-700 border-orange-100"
            }`}>
              {task.status === "Completed" ? <FiCheckCircle className="inline mr-1" /> : <FiClock className="inline mr-1" />}
              Status: {task.status}
            </span>
          </div>
        </div>

        <div className="flex gap-4 w-full xl:w-auto">
          <button
            onClick={() => setEditingTask(task)}
            className="flex-1 xl:flex-none flex items-center justify-center gap-3 bg-white border-2 border-slate-100 text-slate-900 hover:border-orange-500 hover:text-orange-600 transition-all px-8 py-5 rounded-[1.8rem] font-black text-sm shadow-xl shadow-slate-200/50"
          >
            <FiEdit size={18} /> Modify Intel
          </button>
          <button
            onClick={handleDelete}
            className="flex-1 xl:flex-none flex items-center justify-center gap-3 bg-rose-50 text-rose-500 hover:bg-rose-600 hover:text-white transition-all px-8 py-5 rounded-[1.8rem] font-black text-sm shadow-xl shadow-rose-200/50"
          >
            <FiTrash2 size={18} /> Purge Task
          </button>
        </div>
      </div>

      <div className="grid xl:grid-cols-12 gap-10">
        
        {/* PRIMARY INTEL (LEFT/CENTER) */}
        <div className="xl:col-span-8 space-y-10">
          
          {/* DESCRIPTION CARD */}
          <div className="bg-white rounded-[4rem] border border-slate-100 shadow-sm p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                <FiHash size={120} />
            </div>
            
            <h3 className="text-orange-500 text-[10px] font-black uppercase tracking-[0.4em] mb-8 flex items-center gap-2">
               <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
               Mission Parameters
            </h3>
            
            <p className="text-slate-700 leading-relaxed text-2xl font-bold tracking-tight mb-12 italic">
              "{task.projectDetails || "No further tactical explanation provided by command."}"
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 py-10 border-t border-slate-50">
              <Info label="Data Ingress" value={task.createdAt} icon={<FiCalendar className="text-blue-500" />} />
              <Info label="Mission Start" value={task.startDate} icon={<FiCalendar className="text-emerald-500" />} />
              <Info label="Deadline/ETA" value={task.endDate} icon={<FiCalendar className="text-rose-500" />} />
            </div>
          </div>

          {/* PERSONNEL LOGS */}
          <div className="bg-white rounded-[4rem] border border-slate-100 shadow-sm p-12">
            <div className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-900 rounded-2xl text-orange-500 shadow-xl shadow-slate-900/20">
                    <FiUsers size={24} />
                </div>
                <div>
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Active Operators</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Personnel currently logging time</p>
                </div>
              </div>
              <div className="text-right hidden sm:block">
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Theoretical Baseline</span>
                <span className="text-3xl font-black text-slate-300 tracking-tighter">{estimatedHours}h</span>
              </div>
            </div>

            <div className="grid gap-6">
              {task.assignedTo?.length > 0 ? task.assignedTo.map(log => (
                <div key={log._id} className="group bg-slate-50/50 border border-slate-100 p-8 rounded-[2.5rem] flex flex-col md:flex-row justify-between items-center gap-6 hover:bg-white hover:border-orange-200 hover:shadow-2xl hover:shadow-orange-500/5 transition-all">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-slate-900 text-white flex items-center justify-center font-black text-2xl uppercase shadow-lg group-hover:bg-orange-600 transition-colors">
                      {log.employee?.name?.charAt(0)}
                    </div>
                    <div>
                      <span className="block font-black text-slate-900 text-xl uppercase tracking-tight">{log.employee?.name}</span>
                      <span className="text-[10px] font-black text-orange-600 uppercase tracking-[0.2em]">Operational Resource</span>
                    </div>
                  </div>

                  <div className="text-center md:text-right bg-white px-8 py-4 rounded-3xl border border-slate-100">
                    <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Time Logged</span>
                    <span className="text-2xl font-black text-slate-900">
                      {Math.floor(log.totalMinutesConsumed / 60)}h <span className="text-orange-500 text-lg">{log.totalMinutesConsumed % 60}m</span>
                    </span>
                  </div>
                </div>
              )) : (
                <div className="py-10 text-center border-2 border-dashed border-slate-100 rounded-[3rem]">
                    <p className="text-slate-400 font-black uppercase text-xs tracking-widest">No operators assigned to this sector</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PERFORMANCE SIDEBAR (RIGHT) */}
        <div className="xl:col-span-4 space-y-8">
          
          {/* STATUS MONITOR */}
          <div className={`rounded-[4rem] p-12 text-white shadow-2xl transition-all duration-700 relative overflow-hidden group ${isOverBudget ? 'bg-rose-600' : 'bg-slate-900'}`}>
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-white/10 rounded-2xl"><FiActivity className="text-white" size={20} /></div>
                <h3 className="font-black text-[10px] uppercase tracking-[0.3em] text-white/50">Capacity Monitor</h3>
                </div>
                <p className="text-7xl font-black tracking-tighter mb-4">{progressPercent}%</p>
                <div className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg w-fit mb-6 ${isOverBudget ? 'bg-white text-rose-600' : 'bg-orange-500 text-white'}`}>
                    {isOverBudget ? 'Over Budget Error' : 'Within Parameters'}
                </div>
                <p className="text-white/60 text-sm font-bold leading-relaxed italic">
                {isOverBudget 
                    ? "CRITICAL: Mission has exceeded the allocated time budget. Efficiency review required." 
                    : `System status nominal. Project is consuming ${progressPercent}% of the ${allocatedHours}h authorization.`
                }
                </p>
            </div>
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
          </div>

          {/* ALLOCATION ANALYTICS */}
          <div className="bg-white rounded-[4rem] border border-slate-100 shadow-sm p-12">
            <div className="flex items-center gap-3 mb-10">
              <div className="p-2 bg-orange-50 text-orange-500 rounded-xl"><FiShield size={18} /></div>
              <h3 className="font-black text-slate-900 uppercase text-[10px] tracking-widest">Resource Allocation</h3>
            </div>
            
            <div className="flex items-baseline gap-2 mb-8">
              <span className="text-6xl font-black text-slate-900 tracking-tighter">{Math.floor(task.allocatedTime / 60)}h</span>
              <span className="text-2xl font-black text-slate-300 tracking-tighter">{task.allocatedTime % 60}m</span>
            </div>

            <div className="space-y-6">
                <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden border-4 border-slate-50">
                <div 
                    className={`h-full transition-all duration-1000 rounded-full shadow-lg ${isOverBudget ? 'bg-rose-500 shadow-rose-500/20' : 'bg-emerald-500 shadow-emerald-500/20'}`}
                    style={{ width: `${Math.min(progressPercent, 100)}%` }}
                />
                </div>
                
                <div className="flex justify-between items-center bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                <div className="text-left">
                    <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Spent</span>
                    <span className={`text-lg font-black ${isOverBudget ? 'text-rose-600' : 'text-slate-900'}`}>{consumedHours}h</span>
                </div>
                <div className="w-px h-8 bg-slate-200" />
                <div className="text-right">
                    <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Limit</span>
                    <span className="text-lg font-black text-slate-900">{allocatedHours}h</span>
                </div>
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
    <div className="flex items-start gap-4 group">
      <div className="mt-1 p-2 bg-slate-50 rounded-xl group-hover:bg-white group-hover:shadow-md transition-all">{icon}</div>
      <div>
        <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</h3>
        <p className="text-slate-900 font-black text-base tracking-tight">
          {value ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'NOT SET'}
        </p>
      </div>
    </div>
  );
}
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

  // --- TACTICAL CALCULATIONS (Hours Logic) ---
  const progressPercent = task?.progressPercent || 0;
  
  // Backend sends hours directly
  const consumedHours = Number(task?.totalConsumedHours || 0);
  const allocatedHours = Number(task?.allocatedTime || 0);
  const estimatedHours = Number(task?.estimatedTime || 0);

  const isOverBudget = consumedHours > allocatedHours;

  /**
   * Converts decimal hours to an object with hours and minutes
   * e.g. 1.5 -> { h: 1, m: 30 }
   */
  const formatTacticalTime = (decimalHours) => {
    const h = Math.floor(decimalHours);
    const m = Math.round((decimalHours - h) * 60);
    return { h, m };
  };

  const consumed = formatTacticalTime(consumedHours);
  const allocated = formatTacticalTime(allocatedHours);

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
            className="group flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] hover:text-orange-600 transition-all cursor-pointer"
          >
            <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" strokeWidth={3} /> Return to Mission List
          </button>

          <div className="flex items-center gap-4">
            <div className="w-3 h-12 bg-orange-500 rounded-full shadow-[0_0_15px_rgba(249,115,22,0.4)]" />
            <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none">{task.title}</h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 bg-slate-900 text-white text-[9px] font-black px-4 py-2 rounded-xl uppercase tracking-widest shadow-lg shadow-slate-900/10">
              <FiHash className="text-orange-500" /> REF: {task.projectNumber || id.slice(-6)}
            </span>
            <span className={`text-[9px] font-black uppercase px-4 py-2 rounded-xl border-2 tracking-widest flex items-center gap-2 ${task.status === "Completed" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-orange-50 text-orange-700 border-orange-100"
              }`}>
              {task.status === "Completed" ? <FiCheckCircle /> : <FiClock className="animate-spin-slow" />}
              Status: {task.status}
            </span>
          </div>
        </div>

        <div className="flex gap-4 w-full xl:w-auto">
          <button
            onClick={() => setEditingTask(task)}
            className="flex-1 xl:flex-none flex items-center justify-center gap-3 bg-yellow-50 text-yellow-500 hover:bg-yellow-600 hover:text-white cursor-pointer transition-all px-8 py-5 rounded-[1.8rem] font-black text-sm shadow-xl"
          >
            <FiEdit size={18} /> Update Task
          </button>
          <button
            onClick={handleDelete}
            className="flex-1 xl:flex-none flex items-center justify-center gap-3 bg-rose-50 text-red-500 hover:bg-red-600 hover:text-white cursor-pointer transition-all px-8 py-5 rounded-[1.8rem] font-black text-sm shadow-xl"
          >
            <FiTrash2 size={18} /> Delete Task
          </button>
        </div>
      </div>

      <div className="grid xl:grid-cols-12 gap-10">

        {/* PRIMARY INTEL (LEFT) */}
        <div className="xl:col-span-8 space-y-10">

          {/* DESCRIPTION CARD */}
          <div className="bg-white rounded-[4rem] border border-slate-100 shadow-sm p-12 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover:opacity-[0.05] transition-opacity">
              <FiHash size={150} />
            </div>

            <h3 className="text-orange-500 text-[10px] font-black uppercase tracking-[0.4em] mb-8 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
              Mission Parameters
            </h3>

            <p className="text-slate-800 leading-relaxed text-2xl font-bold tracking-tight mb-12 italic">
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
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Personnel contribution logs</p>
                </div>
              </div>
              <div className="text-right hidden sm:block">
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Baseline Est.</span>
                <span className="text-3xl font-black text-slate-300 tracking-tighter">{estimatedHours.toFixed(1)}h</span>
              </div>
            </div>

            <div className="grid gap-4">
              {task.assignedTo?.length > 0 ? task.assignedTo.map(emp => {
                const empConsumed = formatTacticalTime(emp.totalConsumedHours || 0);
                return (
                  <div key={emp._id} className="group bg-slate-50/50 border border-slate-100 p-6 rounded-[2.5rem] flex flex-col md:flex-row justify-between items-center gap-6 hover:bg-white hover:border-orange-200 hover:shadow-2xl hover:shadow-orange-500/5 transition-all">
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 rounded-[1.2rem] bg-slate-900 text-white flex items-center justify-center font-black text-xl uppercase shadow-lg group-hover:bg-orange-600 transition-colors">
                        {emp.user?.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="block font-black text-slate-900 text-lg uppercase tracking-tight">{emp.user?.name}</span>
                        <span className="text-[9px] font-black text-orange-600 uppercase tracking-[0.2em]">
                          Operator ID: {emp._id.slice(-4)}
                        </span>
                      </div>
                    </div>

                    <div className="text-center md:text-right bg-white px-6 py-3 rounded-2xl border border-slate-100 group-hover:border-orange-100 transition-colors">
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Sector Contribution</span>
                      <span className="text-xl font-black text-slate-900">
                        {empConsumed.h}h <span className="text-orange-500 text-base">{empConsumed.m}m</span>
                      </span>
                    </div>
                  </div>
                );
              }) : (
                <div className="py-16 text-center border-2 border-dashed border-slate-100 rounded-[3rem] bg-slate-50/30">
                  <FiShield className="mx-auto text-slate-200 mb-4" size={32} />
                  <p className="text-slate-400 font-black uppercase text-xs tracking-widest">No active operators detected</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PERFORMANCE SIDEBAR (RIGHT) */}
        <div className="xl:col-span-4 space-y-8">

          {/* STATUS MONITOR */}
          <div className={`rounded-[4rem] p-10 text-white shadow-2xl transition-all duration-700 relative overflow-hidden group ${isOverBudget ? 'bg-rose-600 shadow-rose-500/20' : 'bg-slate-900 shadow-slate-900/20'}`}>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-white/10 rounded-2xl"><FiActivity className="text-white" size={20} /></div>
                <h3 className="font-black text-[10px] uppercase tracking-[0.3em] text-white/50">Capacity Monitor</h3>
              </div>
              <p className="text-7xl font-black tracking-tighter mb-4 leading-none">{progressPercent}%</p>
              <div className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg w-fit mb-6 shadow-sm ${isOverBudget ? 'bg-white text-rose-600' : 'bg-orange-500 text-white'}`}>
                {isOverBudget ? 'Budget Depleted' : 'Nominal Efficiency'}
              </div>
              <p className="text-white/60 text-xs font-bold leading-relaxed italic border-t border-white/10 pt-6">
                {isOverBudget
                  ? `ALERT: Mission has exceeded the allocated time budget by ${(consumedHours - allocatedHours).toFixed(1)} hours.`
                  : `Current utilization is within authorized limits. Authorized cap: ${allocatedHours.toFixed(1)}h.`
                }
              </p>
            </div>
            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-colors duration-700" />
          </div>

          {/* ALLOCATION ANALYTICS */}
          <div className="bg-white rounded-[4rem] border border-slate-100 shadow-sm p-10">
            <div className="flex items-center gap-3 mb-10">
              <div className="p-2 bg-orange-50 text-orange-500 rounded-xl"><FiShield size={18} /></div>
              <h3 className="font-black text-slate-900 uppercase text-[10px] tracking-widest">Time Authorization</h3>
            </div>

            <div className="flex items-baseline gap-2 mb-8">
              <span className="text-6xl font-black text-slate-900 tracking-tighter">{allocated.h}h</span>
              <span className="text-2xl font-black text-slate-300 tracking-tighter">{allocated.m}m</span>
            </div>

            <div className="space-y-6">
              <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden border-2 border-slate-50 relative">
                <div
                  className={`h-full transition-all duration-1000 rounded-full ${isOverBudget ? 'bg-rose-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(progressPercent, 100)}%` }}
                />
              </div>

              <div className="flex justify-between items-center bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                <div className="text-left">
                  <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Spent</span>
                  <span className={`text-lg font-black ${isOverBudget ? 'text-rose-600' : 'text-slate-900'}`}>{consumedHours.toFixed(1)}h</span>
                </div>
                <div className="w-px h-8 bg-slate-200" />
                <div className="text-right">
                  <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Quota</span>
                  <span className="text-lg font-black text-slate-900">{allocatedHours.toFixed(1)}h</span>
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
      <div className="mt-1 p-2 bg-slate-50 rounded-xl group-hover:bg-white group-hover:shadow-md transition-all border border-transparent group-hover:border-slate-100">{icon}</div>
      <div>
        <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</h3>
        <p className="text-slate-900 font-black text-base tracking-tight">
          {value ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'NOT SET'}
        </p>
      </div>
    </div>
  );
}
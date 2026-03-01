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
  HiOutlineBolt
} from "react-icons/hi2";
import { toast } from "react-hot-toast";

// RTK Query & Shared Components
import { useGetTaskDetailQuery, useDeleteTaskMutation } from "../../services/taskApi";
import Loader from "../../components/Loader";
import TaskModal from "../../components/TaskModal";
import ConfirmModal from "../../components/ConfirmModal";

export default function AdminTaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [editingTask, setEditingTask] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const { data: task, isLoading, isError } = useGetTaskDetailQuery(id);
  const [deleteTask, { isLoading: isDeleting }] = useDeleteTaskMutation();

  // --- DATA MAPPING FROM MONGOOSE VIRTUALS ---
  // These use the virtuals defined in your Mongoose schema
  const consumed = task?.totalConsumedHours || 0;
  const allocated = task?.allocatedTime || 0;
  const progressPercent = task?.progressPercent || 0;
  const isOver = consumed > allocated;

  const handleConfirmDelete = async () => {
    try {
      await deleteTask(id).unwrap();
      toast.success("Task record purged from system.");
      navigate("/tasks");
    } catch (err) {
      toast.error(err?.data?.message || "Purge protocol failed.");
    } finally {
      setIsDeleteModalOpen(false);
    }
  };

  if (isLoading) return <Loader />;

  if (isError || !task) return (
    <div className="flex flex-col items-center justify-center p-20 text-center">
      <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Mission Data Not Found</p>
      <button onClick={() => navigate("/tasks")} className="mt-4 text-orange-600 font-bold text-xs uppercase tracking-widest">
        Return to Task List
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/30 pb-20">
      <header className="bg-white border-b border-slate-200 pt-8 pb-10">
        <div className="max-w-[1600px] mx-auto px-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-400 hover:text-orange-600 font-bold uppercase text-[10px] tracking-[0.2em] mb-6 transition-all group cursor-pointer"
          >
            <HiOutlineArrowLeft className="group-hover:-translate-x-1" /> Back to Dashboard
          </button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <span className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-orange-500 font-black text-3xl italic shadow-xl">
                {task.title?.charAt(0)}
              </span>
              <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-3">
                  {task.title}
                </h1>
                <div className="flex flex-wrap items-center gap-2">
                  {/* Live Status */}
                  <Badge 
                    icon={<HiOutlineBolt size={10} />}
                    text={task.liveStatus}
                    className={task.liveStatus === "In progress" ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-indigo-50 text-indigo-500 border-indigo-100"}
                  />
                  {/* Process Status */}
                  <Badge 
                    text={task.status}
                    className={task.status === "Completed" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-purple-50 text-purple-600 border-purple-100"}
                  />
                  {/* Priority */}
                  <Badge 
                    text={task.priority}
                    className={`${task.priority === "High" ? "bg-rose-50 text-rose-600 border-rose-100 animate-pulse" : "bg-amber-50 text-amber-600 border-amber-100"}`}
                  />
                  {/* Active Phase */}
                  <Badge 
                    text={task.activeStatus}
                    className="bg-slate-900 text-white border-slate-900"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setEditingTask(task)}
                className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-5 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:border-orange-500 hover:text-orange-600 transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <HiOutlinePencilSquare size={16} /> Update Task
              </button>
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="flex items-center gap-2 bg-rose-50 text-rose-600 px-5 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all cursor-pointer active:scale-95"
              >
                <HiOutlineTrash size={16} /> Purge
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-8 -mt-6">
        <div className="grid lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-8 space-y-8">
            {/* Metric Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricBox label="Time Spent" value={`${consumed}h`} icon={<HiOutlineClock />} />
              <MetricBox label="Estimate" value={`${task.estimatedTime}h`} icon={<HiOutlinePencilSquare />} />
              <MetricBox label="Allocated" value={`${allocated}h`} icon={<HiOutlineCalendarDays />} />
              <MetricBox
                label="Efficiency"
                value={isOver ? "Overload" : "Nominal"}
                color={isOver ? "text-rose-600" : "text-emerald-600"}
              />
            </div>

            {/* Project Context */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Project Association</p>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">
                {task.project?.title || "Standalone Task"}
              </h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed italic">
                {task.project?.description || "No project briefing available."}
              </p>
            </div>

            {/* Operators Table */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <HiOutlineUserGroup className="text-orange-500" /> Assigned Personnel
                </h3>
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/30">
                    <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Operator</th>
                    <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Contribution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {task.assignedTo?.map((emp) => {
                    // Logic to calculate individual hours from the virtual timeLogs array
                    const empHours = task.timeLogs
                      ?.filter(log => log.employee === emp._id || log.employee?._id === emp._id)
                      .reduce((sum, log) => sum + (log.durationSeconds || 0), 0) / 3600;

                    return (
                      <tr key={emp._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center font-black text-xs border border-slate-200 uppercase">
                              {emp.user?.name?.charAt(0)}
                            </div>
                            <span className="text-xs font-black text-slate-700 uppercase tracking-tight">
                              {emp.user?.name || "System User"}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <span className="text-sm font-black text-slate-900">{empHours.toFixed(2)}h</span>
                        </td>
                      </tr>
                    );
                  })}
                  {!task.assignedTo?.length && (
                    <tr>
                      <td colSpan="2" className="px-8 py-10 text-center text-slate-400 text-[10px] font-black uppercase">No operators assigned to this objective</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-8">
            {/* Progress Visualization */}
            <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Completion Status</p>
                <div className="flex items-baseline gap-2 mb-8">
                  <span className="text-7xl font-black tracking-tighter italic">{progressPercent}</span>
                  <span className="text-2xl font-bold text-orange-500">%</span>
                </div>
                <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-1000 ${isOver ? 'bg-rose-500' : 'bg-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.4)]'}`}
                    style={{ width: `${Math.min(progressPercent, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Timeline Details */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 border-b border-slate-50 pb-4">Mission Timeline</p>
              <div className="space-y-5">
                <DateItem label="Creation" date={task.createdAt} />
                <DateItem label="Project Start" date={task.project?.startDate} />
                <DateItem label="Project End" date={task.project?.endDate} />
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

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="Delete Task Record"
        message={`Are you sure you want to purge "${task?.title}"? This will permanently delete all associated time logs from the database.`}
        confirmText="Confirm Delete"
        variant="danger"
      />
    </div>
  );
}

// --- SUB-COMPONENTS ---

function Badge({ icon, text, className }) {
  return (
    <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-tighter border shadow-sm flex items-center gap-1 ${className}`}>
      {icon} {text}
    </span>
  );
}

function MetricBox({ label, value, icon, color = "text-slate-900" }) {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm transition-transform hover:scale-[1.02]">
      <div className="flex items-center gap-2 mb-3 text-slate-400">
        {icon && React.cloneElement(icon, { size: 14 })}
        <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <p className={`text-xl font-black tracking-tight italic ${color}`}>{value}</p>
    </div>
  );
}

function DateItem({ label, date }) {
  return (
    <div className="flex justify-between items-center group">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter group-hover:text-slate-600 transition-colors">{label}</span>
      <span className="text-[11px] font-bold text-slate-800 uppercase">
        {date ? new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Pending'}
      </span>
    </div>
  );
}
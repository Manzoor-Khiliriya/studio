import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  HiOutlineArrowLeft,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineClock,
  HiOutlineUserGroup,
  HiOutlineCalendarDays,
  HiOutlineBolt,
  HiOutlineChartPie,
  HiOutlineClipboardDocumentList,
  HiCheckBadge,
} from "react-icons/hi2";
import { toast } from "react-hot-toast";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

// RTK Query & Shared Components
import { useGetTaskDetailQuery, useDeleteTaskMutation } from "../../services/taskApi";
import Loader from "../../components/Loader";
import ConfirmModal from "../../components/ConfirmModal";

// --- UTILITY ---
const formatToHrMin = (totalSeconds) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours.toString().padStart(2, "0")}h ${minutes.toString().padStart(2, "0")}m`;
};

const getOperatorColor = (index) => {
  const palette = ["#f97316", "#8b5cf6", "#ec4899", "#06b6d4", "#10b981", "#f59e0b", "#6366f1"];
  return palette[index % palette.length];
};

export default function AdminTaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const { data: task, isLoading, isError } = useGetTaskDetailQuery(id);
  const [deleteTask, { isLoading: isDeleting }] = useDeleteTaskMutation();

  const stats = task?.stats;
  const consumed = task?.totalConsumedHours || 0;
  const estimate = task?.estimatedTime || 0;
  const allocated = task?.allocatedTime || 0;
  const progressPercent = task?.progressPercent || 0;
  const isOver = consumed > allocated;

  // Time Distribution Data (Keep in Hours for primary status)
  const timeData = [
    { name: "Consumed", value: consumed },
    { name: "Remaining", value: Math.max(allocated - consumed, 0) },
  ];

  // UPDATED: Contributor data now uses Minutes for the Pie Chart
  const employeePieData = (stats?.historicalContributors || [])
    .filter((op) => op.seconds > 0)
    .map((op) => ({
      name: op.name,
      value: Math.floor(op.seconds / 60) // Convert seconds to minutes
    }));

  const handleConfirmDelete = async () => {
    try {
      await deleteTask(id).unwrap();
      toast.success("Task record deleted.");
      navigate("/projects");
    } catch (err) {
      toast.error(err?.data?.message || "Delete failed.");
    } finally {
      setIsDeleteModalOpen(false);
    }
  };

  if (isLoading) return <Loader />;
  if (isError || !task) return <div className="p-20 text-center font-black uppercase text-slate-400 tracking-widest">Task Not Found</div>;

  return (
    <div className="min-h-screen bg-slate-50/30 pb-20">
      <header className="bg-white border-b border-slate-200 pt-8 pb-10">
        <div className="max-w-[1600px] mx-auto px-8">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-orange-600 font-bold uppercase text-[10px] tracking-widest mb-6 border-none bg-transparent cursor-pointer transition-all">
            <HiOutlineArrowLeft /> Back to Dashboard
          </button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <span className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-orange-500 font-black text-3xl italic shadow-xl">
                {task.title?.charAt(0)}
              </span>
              <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-3 leading-none">{task.title}</h1>
                <div className="flex flex-wrap gap-2">
                  <Badge icon={<HiOutlineBolt size={10} />} text={task.liveStatus} className="bg-blue-50 text-blue-600 border-blue-100" />
                  <Badge text={task.status} className="bg-emerald-50 text-emerald-600 border-emerald-100" />
                  <Badge text={task.priority} className={task.priority === "High" ? "bg-rose-50 text-rose-600 animate-pulse border-rose-100" : "bg-amber-50 text-amber-600 border-amber-100"} />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setIsDeleteModalOpen(true)} className="bg-rose-50 text-rose-600 px-5 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-600 hover:text-white cursor-pointer transition-all active:scale-95">
                <HiOutlineTrash className="inline mr-2" /> Delete Task
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-8 -mt-6">
        <div className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricBox label="Time Spent" value={`${consumed.toFixed(2)}h`} icon={<HiOutlineClock />} />
              <MetricBox label="Estimate" value={`${estimate}h`} icon={<HiOutlineCalendarDays />} />
              <MetricBox label="Allocated" value={`${allocated}h`} icon={<HiOutlineCalendarDays />} />
              <MetricBox label="Efficiency" value={isOver ? "Overload" : "Nominal"} color={isOver ? "text-rose-600" : "text-emerald-600"} />
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <HiOutlineChartPie className="text-orange-500" /> Time Distribution
                </h3>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={timeData} dataKey="value" nameKey="name" innerRadius={80} outerRadius={140} paddingAngle={8} stroke="none">
                        <Cell fill="#0f172a" />
                        <Cell fill="#f1f5f9" />
                      </Pie>
                      <Tooltip formatter={(v) => `${v.toFixed(2)}h`} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute top-[58%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                    <span className="text-4xl font-black text-slate-900 leading-none">{progressPercent}%</span>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Burned</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <HiOutlineUserGroup className="text-orange-500" /> Contributor Split (Mins)
                </h3>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={employeePieData} dataKey="value" nameKey="name" innerRadius={80} outerRadius={140} paddingAngle={4} stroke="none">
                        {employeePieData.map((op, i) => (
                          <Cell key={i} fill={getOperatorColor(i)} />
                        ))}
                      </Pie>
                      {/* Formatter shows "mins" now */}
                      <Tooltip formatter={(v) => `${v} mins`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <HiOutlineClock className="text-orange-500" /> Performance Analysis (All Records)
                </h3>
                <span className="text-[9px] font-black text-slate-400 uppercase bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                  {stats?.totalHistoricalContributors || 0} Total Contributors
                </span>
              </div>
              <div className="p-8 space-y-8">
                {stats?.historicalContributors?.length > 0 ? (
                  stats.historicalContributors.map((op, idx) => (
                    <div key={op.id} className="space-y-3 group">
                      <div className="flex justify-between items-end">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{op.code}</span>
                            {op.isCurrentlyAssigned && (
                              <span className="bg-emerald-50 text-emerald-600 text-[7px] font-black uppercase px-1.5 py-0.5 rounded border border-emerald-100 flex items-center gap-1">
                                <HiCheckBadge size={8} /> Currently Assigned
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-black text-slate-900 uppercase group-hover:text-orange-600 transition-colors">{op.name}</h4>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-black text-slate-900 bg-slate-100 px-2 py-1 rounded-md">{formatToHrMin(op.seconds)}</span>
                        </div>
                      </div>
                      <div className="relative w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${op.percentage}%`, backgroundColor: getOperatorColor(idx) }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-10 text-center text-[10px] font-black text-slate-300 uppercase italic">No logged activity found.</div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center justify-between">
                Active Employees
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </h3>
              <div className="space-y-3">
                {task.assignedTo?.length > 0 ? (
                  task.assignedTo.map((emp) => (
                    <div key={emp.user?._id} className="flex items-center gap-4 p-3 rounded-2xl border border-slate-50 bg-slate-50/30">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white text-xs font-black uppercase italic">
                        {emp.user?.name?.charAt(0)}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[11px] font-black text-slate-900 uppercase truncate">{emp.user?.name}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                          {emp.user?.employeeCode || "N/A"}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] font-black text-slate-300 uppercase italic text-center py-4">No active personnel assigned.</p>
                )}
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                <HiOutlineClipboardDocumentList size={14} className="text-orange-500" /> Task Description
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                {task.description || "No tactical description provided."}
              </p>
            </div>

            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Mission Timeline</h3>
              <div className="space-y-4">
                <MetaItem label="Created On" value={new Date(task.createdAt).toLocaleDateString()} />
                <MetaItem label="Project Start" value={task?.project?.startDate ? new Date(task.project.startDate).toLocaleDateString() : "TBD"} />
                <MetaItem label="Project End" value={task?.project?.endDate ? new Date(task.project.endDate).toLocaleDateString() : "TBD"} />
              </div>
            </div>
          </div>
        </div>
      </main>

      <ConfirmModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleConfirmDelete} isLoading={isDeleting} title="Purge Task" message="Warning: This will permanently remove all time logs and metrics. Proceed?" variant="danger" />
    </div>
  );
}

// --- HELPERS ---
function MetricBox({ label, value, icon, color = "text-slate-900" }) {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
      <div className="flex items-center gap-2 mb-3 text-slate-400">
        {icon && React.cloneElement(icon, { size: 14 })}
        <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <p className={`text-2xl font-black tracking-tight ${color}`}>{value}</p>
    </div>
  );
}

function Badge({ text, className, icon }) {
  return (
    <span className={`px-3 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 ${className}`}>
      {icon} {text}
    </span>
  );
}

function MetaItem({ label, value }) {
  return (
    <div className="flex justify-between items-center border-b border-white/10 pb-3">
      <span className="text-[9px] font-black text-slate-500 uppercase">{label}</span>
      <span className="text-[10px] font-bold text-slate-200">{value}</span>
    </div>
  );
}
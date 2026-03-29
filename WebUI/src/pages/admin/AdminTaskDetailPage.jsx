import React, { useState, useMemo } from "react";
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
  HiOutlineUserPlus,
  HiOutlineArrowPath,
} from "react-icons/hi2";
import { toast } from "react-hot-toast";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { useGetTaskDetailQuery, useDeleteTaskMutation } from "../../services/taskApi";
import Loader from "../../components/Loader";
import ConfirmModal from "../../components/ConfirmModal";
import EmployeeAssignModal from "../../components/EmployeeAssignModal";
import StatusUpdateModal from "../../components/StatusUpdateModal";
import TaskModal from "../../components/TaskModal";

// --- UTILITY: FORMAT SECONDS TO HH:MM:SS ---
const formatToHMS = (totalSeconds) => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${h.toString().padStart(2, "0")}h ${m.toString().padStart(2, "0")}m ${s.toString().padStart(2, "0")}s`;
};

const getOperatorColor = (index) => {
  const palette = ["#f97316", "#8b5cf6", "#ec4899", "#06b6d4", "#10b981", "#f59e0b", "#6366f1"];
  return palette[index % palette.length];
};

export default function AdminTaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Modal States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // API Hooks
  const { data: task, isLoading, isError } = useGetTaskDetailQuery(id);
  const [deleteTask, { isLoading: isDeleting }] = useDeleteTaskMutation();

  // Derived Values (Memoized for performance)
  const { consumedSec, allocatedSec, timeData, employeePieData } = useMemo(() => {
    if (!task) return { consumedSec: 0, allocatedSec: 0, timeData: [], employeePieData: [] };

    const cSec = (task.totalConsumedHours || 0) * 3600;
    const aSec = (task.allocatedTime || 0) * 3600;

    // Time Distribution Chart Data
    const tData = [
      { name: "Consumed", value: cSec },
      { name: "Remaining", value: Math.max(aSec - cSec, 0) },
    ];

    // Contributor Split Chart Data
    const eData = (task.stats?.historicalContributors || [])
      .filter((op) => op.seconds > 0)
      .map((op) => ({
        name: op.name,
        value: op.seconds, // Keep as seconds for the HMS formatter
      }));

    return { consumedSec: cSec, allocatedSec: aSec, timeData: tData, employeePieData: eData };
  }, [task]);

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

  const isOver = (task.totalConsumedHours || 0) > (task.allocatedTime || 0);

  return (
    <div className="min-h-screen bg-slate-50/30 pb-20">
      <header className="bg-white border-b border-slate-200 pt-8 pb-10">
        <div className="max-w-[1600px] mx-auto px-8">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-orange-600 font-bold uppercase text-[10px] tracking-widest mb-6 border-none bg-transparent cursor-pointer transition-all group">
            <HiOutlineArrowLeft className="group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
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
              <HeaderButton onClick={() => setIsStatusModalOpen(true)} icon={<HiOutlineArrowPath size={18} />} text="Update Status" />
              <HeaderButton onClick={() => setIsEditModalOpen(true)} icon={<HiOutlinePencilSquare size={18} />} text="Update Task" />
              <HeaderButton onClick={() => setIsDeleteModalOpen(true)} icon={<HiOutlineTrash size={18} />} text="Delete Task" variant="danger" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-8 -mt-6">
        <div className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            {/* KPI Section */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricBox label="Time Spent" value={formatToHMS(consumedSec)} icon={<HiOutlineClock />} />
              <MetricBox label="Estimate" value={`${task.estimatedTime || 0}h`} icon={<HiOutlineCalendarDays />} />
              <MetricBox label="Allocated" value={`${task.allocatedTime || 0}h`} icon={<HiOutlineCalendarDays />} />
              <MetricBox label="Efficiency" value={isOver ? "Overload" : "Nominal"} color={isOver ? "text-rose-600" : "text-emerald-600"} />
            </div>

            {/* Charts Section */}
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden min-h-[400px]">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <HiOutlineChartPie className="text-orange-500" /> Time Distribution
                </h3>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={timeData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={80}
                        outerRadius={120}
                        paddingAngle={2}
                        stroke="none"
                        // Add a slight animation for better UX
                        animationBegin={0}
                        animationDuration={800}
                      >
                        {/* CONSUMED: Dark Slate */}
                        <Cell fill="#0f172a" />

                        {/* REMAINING: Medium Gray (More visible than f1f5f9) */}
                        <Cell fill="#94a3b8" />
                      </Pie>
                      <Tooltip
                        // Customizing tooltip style for better readability
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 'bold' }}
                        formatter={(value) => formatToHMS(value)}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Center Text */}
                  <div className="absolute top-[58%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                    <span className="text-4xl font-black text-slate-900 leading-none">
                      {task.progressPercent || 0}%
                    </span>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">
                      Burned
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <HiOutlineUserGroup className="text-orange-500" /> Contributor Split
                </h3>
                <div className="h-[280px]">
                  {employeePieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={employeePieData} dataKey="value" nameKey="name" innerRadius={80} outerRadius={120} paddingAngle={2} stroke="none">
                          {employeePieData.map((op, i) => (
                            <Cell key={i} fill={getOperatorColor(i)} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 'bold' }}
                          formatter={(value) => formatToHMS(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-[10px] font-black text-slate-300 uppercase italic">No data to display</div>
                  )}
                </div>
              </div>
            </div>

            {/* Performance Analysis List */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <HiOutlineClock className="text-orange-500" /> Performance Analysis (All Records)
                </h3>
                <span className="text-[9px] font-black text-slate-400 uppercase bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                  {task.stats?.totalHistoricalContributors || 0} Total Contributors
                </span>
              </div>
              <div className="p-8 space-y-8">
                {task.stats?.historicalContributors?.length > 0 ? (
                  task.stats.historicalContributors.map((op, idx) => (
                    <div key={op.id || idx} className="space-y-3 group">
                      <div className="flex justify-between items-end">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 mb-1">
                            {op.isCurrentlyAssigned && (
                              <span className="bg-emerald-50 text-emerald-600 text-[7px] font-black uppercase px-1.5 py-0.5 rounded border border-emerald-100 flex items-center gap-1">
                                <HiCheckBadge size={8} /> Currently Assigned
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-black text-slate-900 uppercase group-hover:text-orange-600 transition-colors">
                            {op.name} {op.code && `(${op.code})`}
                          </h4>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-black text-slate-900 bg-slate-100 px-2 py-1 rounded-md">{formatToHMS(op.seconds)}</span>
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
            {/* Team Management */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  Active Employees
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                </h3>
                <button
                  onClick={() => setIsAssignModalOpen(true)}
                  className="p-2 bg-orange-50 text-orange-600 rounded-xl hover:bg-orange-600 hover:text-white transition-all cursor-pointer shadow-sm border border-orange-100"
                >
                  <HiOutlineUserPlus size={18} />
                </button>
              </div>
              <div className="space-y-3">
                {task.assignedTo?.length > 0 ? (
                  task.assignedTo.map((emp) => (
                    <div key={emp.user?._id} className="flex items-center gap-4 p-3 rounded-2xl border border-slate-50 bg-slate-100">
                      <span className="text-[11px] font-black text-slate-900 uppercase truncate">
                        {emp.user?.name} {emp.user?.employee?.employeeCode ? `(${emp.user.employee.employeeCode})` : ""}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] font-black text-slate-300 uppercase italic text-center py-4">No active personnel assigned.</p>
                )}
              </div>
            </div>

            {/* Tactical Info */}
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

      {/* Modals */}
      <ConfirmModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleConfirmDelete} isLoading={isDeleting} title="Purge Task" message="Warning: This will permanently remove all time logs and metrics. Proceed?" variant="danger" />
      <EmployeeAssignModal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} task={task} />
      <StatusUpdateModal isOpen={isStatusModalOpen} onClose={() => setIsStatusModalOpen(false)} task={task} />
      <TaskModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} editTask={task} singleProject={task.project} />
    </div>
  );
}

// --- SMALL SUB-COMPONENTS FOR CLEANER JSX ---

function HeaderButton({ onClick, icon, text, variant = "primary" }) {
  const styles = variant === "danger"
    ? "bg-slate-900 hover:bg-rose-600"
    : "bg-slate-900 hover:bg-orange-600";

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 text-white px-5 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-sm active:scale-95 cursor-pointer ${styles}`}
    >
      {icon} {text}
    </button>
  );
}

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
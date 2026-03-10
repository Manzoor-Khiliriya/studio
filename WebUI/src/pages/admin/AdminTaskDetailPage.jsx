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
  HiOutlineChartPie
} from "react-icons/hi2";
import { toast } from "react-hot-toast";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

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

  // --- DATA MAPPING ---
  const consumed = task?.totalConsumedHours || 0;
  const allocated = task?.allocatedTime || 0;
  const progressPercent = task?.progressPercent || 0;
  const isOver = consumed > allocated;

  // Chart 1: Time Consumption Data
  const timeData = [
    { name: "Consumed", value: consumed },
    { name: "Remaining", value: Math.max(allocated - consumed, 0) }
  ];

  // Chart 2: Employee Contribution Logic
  const employeePieData = useMemo(() => {
    if (!task?.assignedTo) return [];

    return task.assignedTo.map((emp) => {
      const empHours = task.timeLogs
        ?.filter(
          (log) =>
            (log.user?._id === emp.user?._id || log.user === emp.user?._id) &&
            log.logType === "work"
        )
        .reduce((sum, log) => sum + (log.durationSeconds || 0), 0) / 3600;

      return {
        name: emp.user?.name || "Operator",
        value: parseFloat(empHours.toFixed(2))
      };
    }).filter(data => data.value > 0);
  }, [task]);

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

  const TIME_COLORS = ["#0f172a", "#f1f5f9"];
  const EMP_COLORS = ["#f97316", "#8b5cf6", "#ec4899", "#06b6d4", "#10b981"];

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
                  <Badge icon={<HiOutlineBolt size={10} />} text={task.liveStatus} className="bg-blue-50 text-blue-600 border-blue-100" />
                  <Badge text={task.status} className="bg-emerald-50 text-emerald-600 border-emerald-100" />
                  <Badge text={task.priority} className={task.priority === "High" ? "bg-rose-50 text-rose-600 border-rose-100 animate-pulse" : "bg-amber-50 text-amber-600 border-amber-100"} />
                  <Badge text={task.activeStatus} className="bg-slate-900 text-white border-slate-900" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={() => setEditingTask(task)} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-5 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:border-orange-500 transition-all cursor-pointer shadow-sm active:scale-95">
                <HiOutlinePencilSquare size={16} /> Update Task
              </button>
              <button onClick={() => setIsDeleteModalOpen(true)} className="flex items-center gap-2 bg-rose-50 text-rose-600 px-5 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all cursor-pointer active:scale-95">
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
              <MetricBox label="Time Spent" value={`${consumed.toFixed(2)}h`} icon={<HiOutlineClock />} />
              <MetricBox label="Estimate" value={`${task.estimatedTime}h`} icon={<HiOutlinePencilSquare />} />
              <MetricBox label="Allocated" value={`${allocated}h`} icon={<HiOutlineCalendarDays />} />
              <MetricBox label="Efficiency" value={isOver ? "Overload" : "Nominal"} color={isOver ? "text-rose-600" : "text-emerald-600"} />
            </div>

            {/* Charts Section */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* Task Time Usage */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <HiOutlineChartPie className="text-orange-500" /> Time Distribution
                </h3>
                <div className="h-[240px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={timeData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={85} paddingAngle={5}>
                        {timeData.map((_, index) => <Cell key={index} fill={TIME_COLORS[index]} stroke="none" />)}
                      </Pie>
                      <Tooltip formatter={(val) => `${val.toFixed(2)}h`} contentStyle={{ borderRadius: "12px", border: "none", fontSize: "12px", fontWeight: "bold" }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-black text-slate-900">{progressPercent}%</span>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Done</span>
                  </div>
                </div>
              </div>

              {/* Employee Breakdown */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <HiOutlineUserGroup className="text-orange-500" /> Resource Split
                </h3>
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={employeePieData} dataKey="value" nameKey="name" outerRadius={85} labelLine={false}>
                        {employeePieData.map((_, index) => <Cell key={index} fill={EMP_COLORS[index % EMP_COLORS.length]} stroke="none" />)}
                      </Pie>
                      <Tooltip formatter={(val) => `${val}h`} contentStyle={{ borderRadius: "12px", border: "none", fontSize: "12px", fontWeight: "bold" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Operators Table */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <HiOutlineUserGroup className="text-orange-500" /> Operator Contributions
                </h3>
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/30">
                    <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Member</th>
                    <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Hours Logged</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {task.assignedTo?.map((emp, index) => {
                    const empHours = task.timeLogs
                      ?.filter(log => (log.user?._id === emp.user?._id || log.user === emp.user?._id) && log.logType === "work")
                      .reduce((sum, log) => sum + (log.durationSeconds || 0), 0) / 3600;

                    return (
                      <tr key={emp._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-8 py-5 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black text-white shadow-sm" style={{ backgroundColor: EMP_COLORS[index % EMP_COLORS.length] }}>
                            {emp.user?.name?.charAt(0)}
                          </div>
                          <span className="text-xs font-black text-slate-700 uppercase">{emp.user?.name}</span>
                        </td>
                        <td className="px-8 py-5 text-right font-black text-slate-900 text-sm">{empHours.toFixed(2)}h</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Task Health</p>
              <div className="flex items-baseline gap-2 mb-8">
                <span className="text-7xl font-black italic">{progressPercent}</span>
                <span className="text-2xl font-bold text-orange-500">%</span>
              </div>
              <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-1000 ${isOver ? 'bg-rose-500' : 'bg-orange-500'}`} style={{ width: `${Math.min(progressPercent, 100)}%` }} />
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-4">Timeline</p>
              <div className="space-y-5">
                <DateItem label="Created" date={task.createdAt} />
                <DateItem label="Project Start" date={task.project?.startDate} />
                <DateItem label="Project End" date={task.project?.endDate} />
              </div>
            </div>
          </div>
        </div>
      </main>

      <TaskModal isOpen={!!editingTask} onClose={() => setEditingTask(null)} editTask={editingTask} />
      <ConfirmModal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        onConfirm={handleConfirmDelete} 
        isLoading={isDeleting} 
        title="Delete Task Record" 
        message={`Confirm permanent deletion of "${task?.title}"?`} 
        variant="danger" 
      />
    </div>
  );
}

// --- SUB-COMPONENTS ---
function Badge({ icon, text, className }) {
  return (
    <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase border shadow-sm flex items-center gap-1 ${className}`}>
      {icon} {text}
    </span>
  );
}

function MetricBox({ label, value, icon, color = "text-slate-900" }) {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
      <div className="flex items-center gap-2 mb-3 text-slate-400">
        {icon && React.cloneElement(icon, { size: 14 })}
        <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <p className={`text-xl font-black italic ${color}`}>{value}</p>
    </div>
  );
}

function DateItem({ label, date }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-[10px] font-black text-slate-400 uppercase">{label}</span>
      <span className="text-[11px] font-bold text-slate-800 uppercase">
        {date ? new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
      </span>
    </div>
  );
}
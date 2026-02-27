import React, { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  HiOutlineClock,
  HiOutlineArrowLeft,
  HiOutlineEnvelope,
  HiOutlineCalendarDays,
  HiOutlineInboxStack,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineCake,
  HiOutlinePhone,
  HiOutlinePencilSquare,
  HiOutlineTrash,
} from "react-icons/hi2";
import { useGetEmployeeProfileQuery } from "../../services/employeeApi";
import { useGetTasksByEmployeeQuery } from "../../services/taskApi";
import Loader from "../../components/Loader";
import { HiOutlineLightningBolt } from "react-icons/hi";
import EmployeeModal from "../../components/EmployeeModal";
import DeleteConfirmModal from "../../components/DeleteConfirmModal";
import { useDeleteUserMutation } from "../../services/userApi";


// --- UTILITY: DYNAMIC TIME FORMATTING ---
const formatDuration = (totalSeconds) => {

  if (totalSeconds < 60) return `${Math.round(totalSeconds)} SEC`;
  const mins = totalSeconds / 60;
  if (mins < 60) return `${mins.toFixed(1)} MIN`;
  return `${(totalSeconds / 3600).toFixed(2)} HRS`;
};

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // --- STATES ---
  const [logPage, setLogPage] = useState(0);
  const [taskPage, setTaskPage] = useState(0);
  const itemsPerPage = 5;
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const { data: employee, isLoading: userLoading } = useGetEmployeeProfileQuery(id);
  const { data: taskData, isLoading: tasksLoading } = useGetTasksByEmployeeQuery(id);
  const [deleteUser] = useDeleteUserMutation();

  const tasks = Array.isArray(taskData) ? taskData : taskData?.tasks || [];

  // --- LOGIC: TIME LOGS ---
  const { recentSevenDays, historicalGroups } = useMemo(() => {
    const logs = tasks
      .flatMap((task) =>
        (task.timeLogs || []).map((log) => ({
          ...log,
          taskTitle: task.title,
          projectNumber: task.projectNumber,
        }))
      )
      .filter((l) => l.logType === "work")
      .sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

    const groups = {};
    logs.forEach((log) => {
      const dateKey = new Date(log.startTime).toLocaleDateString("en-GB", {
        day: "2-digit", month: "short", year: "numeric",
      });
      if (!groups[dateKey]) {
        groups[dateKey] = { logs: [], totalSeconds: 0, rawDate: new Date(log.startTime) };
      }
      groups[dateKey].logs.push(log);
      groups[dateKey].totalSeconds += log.durationSeconds || 0;
    });

    const sortedEntries = Object.entries(groups).sort((a, b) => b[1].rawDate - a[1].rawDate);
    return {
      recentSevenDays: sortedEntries.slice(0, 7),
      historicalGroups: sortedEntries.slice(7),
    };
  }, [tasks]);

  const activeTasks = tasks.filter((t) => ["In Progress", "To be started"].includes(t.status));
  const paginatedAllTasks = tasks.slice(taskPage * itemsPerPage, (taskPage + 1) * itemsPerPage);
  const effectiveHours = employee ? ((540 * (employee.efficiency || 100)) / 6000).toFixed(1) : 0;

  const handleConfirmDelete = async () => {
    const t = toast.loading("Purging records...");
    try {
      await deleteUser(employee.user._id).unwrap();
      toast.success("Personnel removed from directory", { id: t });
      setIsDeleteModalOpen(false);
      navigate("/employees");
    } catch (err) {
      toast.error("Deletion failed", { id: t });
    }
  };

  if (userLoading || tasksLoading) return <Loader message="Accessing Personnel Files..." />;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 font-sans text-slate-900">
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 pt-8 pb-12 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-6">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-orange-600 font-black uppercase text-[10px] tracking-[0.2em] mb-8 transition-all group cursor-pointer">
            <HiOutlineArrowLeft strokeWidth={2.5} className="group-hover:-translate-x-1 transition-transform" />
            Back to Directory
          </button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-slate-900 rounded-[1.8rem] flex items-center justify-center text-orange-500 font-black text-4xl italic shadow-2xl shrink-0">
                {employee?.user?.name?.charAt(0)}
              </div>
              <div className="space-y-3">
                <h1 className="text-4xl font-black tracking-tighter uppercase leading-none">{employee?.user?.name}{employee?.employee_code ? ` (${employee.employee_code})` : ""}</h1>
                <div className="flex items-center gap-3">
                  <StatusBadge status={employee?.user?.status} />
                  <span className="h-1 w-1 rounded-full bg-slate-300" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{employee?.designation || "Field Operator"}</span>
                </div>
              </div>
            </div>

            {/* ACTION BLOCK */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-5 py-3 rounded-xl font-bold text-xs uppercase hover:border-yellow-500 hover:text-yellow-600 transition-all cursor-pointer shadow-sm"
              >
                <HiOutlinePencilSquare size={16} /> Update Employee
              </button>
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="flex items-center gap-2 bg-rose-50 text-rose-600 px-5 py-3 rounded-xl font-bold text-xs uppercase hover:bg-rose-600 hover:text-white transition-all cursor-pointer"
              >
                <HiOutlineTrash size={16} /> Delete Employee
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 -mt-8">
        <div className="grid lg:grid-cols-12 gap-8">

          {/* LEFT: LOGS */}
          <div className="lg:col-span-8 space-y-10">
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              <MetricBox label="Efficiency" value={`${employee?.efficiency || 100}%`} icon={<HiOutlineLightningBolt />} color="text-orange-500" />
              <MetricBox label="Shift Capacity" value={`${effectiveHours}h`} icon={<HiOutlineClock />} color="text-slate-500" />
              <MetricBox label="Active Tasks" value={activeTasks.length} icon={<HiOutlineInboxStack />} color="text-slate-500" />
              <MetricBox label="Leaves Taken" value={employee?.leaves?.length || 0} icon={<HiOutlineCalendarDays />} color="text-slate-500" />
            </div>

            <div className="space-y-4">
              <SectionHeader title="Recent 7-Day Output" />
              {recentSevenDays.length > 0 ? (
                recentSevenDays.map(([date, data]) => <LogDayCard key={date} date={date} data={data} isRecent={true} />)
              ) : (
                <EmptyState message="No activity in last 7 days" />
              )}
            </div>

            {historicalGroups.length > 0 && (
              <div className="space-y-4 pt-10 border-t border-slate-200">
                <div className="flex justify-between items-center px-2">
                  <SectionHeader title="Historical Archive" noLine />
                  <PaginationControls current={logPage} total={Math.ceil(historicalGroups.length / itemsPerPage)} setPage={setLogPage} />
                </div>
                {historicalGroups.slice(logPage * itemsPerPage, (logPage + 1) * itemsPerPage).map(([date, data]) => (
                  <LogDayCard key={date} date={date} data={data} isRecent={false} />
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: SIDEBAR */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-slate-400">
              <div className="flex items-center gap-2 mb-8">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Live Mission Queue</h3>
              </div>
              <div className="space-y-3">
                {activeTasks.length > 0 ? activeTasks.map(t => <TaskSmallCard key={t._id} task={t} active />) : <p className="text-[10px] font-bold text-slate-500 uppercase italic py-4">Queue Clear</p>}
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Assignment Masterlist</h3>
                <PaginationControls current={taskPage} total={Math.ceil(tasks.length / itemsPerPage)} setPage={setTaskPage} />
              </div>
              <div className="space-y-3">
                {paginatedAllTasks.map(t => <TaskSmallCard key={t._id} task={t} />)}
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Secure Contact</h3>
              <div className="space-y-6">
                <ContactItem icon={<HiOutlineEnvelope />} label="Work Email" value={employee?.user?.email} />
                <ContactItem icon={<HiOutlinePhone />} label="Mobile Number" value={employee?.mobileNumber} />
                <ContactItem icon={<HiOutlineCake />} label="Date of Birth" value={employee?.dateOfBirth && new Date(employee.dateOfBirth).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })} />
              </div>
            </div>
          </div>
        </div>
      </main>
      <EmployeeModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        editData={employee}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        employeeName={employee?.user?.name}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

// --- SUB-COMPONENTS (Keep logic modular and file readable) ---

function LogDayCard({ date, data, isRecent }) {
  return (
    <div className={`bg-white rounded-[2rem] border ${isRecent ? 'border-orange-100' : 'border-slate-200'} shadow-sm overflow-hidden flex flex-col`}>
      <div className={`px-6 py-4 flex justify-between items-center shrink-0 ${isRecent ? 'bg-orange-50/40' : 'bg-slate-50/80'}`}>
        <div className="flex items-center gap-3">
          <HiOutlineCalendarDays className={isRecent ? 'text-orange-500' : 'text-slate-400'} size={18} />
          <span className="text-[11px] font-black text-slate-900 uppercase tracking-wider">{date}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total:</span>
          <span className="text-[10px] font-black text-orange-600 bg-white border border-orange-100 px-3 py-1 rounded-full">
            {formatDuration(data.totalSeconds)}
          </span>
        </div>
      </div>
      <div className="overflow-y-auto max-h-[300px] divide-y divide-slate-50">
        {data.logs.map((log, idx) => (
          <div key={idx} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/80 transition-all group">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[8px] font-black text-white bg-slate-900 px-1.5 py-0.5 rounded tracking-tighter">{log.projectNumber || 'OP'}</span>
                <p className="text-[12px] font-black text-slate-800 uppercase truncate group-hover:text-orange-600">{log.taskTitle}</p>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase italic">
                {new Date(log.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} / {new Date(log.endTime || new Date()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
              </p>
            </div>
            <div className="bg-slate-50 group-hover:bg-orange-500 group-hover:text-white px-3 py-2 rounded-xl transition-all border border-slate-200 min-w-[85px] text-center">
              <p className="text-[10px] font-black uppercase">{formatDuration(log.durationSeconds || 0)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricBox({ label, value, icon, color }) {
  return (
    <div className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm">
      <div className="flex items-center gap-2 mb-2 text-slate-400">
        {React.cloneElement(icon, { size: 14 })}
        <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <p className={`text-xl font-black ${color}`}>{value}</p>
    </div>
  );
}

function TaskSmallCard({ task, active }) {
  return (
    <div className={`p-5 rounded-2xl border transition-all ${active ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-slate-50 border-slate-100 hover:border-slate-200'}`}>
      <p className={`text-[11px] font-black uppercase tracking-tight ${active ? 'text-slate-100' : 'text-slate-800'}`}>{task.title}</p>
      <div className="flex justify-between items-end mt-4">
        <span className={`text-[8px] font-black px-2 py-1 rounded uppercase tracking-widest ${active ? 'bg-orange-500/20 text-orange-400' : 'bg-slate-200 text-slate-500'}`}>{task.status}</span>
        <span className={`text-[10px] font-black ${active ? 'text-white/40' : 'text-slate-300'}`}>{(task.allocatedTime || 0)}H ALLOC</span>
      </div>
    </div>
  );
}

function PaginationControls({ current, total, setPage }) {
  if (total <= 1) return null;
  return (
    <div className="flex items-center gap-1">
      <button disabled={current === 0} onClick={() => setPage(p => p - 1)} className="p-1.5 hover:bg-slate-100 rounded-lg disabled:opacity-20 transition-all"><HiOutlineChevronLeft size={16} /></button>
      <span className="text-[10px] font-black text-slate-400 min-w-[30px] text-center">{current + 1}/{total}</span>
      <button disabled={current >= total - 1} onClick={() => setPage(p => p + 1)} className="p-1.5 hover:bg-slate-100 rounded-lg disabled:opacity-20 transition-all"><HiOutlineChevronRight size={16} /></button>
    </div>
  );
}

function StatusBadge({ status }) {
  const isEnabled = status === "Enable";
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-[0.2em] ${isEnabled ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
      {isEnabled ? "Active" : "Inactive"}
    </div>
  );
}

function ContactItem({ icon, label, value }) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">{React.cloneElement(icon, { size: 18 })}</div>
      <div className="min-w-0">
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-[12px] font-bold text-slate-700 truncate">{value || 'N/A'}</p>
      </div>
    </div>
  );
}

function SectionHeader({ title, noLine }) {
  return (
    <div className="flex items-center justify-between px-2">
      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{title}</h3>
      {!noLine && <span className="h-px flex-1 bg-slate-200 mx-4" />}
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="bg-white rounded-[2rem] border-2 border-dashed border-slate-200 p-10 text-center">
      <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">{message}</p>
    </div>
  );
}
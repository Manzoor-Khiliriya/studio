import React, { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
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
import ConfirmModal from "../../components/ConfirmModal";
import { useDeleteUserMutation } from "../../services/userApi";

// --- UTILITY: FORMAT SECONDS TO HR/MIN ---
const formatToHrMin = (totalSeconds) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours.toString().padStart(2, '0')} Hrs ${minutes.toString().padStart(2, '0')} Mins`;
};

// --- SUB-COMPONENT: DYNAMIC GRID VIEW ---
const TaskGridView = ({ tasks, userId }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const { gridData, totalHoursStr, displayRange } = useMemo(() => {
    if (!tasks || !tasks.length) return { gridData: [], totalHoursStr: "00 Hrs 00 Mins", displayRange: "" };

    const filterMonth = selectedDate.getMonth();
    const filterYear = selectedDate.getFullYear();
    let totalAllSeconds = 0;

    const data = tasks.map((task) => {
      const monthlyWorkSeconds = (task.timeLogs || [])
        .filter(log => {
          const logDate = new Date(log.startTime);
          const isSameMonth = logDate.getMonth() === filterMonth && logDate.getFullYear() === filterYear;
          const isThisEmployee = (log.user?._id || log.user) === userId;
          return log.logType === "work" && isSameMonth && isThisEmployee;
        })
        .reduce((acc, log) => acc + (log.durationSeconds || 0), 0);

      totalAllSeconds += monthlyWorkSeconds;
      const allocatedSeconds = (task.allocatedTime || 0) * 3600;
      const percentage = allocatedSeconds > 0 ? Math.min((monthlyWorkSeconds / allocatedSeconds) * 100, 100) : 0;

      return {
        id: task._id,
        title: task.title,
        timeStr: formatToHrMin(monthlyWorkSeconds),
        percentage,
        hasActivity: monthlyWorkSeconds > 0
      };
    }).filter(item => item.hasActivity);

    return {
      gridData: data,
      totalHoursStr: formatToHrMin(totalAllSeconds),
      displayRange: selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    };
  }, [tasks, selectedDate, userId]);

  const changeMonth = (offset) => {
    setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };

  const colors = ['bg-indigo-500', 'bg-cyan-500', 'bg-rose-500', 'bg-orange-500', 'bg-slate-500', 'bg-emerald-600'];

  return (
    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm w-full mb-10">
      <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
        <div className="flex items-center gap-1 bg-indigo-600 text-white p-1 rounded-xl shadow-lg shadow-indigo-100">
          <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <HiOutlineChevronLeft size={16} />
          </button>
          <div className="px-3 py-1 font-black text-xs uppercase tracking-widest whitespace-nowrap">
            {displayRange}
          </div>
          <button onClick={() => changeMonth(1)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <HiOutlineChevronRight size={16} />
          </button>
        </div>

        <div className="flex gap-12">
          <div className="text-center">
            <p className="text-indigo-600 font-black text-sm">{totalHoursStr}</p>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Personal Monthly Hours</p>
          </div>
          <div className="text-center">
            <p className="text-indigo-600 font-black text-sm">{gridData.length}</p>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Project Contributions</p>
          </div>
        </div>
      </div>

      {gridData.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {gridData.map((item, index) => (
            <div key={item.id} className={`${colors[index % colors.length]} rounded-2xl p-4 text-white relative overflow-hidden group transition-all hover:shadow-lg`}>
              <div className="relative z-10">
                <h4 className="text-[11px] font-black uppercase tracking-tight truncate w-4/5">{item.title}</h4>
                <p className="text-[9px] font-medium opacity-80 mt-0.5">{item.timeStr}</p>
                <div className="w-full bg-white/20 h-1.5 rounded-full mt-4">
                  <div className="bg-white h-full rounded-full transition-all duration-700" style={{ width: `${item.percentage}%` }} />
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-tr from-black/10 to-transparent pointer-events-none" />
            </div>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-3xl">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No logs found for {displayRange}</p>
        </div>
      )}
    </div>
  );
};

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [taskPage, setTaskPage] = useState(0);
  const itemsPerPage = 5;
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, type: null });

  const { data: employee, isLoading: userLoading } = useGetEmployeeProfileQuery(id);
  
  // Destructure the two lists from taskData
  const { data: taskData, isLoading: tasksLoading } = useGetTasksByEmployeeQuery(id);
  const currentlyAssigned = taskData?.currentlyAssigned || [];
  const workedAndAssigned = taskData?.workedAndAssigned || [];

  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();
  const userId = employee?.user?._id;

  // RECENT OUTPUT: Uses workedAndAssigned to catch all historical activity logs
  const { recentSevenDays } = useMemo(() => {
    if (!userId || !workedAndAssigned.length) return { recentSevenDays: [] };

    const logs = workedAndAssigned
      .flatMap((task) =>
        (task.timeLogs || [])
          .filter(log => (log.user?._id || log.user) === userId)
          .map((log) => ({
            ...log,
            taskTitle: task.title,
            projectNumber: task.project?.project_code || 'N/A',
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

    return {
      recentSevenDays: Object.entries(groups).sort((a, b) => b[1].rawDate - a[1].rawDate).slice(0, 7),
    };
  }, [workedAndAssigned, userId]);

  // LIVE MISSION QUEUE: Use the list where they are currently the assignee
  const activeTasks = currentlyAssigned.filter((t) => 
    ["In progress", "To be started"].includes(t.liveStatus)
  );

  // FULL HISTORY: Paginate the full list
  const paginatedAllTasks = workedAndAssigned.slice(taskPage * itemsPerPage, (taskPage + 1) * itemsPerPage);
  
  const effectiveHours = employee ? ((540 * (employee.efficiency || 100)) / 6000).toFixed(1) : 0;

  const handleConfirmDelete = async () => {
    const t = toast.loading("Purging records...");
    try {
      await deleteUser(employee.user._id).unwrap();
      toast.success("Employee removed successfully", { id: t });
      setConfirmConfig({ isOpen: false, type: null });
      navigate("/employees");
    } catch (err) {
      toast.error("Deletion failed", { id: t });
    }
  };

  if (userLoading || tasksLoading) return <Loader message="Accessing Personnel Files..." />;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 font-sans text-slate-900">
      <header className="bg-white border-b border-slate-200 pt-8 pb-12 shadow-sm">
        <div className="mx-auto px-8">
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

            <div className="flex items-center gap-3">
              <button onClick={() => setIsEditModalOpen(true)} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-8 py-4 rounded-2xl font-black text-xs uppercase hover:bg-slate-50 transition-all cursor-pointer shadow-sm">
                <HiOutlinePencilSquare size={18} /> Update
              </button>
              <button onClick={() => setConfirmConfig({ isOpen: true, type: 'delete' })} className="flex items-center gap-2 bg-rose-50 text-rose-600 px-8 py-4 rounded-2xl font-black text-xs uppercase hover:bg-rose-600 hover:text-white transition-all cursor-pointer shadow-sm">
                <HiOutlineTrash size={18} /> Delete
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto px-8 -mt-8">
        <div className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-10">
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              <MetricBox label="Efficiency" value={`${employee?.efficiency || 100}%`} icon={<HiOutlineLightningBolt />} color="text-orange-500" />
              <MetricBox label="Shift Capacity" value={`${effectiveHours}h`} icon={<HiOutlineClock />} color="text-slate-500" />
              <MetricBox label="Active Tasks" value={activeTasks.length} icon={<HiOutlineInboxStack />} color="text-slate-500" />
              <MetricBox label="Leaves Taken" value={employee?.leaves?.length || 0} icon={<HiOutlineCalendarDays />} color="text-slate-500" />
            </div>

            <SectionHeader title="Personal Performance History" />
            <TaskGridView tasks={workedAndAssigned} userId={userId} />

            <div className="space-y-4">
              <SectionHeader title="Recent 7-Day Personal Output" />
              {recentSevenDays.length > 0 ? (
                recentSevenDays.map(([date, data]) => <LogDayCard key={date} date={date} data={data} isRecent={true} />)
              ) : (
                <EmptyState message="No personal activity recorded recently" />
              )}
            </div>
          </div>

          <div className="lg:col-span-4 space-y-8">
            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl">
              <div className="flex items-center gap-2 mb-8">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Live Mission Queue</h3>
              </div>
              <div className="space-y-3">
                {activeTasks.length > 0 ? activeTasks.map(t => <TaskSmallCard key={t._id} task={t} active />) : <p className="text-[10px] font-bold text-slate-500 uppercase italic py-4">No Current Assignments</p>}
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Full Task History</h3>
                <PaginationControls current={taskPage} total={Math.ceil(workedAndAssigned.length / itemsPerPage)} setPage={setTaskPage} />
              </div>
              <div className="space-y-3">
                {paginatedAllTasks.map(t => {
                   const isAssigned = currentlyAssigned.some(a => a._id === t._id);
                   return <TaskSmallCard key={t._id} task={t} historical={!isAssigned} />;
                })}
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

      <EmployeeModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} editData={employee} />
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ isOpen: false, type: null })}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="Delete Employee"
        message={`Delete ${employee?.user?.name}? This action is irreversible.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}

// --- REMAINING SUB-COMPONENTS (UNTOUCHED) ---

function LogDayCard({ date, data, isRecent }) {
  const formatDuration = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (hours > 0) return `${hours}H ${minutes}M`;
    return `${minutes} MIN`;
  };

  return (
    <div className={`bg-white rounded-[2rem] border ${isRecent ? 'border-orange-100' : 'border-slate-200'} shadow-sm overflow-hidden flex flex-col`}>
      <div className={`px-6 py-4 flex justify-between items-center shrink-0 ${isRecent ? 'bg-orange-50/40' : 'bg-slate-50/80'}`}>
        <div className="flex items-center gap-3">
          <HiOutlineCalendarDays className={isRecent ? 'text-orange-500' : 'text-slate-400'} size={18} />
          <span className="text-[11px] font-black text-slate-900 uppercase tracking-wider">{date}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-orange-600 bg-white border border-orange-100 px-3 py-1 rounded-full">{formatDuration(data.totalSeconds)}</span>
        </div>
      </div>
      <div className="overflow-y-auto max-h-[300px] divide-y divide-slate-50">
        {data.logs.map((log, idx) => (
          <div key={idx} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/80 transition-all group">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[8px] font-black text-white bg-slate-900 px-1.5 py-0.5 rounded tracking-tighter">{log.projectNumber}</span>
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

function TaskSmallCard({ task, active, historical }) {
  return (
    <div className={`p-5 rounded-2xl border transition-all ${
      active ? 'bg-white/5 border-white/10 hover:bg-white/10' : 
      historical ? 'bg-slate-50 border-slate-100 opacity-60 grayscale-[0.5]' :
      'bg-slate-50 border-slate-100 hover:border-slate-200'
    }`}>
      <div className="flex justify-between items-start gap-2">
        <p className={`text-[11px] font-black uppercase tracking-tight ${active ? 'text-slate-100' : 'text-slate-800'}`}>{task.title}</p>
        {historical && <span className="text-[7px] font-black text-slate-400 uppercase border border-slate-200 px-1 rounded">History</span>}
      </div>
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
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
import { useSocketEvents } from "../../hooks/useSocketEvents";

// --- UTILITY: FORMAT SECONDS TO HR/MIN ---
const formatToHrMin = (totalSeconds) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours.toString().padStart(2, "0")} Hrs ${minutes
    .toString()
    .padStart(2, "0")} Mins ${seconds.toString().padStart(2, "0")} Secs`;
};

// --- UTILITY: DYNAMIC COLOR MAPPING BASED ON TASK ---
const getTaskColor = (taskId) => {
  if (!taskId) return "bg-slate-500";

  const palette = [
    "bg-indigo-500",
    "bg-cyan-500",
    "bg-rose-500",
    "bg-orange-500",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-violet-500",
    "bg-fuchsia-500",
  ];

  let hash = 0;
  const str = taskId.toString();
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palette[Math.abs(hash) % palette.length];
};

// --- SUB-COMPONENT: CUSTOM RANGE PERFORMANCE LIST ---
const TaskGridView = ({ tasks, userId }) => {
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });
  const [expanded, setExpanded] = useState(false);

  const formatDateDisplay = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      month: "long",
      day: "2-digit",
      year: "numeric",
    });
  };

  const { gridData, totalHoursStr, taskCount } = useMemo(() => {
    if (!tasks || !tasks.length) return { gridData: [], totalHoursStr: "00 Hrs 00 Mins", taskCount: 0 };

    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    end.setHours(23, 59, 59, 999);

    let totalAllSeconds = 0;

    const data = tasks.map((task) => {
      const rangeSeconds = (task.timeLogs || [])
        .filter((log) => {
          const logDate = new Date(log.startTime);
          return (
            log.logType === "work" &&
            logDate >= start &&
            logDate <= end &&
            (log.user?._id || log.user) === userId
          );
        })
        .reduce((acc, log) => acc + (log.durationSeconds || 0), 0);

      totalAllSeconds += rangeSeconds;
      return {
        id: task._id,
        title: task.title,
        projectCode: task.project?.projectCode || "N/A",
        timeStr: formatToHrMin(rangeSeconds),
        hasActivity: rangeSeconds > 0,
      };
    }).filter((item) => item.hasActivity);

    return { gridData: data, totalHoursStr: formatToHrMin(totalAllSeconds), taskCount: data.length };
  }, [tasks, dateRange, userId]);

  const INITIAL_COUNT = 4;

  const visibleData = expanded
    ? gridData
    : gridData.slice(0, INITIAL_COUNT);

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm  w-full">
      <div className="bg-slate-50/80 px-6 py-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-2 border-b border-slate-100">
        {/* Modern Date Picker Container */}
        <div className="flex items-center my-auto bg-orange-600 text-white rounded shadow-lg overflow-hidden border border-orange-700">
          {/* Start Date */}
          <div className="relative hover:bg-orange-700 transition-colors cursor-pointer px-4 py-1">
            <span className="text-[11px] font-black uppercase tracking-wider whitespace-nowrap">
              {formatDateDisplay(dateRange.start)}
            </span>
            <input
              type="date"
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              onClick={(e) => e.target.showPicker?.()}
            />
          </div>

          <div className="text-white/50 font-bold px-1 text-sm">-</div>

          {/* End Date */}
          <div className="relative hover:bg-orange-700 transition-colors cursor-pointer px-4 py-1">
            <span className="text-[11px] font-black uppercase tracking-wider whitespace-nowrap">
              {formatDateDisplay(dateRange.end)}
            </span>
            <input
              type="date"
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              onClick={(e) => e.target.showPicker?.()}
            />
          </div>
        </div>

        {/* Stats Summary */}
        <div className="flex gap-10">
          <div className="text-center">
            <p className="text-slate-900 font-black text-sm leading-none mb-1">{totalHoursStr}</p>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Selected Hours</p>
          </div>
          <div className="text-center">
            <p className="text-slate-900 font-black text-sm leading-none mb-1">{taskCount}</p>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Tasks</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 px-6 py-4 mb-1">
        {gridData.length > 0 ? (
          visibleData.map((item) => (
            <div
              key={item.id}
              className={`flex items-center justify-between p-4 ${getTaskColor(item.id)} rounded-2xl shadow-sm`}
            >
              <h4 className="text-[10px] font-black uppercase text-white truncate mr-4">
                {item.title} ({item.projectCode})
              </h4>
              <p className="text-[9px] font-black text-white shrink-0 opacity-90">
                {item.timeStr}
              </p>
            </div>
          ))
        ) : (
          <div className="col-span-full py-4 text-center bg-slate-50 rounded border-2 border-dashed border-slate-100">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">
              No performance logs found for this range
            </p>
          </div>
        )}
      </div>

      {/* ✅ BUTTON OUTSIDE MAP */}
      {gridData.length > INITIAL_COUNT && (
        <div className="flex justify-end pb-2 pr-6">
          <button
            onClick={() => setExpanded((prev) => !prev)}
            className="text-[10px] font-black text-orange-600 bg-white px-4 py-0.5 rounded-full shadow-sm cursor-pointer"
          >
            {expanded ? "Show Less" : "Show More"}
          </button>
        </div>
      )}
    </div >
  );
};

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [taskPage, setTaskPage] = useState(0);
  const itemsPerPage = 5;
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, type: null });

  const { data: employee, isLoading: userLoading, refetch: refetchEmployee } = useGetEmployeeProfileQuery(id);
  const { data: taskData, isLoading: tasksLoading, refetch: refetchTasks } = useGetTasksByEmployeeQuery(id);

  const currentlyAssigned = taskData?.currentlyAssigned || [];
  const workedAndAssigned = taskData?.workedAndAssigned || [];

  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();
  const userId = employee?.user?._id;

  useSocketEvents({
    onEmployeeChange: () => {
      refetchEmployee();
      refetchTasks();
    },
    onTaskChange: () => {
      refetchTasks();
    },
    onTimeLogChange: () => {
      refetchTasks();
    }
  });

  const { lastActiveDay } = useMemo(() => {
    if (!userId || !workedAndAssigned.length) return { lastActiveDay: null };

    const logsByDate = {};

    // 1. Group all logs by date first
    workedAndAssigned.forEach((task) => {
      (task.timeLogs || [])
        .filter((log) => (log.user?._id || log.user) === userId && log.logType === "work")
        .forEach((log) => {
          const dateObj = new Date(log.startTime);
          const dateKey = dateObj.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          });

          if (!logsByDate[dateKey]) {
            logsByDate[dateKey] = {
              date: dateKey,
              tasks: {},
              totalDaySeconds: 0,
              rawDate: dateObj
            };
          }

          if (!logsByDate[dateKey].tasks[task._id]) {
            logsByDate[dateKey].tasks[task._id] = {
              id: task._id,
              title: task.title,
              projectCode: task.project?.projectCode || "N/A",
              seconds: 0,
              allocated: (task.allocatedTime || 0) * 3600,
            };
          }

          logsByDate[dateKey].tasks[task._id].seconds += log.durationSeconds || 0;
          logsByDate[dateKey].totalDaySeconds += log.durationSeconds || 0;
        });
    });

    // 2. Sort to find the absolute latest date they worked
    const sortedDates = Object.values(logsByDate).sort((a, b) => b.rawDate - a.rawDate);

    if (sortedDates.length === 0) return { lastActiveDay: null };

    const latestDay = sortedDates[0];
    return {
      lastActiveDay: {
        ...latestDay,
        tasks: Object.values(latestDay.tasks)
      }
    };
  }, [workedAndAssigned, userId]);

  const activeTasks = currentlyAssigned;
  const liveTasks = currentlyAssigned.filter((t) => ["In progress"].includes(t.liveStatus));
  const paginatedAllTasks = workedAndAssigned.slice(taskPage * itemsPerPage, (taskPage + 1) * itemsPerPage);
  const effectiveHours = employee ? ((540 * (employee.proficiency || 100)) / 6000).toFixed(1) : 0;

  const handleConfirmDelete = async () => {
    const t = toast.loading("Deleting records...");
    try {
      await deleteUser(employee.user._id).unwrap();
      toast.success("Employee removed successfully", { id: t });
      navigate("/employees");
    } catch (err) {
      toast.error("Deletion failed", { id: t });
    }
  };

  if (userLoading || tasksLoading) return <Loader message="Accessing Personnel Files..." />;

  return (
    <div className="max-w-[1750px] mx-auto  min-h-screen bg-slate-100 pb-10 font-sans text-slate-900">
      <header className="bg-white border-b border-slate-200 pt-8 pb-12 shadow-sm">
        <div className="mx-auto px-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-400 hover:text-orange-600 font-black uppercase text-[10px] tracking-[0.2em] mb-8 transition-all group bg-transparent border-none cursor-pointer"
          >
            <HiOutlineArrowLeft strokeWidth={2.5} className="group-hover:-translate-x-1 transition-transform" />
            Back to Directory
          </button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex col-span-8 items-center gap-6">
              <div className="w-20 h-20 bg-slate-900 rounded-[1.8rem] flex items-center justify-center text-orange-500 font-black text-4xl italic shadow-2xl shrink-0">
                {employee?.user?.name?.charAt(0)}
              </div>
              <div className="space-y-3">
                <h1 className="text-4xl font-black tracking-tighter uppercase leading-none">
                  {employee?.user?.name}
                  {employee?.employeeCode ? ` (${employee.employeeCode})` : ""}
                </h1>
                <div className="flex items-center gap-3">
                  <StatusBadge status={employee?.user?.status} />
                  <span className="h-1 w-1 rounded-full bg-slate-300" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {employee?.designation || "Field Operator"}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 px-1 w-full max-w-[545px]">
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest bg-slate-900 text-white hover:bg-orange-600 transition-all shadow-xl shadow-orange-100 active:scale-95 cursor-pointer"              >
                <HiOutlinePencilSquare size={18} /> Update Employee
              </button>
              <button
                onClick={() => setConfirmConfig({ isOpen: true, type: "delete" })}
                className="flex items-center justify-center gap-2 bg-slate-900 text-white w-full py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-600 transition-all shadow-xl shadow-orange-100 active:scale-95 cursor-pointer"
              >
                <HiOutlineTrash size={18} /> Delete Employee
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="px-8 -mt-8">
        <div className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-10">
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              <MetricBox label="Proficiency" value={`${employee?.proficiency || ""}%`} icon={<HiOutlineLightningBolt />} color="text-orange-500" />
              <MetricBox label="Shift Capacity" value={`${effectiveHours}h`} icon={<HiOutlineClock />} color="text-slate-500" />
              <MetricBox label="Active Tasks" value={activeTasks.length} icon={<HiOutlineInboxStack />} color="text-slate-500" />
              <MetricBox label="Leaves Taken" value={employee?.leaves?.length || 0} icon={<HiOutlineCalendarDays />} color="text-slate-500" />
            </div>

            <SectionHeader title="Record Book" />
            <TaskGridView tasks={workedAndAssigned} userId={userId} />

            <div className="space-y-5">
              {/* Dynamic Header based on date */}
              <SectionHeader
                title={
                  lastActiveDay?.date === new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                    ? "Today's Performance Output"
                    : "Latest Recorded Activity"
                }
              />

              {lastActiveDay ? (
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm h-[175px] overflow-hidden">

                  <div className="h-full overflow-y-auto custom-scrollbar">

                    <div className="bg-slate-50/80 px-6 py-4 flex justify-between items-center border-b border-slate-100 sticky top-0 z-10">
                      <div className="flex items-center gap-3">
                        <HiOutlineCalendarDays className="text-orange-500" size={18} />
                        <div className="flex flex-col">
                          <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest">
                            {lastActiveDay.date}
                          </span>
                          <span className="text-[8px] font-bold text-slate-400 uppercase">
                            {lastActiveDay.date === new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                              ? "Current Session"
                              : "Last Active Session"}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-orange-600">
                        {formatToHrMin(lastActiveDay.totalDaySeconds)}
                      </span>
                    </div>

                    <div className="px-6 py-3 grid grid-cols-1 gap-x-10 gap-y-6">
                      {lastActiveDay.tasks.map((task, idx) => {
                        const percentage =
                          task.allocated > 0
                            ? Math.min((task.seconds / task.allocated) * 100, 100)
                            : 0;
                        const taskColor = getTaskColor(task.id);

                        return (
                          <div key={idx} className="space-y-2">
                            <div className="flex justify-between items-end">
                              <h4 className="text-[10px] font-black uppercase text-slate-800 truncate">
                                {task.title}{" "}
                                <span className="text-slate-400">({task.projectCode})</span>
                              </h4>
                              <span className="text-[9px] font-bold text-slate-500 ml-2">
                                {formatToHrMin(task.seconds)}
                              </span>
                            </div>

                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`${taskColor} h-full rounded-full transition-all duration-700`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyState message="No personal activity recorded yet" />
              )}
            </div>
          </div>

          <div className="lg:col-span-4 space-y-8">
            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Live Tasks</h3>
              </div>
              <div className="space-y-3">
                {liveTasks.length > 0 ? (
                  liveTasks.map((t) => <TaskSmallCard key={t._id} task={t} active />)
                ) : (
                  <p className="text-[10px] font-bold text-slate-500 uppercase italic h-18 flex items-center justify-center">No Live Tasks Found</p>
                )}
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Full Task History
                </h3>
              </div>

              {/* 👇 Scroll container */}
              <div className="space-y-3 h-[325px] overflow-y-auto pr-2 custom-scrollbar">
                {workedAndAssigned.map((t) => {
                  const isAssigned = currentlyAssigned.some((a) => a._id === t._id);
                  return (
                    <TaskSmallCard
                      key={t._id}
                      task={t}
                      historical={!isAssigned}
                    />
                  );
                })}
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Secure Contact</h3>
              <div className="space-y-6">
                <ContactItem icon={<HiOutlineEnvelope />} label="Work Email" value={employee?.user?.email} />
                <ContactItem icon={<HiOutlinePhone />} label="Mobile Number" value={employee?.mobileNumber} />
                <ContactItem
                  icon={<HiOutlineCake />}
                  label="Date of Birth"
                  value={
                    employee?.dateOfBirth &&
                    new Date(employee.dateOfBirth).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })
                  }
                />
                <ContactItem
                  icon={<HiOutlineCalendarDays />}
                  label="Date of Joining"
                  value={
                    employee?.joinedDate &&
                    new Date(employee.joinedDate).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })
                  }
                />
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

// --- HELPER COMPONENTS ---

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
    <div
      className={`h-18 p-3 rounded-2xl border transition-all ${active
        ? "bg-white/5 border-white/10 hover:bg-white/10"
        : historical
          ? "bg-slate-50 border-slate-100 opacity-60"
          : "bg-slate-50 border-slate-100 hover:border-slate-200"
        }`}
    >
      <div className="flex justify-between items-start gap-2">
        <p className={`text-[11px] font-black uppercase tracking-tight ${active ? "text-slate-100" : "text-slate-800"}`}>{task.title} {task?.project?.projectCode && `(${task.project.projectCode})`}</p>
        {historical && (
          <span className="text-[7px] font-black text-slate-400 uppercase border border-slate-200 px-1 rounded">History</span>
        )}
      </div>
      <div className="flex justify-between items-end mt-2">
        <span
          className={`text-[8px] font-black uppercase tracking-widest ${active ? " text-orange-400" : " text-slate-500"
            }`}
        >
          {task.liveStatus}
        </span>
        <span
          className={`text-[8px] font-black  uppercase tracking-widest ${active ? " text-orange-400" : " text-slate-500"
            }`}
        >
          {task.status}
        </span>
        <span className={`text-[10px] font-black ${active ? "text-white/40" : "text-slate-300"}`}>
          {task.allocatedTime || 0}H ALLOC
        </span>
      </div>
    </div>
  );
}

function PaginationControls({ current, total, setPage }) {
  if (total <= 1) return null;
  return (
    <div className="flex items-center gap-1">
      <button
        disabled={current === 0}
        onClick={() => setPage((p) => p - 1)}
        className="p-1.5 hover:bg-slate-100 rounded-lg disabled:opacity-20 transition-all cursor-pointer"
      >
        <HiOutlineChevronLeft size={16} />
      </button>
      <span className="text-[10px] font-black text-slate-400 min-w-[30px] text-center">
        {current + 1}/{total}
      </span>
      <button
        disabled={current >= total - 1}
        onClick={() => setPage((p) => p + 1)}
        className="p-1.5 hover:bg-slate-100 rounded-lg disabled:opacity-20 transition-all cursor-pointer"
      >
        <HiOutlineChevronRight size={16} />
      </button>
    </div>
  );
}

function StatusBadge({ status }) {
  const isEnabled = status === "Enable";
  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-[0.2em] ${isEnabled ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"
        }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isEnabled ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
      {isEnabled ? "Active" : "Inactive"}
    </div>
  );
}

function ContactItem({ icon, label, value }) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
        {React.cloneElement(icon, { size: 18 })}
      </div>
      <div className="min-w-0">
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-[12px] font-bold text-slate-700 truncate">{value || "N/A"}</p>
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
    <div className="bg-white rounded-[2rem] border-2 border-slate-200 p-18 text-center">
      <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">{message}</p>
    </div>
  );
}
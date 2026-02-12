import React, { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  HiOutlineClock,
  HiOutlineArrowLeft,
  HiOutlineBriefcase,
  HiOutlineEnvelope,
  HiOutlineCalendarDays,
  HiOutlineInboxStack
} from "react-icons/hi2";
import { HiOutlineLightningBolt } from "react-icons/hi";
import { useGetEmployeeProfileQuery } from "../../services/employeeApi";
import { useGetTasksByEmployeeQuery } from "../../services/taskApi";
import Loader from "../../components/Loader";

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: employee, isLoading: userLoading } = useGetEmployeeProfileQuery(id);
  const { data: taskData, isLoading: tasksLoading } = useGetTasksByEmployeeQuery(id);

  const tasks = Array.isArray(taskData) ? taskData : taskData?.tasks || [];

  const groupedLogs = useMemo(() => {
    const logs = tasks
      .flatMap((task) =>
        (task.timeLogs || []).map((log) => ({
          ...log,
          taskTitle: task.title,
          projectNumber: task.projectNumber
        }))
      )
      .sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

    const groups = {};
    logs.forEach((log) => {
      if (log.logType !== 'work') return;

      const dateKey = new Date(log.startTime).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric'
      });

      if (!groups[dateKey]) {
        groups[dateKey] = { logs: [], totalSeconds: 0 };
      }

      groups[dateKey].logs.push(log);

      groups[dateKey].totalSeconds += (log.durationSeconds || 0);
    });
    return groups;
  }, [tasks]);

  const activeTasks = tasks.filter((t) => ["In Progress", "Pending"].includes(t.status));
  const effectiveHours = employee ? ((540 * (employee.efficiency || 100)) / 6000).toFixed(1) : 0;

  if (userLoading || tasksLoading) return <Loader message="Accessing Personnel Files..." />;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 font-sans">
      {/* HEADER SECTION */}
      <header className="bg-white border-b border-slate-200 pt-8 pb-12 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-400 hover:text-orange-600 font-black uppercase text-[10px] tracking-[0.2em] mb-8 transition-all border-none bg-transparent cursor-pointer group"
          >
            <HiOutlineArrowLeft strokeWidth={2.5} className="group-hover:-translate-x-1 transition-transform" />
            Back to Directory
          </button>

          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-slate-900 rounded-[1.8rem] flex items-center justify-center text-orange-500 font-black text-4xl italic shadow-2xl shadow-slate-300 shrink-0">
              {employee?.user?.name?.charAt(0)}
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                {employee?.user?.name}
              </h1>
              <div className="flex items-center gap-3">
                <StatusBadge status={employee?.user?.status} />
                <span className="h-1 w-1 rounded-full bg-slate-300" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{employee?.designation || "Field Operator"}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 -mt-8">
        <div className="grid lg:grid-cols-12 gap-8">

          {/* MAIN CONTENT AREA */}
          <div className="lg:col-span-8 space-y-8">

            {/* TACTICAL METRIC GRID */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              <MetricBox label="Efficiency" value={`${employee?.efficiency || 100}%`} icon={<HiOutlineLightningBolt />} color="text-orange-500" />
              <MetricBox label="Shift Capacity" value={`${effectiveHours}h`} icon={<HiOutlineClock />} color="text-slate-500" />
              <MetricBox label="Active Tasks" value={activeTasks.length} icon={<HiOutlineInboxStack />} color="text-slate-500" />
              <MetricBox
                label="Upcoming Leave"
                icon={<HiOutlineBriefcase />}
                color={employee.leaves?.length > 0 ? "text-orange-600" : "text-slate-500"}
                value={
                  <div className="flex flex-col">
                    {/* Main Count */}
                    <span>{employee.leaves?.length > 0 ? `${employee.leaves.length} Days` : "No Leave"}</span>

                    {/* Small Date List */}
                    {employee.leaves?.length > 0 && (
                      <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">
                        {employee.leaves
                          .slice(0, 2) // Show first 2 dates
                          .map(l => new Date(l.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }))
                          .join(" • ")}
                        {employee.leaves.length > 2 && ` +${employee.leaves.length - 2} more`}
                      </span>
                    )}
                  </div>
                }
              />
            </div>

            {/* OPERATIONAL HISTORY LIST */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Operational Breakdown</h3>
                <span className="h-px flex-1 bg-slate-200 mx-4" />
              </div>

              {Object.entries(groupedLogs).length > 0 ? (
                Object.entries(groupedLogs).map(([date, data]) => (
                  <div key={date} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden transition-all hover:border-slate-300">
                    {/* Day Header */}
                    <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-100 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-white rounded-lg border border-slate-200 text-orange-500">
                          <HiOutlineCalendarDays size={16} />
                        </div>
                        <span className="text-[11px] font-black text-slate-900 uppercase tracking-[0.1em]">{date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Logged Output:</span>
                        <span className="text-[10px] font-black text-orange-600 bg-orange-50 border border-orange-100 px-3 py-1 rounded-full">
                          {(data.totalSeconds / 3600).toFixed(2)} HRS
                        </span>
                      </div>
                    </div>

                    {/* Task Logs for the day */}
                    <div className="divide-y divide-slate-50">
                      {data.logs.map((log, idx) => (
                        <div key={idx} className="px-6 py-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors group">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0 group-hover:bg-white group-hover:text-orange-500 border border-transparent group-hover:border-slate-200 transition-all">
                              <HiOutlineBriefcase size={18} />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[8px] font-black text-white bg-slate-900 px-1.5 py-0.5 rounded tracking-tighter shrink-0">
                                  {log.projectNumber || 'OP-LOG'}
                                </span>
                                <p className="text-[12px] font-black text-slate-800 uppercase truncate tracking-tight">{log.taskTitle}</p>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold text-slate-400 uppercase italic">
                                  {new Date(log.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                                  <span className="mx-1 opacity-50">/</span>
                                  {new Date(log.endTime || new Date()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="pl-4 shrink-0">
                            <div className="bg-slate-100 group-hover:bg-orange-500 group-hover:text-white px-4 py-2 rounded-xl transition-all border border-slate-200 group-hover:border-orange-600 text-center min-w-[65px]">
                              <p className="text-xs font-black leading-none">{log.duration}</p>
                              <p className="text-[8px] font-black uppercase opacity-60">Mins</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white rounded-[2rem] border-2 border-dashed border-slate-200 p-20 text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">No operational history detected</p>
                </div>
              )}
            </div>
          </div>

          {/* SIDEBAR AREA */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-slate-400 relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-8">
                  <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Live Mission Queue</h3>
                </div>
                <div className="space-y-3">
                  {activeTasks.length > 0 ? activeTasks.map(t => (
                    <div key={t._id} className="p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors cursor-default group">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-200 group-hover:text-orange-400 transition-colors">{t.title}</p>
                      <div className="flex justify-between items-end mt-4">
                        <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest bg-orange-500/10 px-2 py-1 rounded-md">{t.status}</span>
                        <span className="text-xs font-black text-white/40 italic">{(t.allocatedTime || 0).toFixed(1)}H ALLOC</span>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-6 opacity-40">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Queue Clear</p>
                    </div>
                  )}
                </div>
              </div>
              {/* Decorative background element */}
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl" />
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Contact Information</h3>
              <div className="space-y-6">
                <ContactItem icon={<HiOutlineEnvelope />} label="Secure Communication" value={employee?.user?.email} />
                <ContactItem icon={<HiOutlineCalendarDays />} label="Service Commencement" value={employee?.joinedDate ? new Date(employee.joinedDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : 'N/A'} />
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}


function MetricBox({ label, value, icon, color = "text-slate-900" }) {
  return (
    <div className="bg-white p-5 rounded-4xl border border-slate-200 shadow-sm">
      <div className="flex items-center gap-2 mb-2 text-slate-400">
        {icon && React.cloneElement(icon, { size: 14 })}
        <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <p className={`text-lg font-black tracking-tight ${color}`}>{value}</p>
    </div>
  );
}

function ContactItem({ icon, label, value }) {
  return (
    <div className="flex items-center gap-4 group cursor-default">
      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 group-hover:bg-orange-50 group-hover:text-orange-600 group-hover:border-orange-100 transition-all shrink-0">
        {React.cloneElement(icon, { size: 22 })}
      </div>
      <div className="min-w-0">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">{label}</p>
        <p className="text-xs font-bold text-slate-700 truncate">{value || 'N/A'}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const isEnabled = status === "Enable";
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-[0.2em] ${isEnabled ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"
      }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
      {isEnabled ? "Active" : "Inactive"}
    </div>
  );
}
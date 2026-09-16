import React, { useEffect, useState } from 'react';
import {
  useGetDashboardSummaryQuery,
  useClearLogsMutation,
  useStopAllSessionsMutation,
  useGetManagerDashboardQuery,
  useStopEmployeeSessionMutation
} from '../../services/dashboardApi';
import { HiOutlineArrowTrendingUp, HiOutlineBolt, HiOutlineUserGroup, HiOutlineFingerPrint, HiOutlineCalendarDays, HiOutlineMagnifyingGlass, HiOutlineXMark } from 'react-icons/hi2';
import { BiTask, BiTimeFive, BiTrash } from 'react-icons/bi';
import { FiAlertTriangle } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import Loader from '../../components/Loader';
import StatCard from '../../components/StatCard';
import { HiOutlineClipboardList } from 'react-icons/hi';
import PageHeader from '../../components/PageHeader';
import { useSocketEvents } from '../../hooks/useSocketEvents';
import ConfirmModal from '../../components/ConfirmModal';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import CustomDropdown from '../../components/CustomDropdown';

const AdminDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [confirmState, setConfirmState] = useState({
    open: false,
    action: null,
    payload: null,
  });
  const [timerSearch, setTimerSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const {
    data: adminData,
    isLoading: adminLoading,
    refetch: adminRefetch,
  } = useGetDashboardSummaryQuery(undefined, {
    skip: user?.role !== "Admin",
    refetchOnMountOrArgChange: true,
  });

  const {
    data: managerData,
    isLoading: managerLoading,
    refetch: managerRefetch,
  } = useGetManagerDashboardQuery(undefined, {
    skip: user?.role !== "Manager",
    refetchOnMountOrArgChange: true,
  });

  const data = user?.role === "Admin" ? adminData : managerData;

  const isLoading =
    user?.role === "Admin"
      ? adminLoading
      : managerLoading;

  const refetch =
    user?.role === "Admin"
      ? adminRefetch
      : managerRefetch;

  const [stopAllSessions, { isLoading: isStoppingAll }] = useStopAllSessionsMutation();
  const [clearLogs, { isLoading: isClearing }] = useClearLogsMutation();
  const [stopEmployeeSession, { isLoading: isStoppingEmployee }] = useStopEmployeeSessionMutation();

  useSocketEvents({
    onDashboardUpdate: refetch,
  });


  if (isLoading) return <Loader message="Decrypting Operational Data..." />;

  const stats = data?.stats || {};
  const liveTracking = data?.liveTracking || [];
  const recentActivity = data?.recentActivity || [];

  const groupedLogs = recentActivity.reduce((groups, log) => {
    const date = log.dateString;
    if (!groups[date]) groups[date] = [];
    groups[date].push(log);
    return groups;
  }, {});

  const handleStopAll = async () => {
    setConfirmState({
      open: true,
      action: "STOP_ALL",
    });
  };

  const handleClearDay = async (date) => {
    setConfirmState({
      open: true,
      action: "CLEAR_LOGS",
      payload: date,
    });
  };

  const getFriendlyDate = (dateStr) => {
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
    }).format(new Date());

    const yesterday = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
    }).format(
      new Date(Date.now() - 24 * 60 * 60 * 1000)
    );

    if (dateStr === today) {
      return "Today's Operations";
    }

    if (dateStr === yesterday) {
      return "Yesterday";
    }

    const [year, month, day] = dateStr.split("-");

    const monthName = new Intl.DateTimeFormat("en-GB", {
      month: "short",
      timeZone: "UTC",
    }).format(
      new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))
    );

    return `${day} ${monthName} ${year}`.toUpperCase();
  };

  const handleStopEmployee = (timer) => {
    setConfirmState({
      open: true,
      action: "STOP_EMPLOYEE",
      payload: timer,
    });
  };

  const handleConfirm = async () => {
    try {
      if (confirmState.action === "STOP_ALL") {
        await stopAllSessions().unwrap();
        toast.success("All sessions terminated");
      }

      if (confirmState.action === "STOP_EMPLOYEE") {
        await stopEmployeeSession(
          confirmState.payload.userId
        ).unwrap();

        toast.success(
          `${confirmState.payload.employee} session stopped`
        );
      }

      if (confirmState.action === "CLEAR_LOGS") {
        await clearLogs({ date: confirmState.payload }).unwrap();
        toast.success(`Logs for ${confirmState.payload} cleared`);
      }
    } catch (err) {
      toast.error(
        err?.data?.message || "Action failed"
      );
    } finally {
      setConfirmState({
        open: false,
        action: null,
        payload: null,
      });
    }
  };

  const handleActiveTimerClick = (timer) => {
    if (!timer?.taskId) return;

    navigate(`/projects/${timer.taskId}`);
  };

  const filteredLiveTracking = liveTracking.filter((timer) => {
    const term = timerSearch.trim().toLowerCase();
    const matchesSearch =
      !term ||
      timer.employee?.toLowerCase().includes(term) ||
      timer.employeeCode?.toLowerCase().includes(term);

    const matchesStatus =
      statusFilter === "all" || timer.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <div className="min-h-[83vh] bg-slate-100">
        <PageHeader
          title={user?.role === "Admin" ? "Admin Dashboard" : "Manager Dashboard"}
          iconText="A"
          subtitle="Manage operational objectives and real-time resource utilization."
        />

        <div className="mx-auto px-4 sm:px-6 lg:px-8 pb-6 sm:pb-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-12 mt-10">
            <StatCard
              label="Live Projects"
              value={stats.totalProjects || 0}
              icon={<HiOutlineClipboardList size={22} />}
              delay={0.1}
              onClick={() => navigate("/projects")}
            />

            <StatCard
              label="Active Employees"
              value={stats.totalActiveEmployees || 0}
              icon={<HiOutlineUserGroup size={22} />}
              delay={0.2}
              onClick={
                user?.role === "Admin"
                  ? () => navigate("/employees")
                  : undefined
              }
            />

            <StatCard
              label="On Duty"
              value={stats.attendanceLive || 0}
              variant={stats.attendanceLive > 0 ? "active" : "default"}
              icon={<HiOutlineFingerPrint size={22} />}
              delay={0.3}
              onClick={
                user?.role === "Admin"
                  ? () => navigate("/attendance")
                  : undefined
              }
            />

            <StatCard
              label="Task In Progress"
              value={stats.tasksInProgress || 0}
              icon={<HiOutlineArrowTrendingUp size={22} />}
              delay={0.4}
              onClick={() =>
                navigate("/projects", {
                  state: {
                    activeTab: "live",
                    liveStatusFilter: "In progress",
                  },
                })
              }
            />

            <StatCard
              label="Leave Requests"
              value={stats.pendingApprovals || 0}
              variant={stats.pendingApprovals > 0 ? "warning" : "default"}
              icon={<BiTask size={22} />}
              delay={0.5}
              onClick={() =>
                navigate("/leaves", {
                  state: {
                    activeTab: "requests",
                    statusFilter: "Pending",
                    dateRange: "all",
                  },
                })
              } />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8">
            {/* --- LIVE TRACKING --- */}

            <div
              className={`bg-white rounded-[2rem] sm:rounded-[3rem] border border-slate-200 p-4 sm:p-6 lg:p-8 shadow-xl flex flex-col h-[600px] sm:h-[700px] ${user?.role === "Admin" ? "lg:col-span-5" : "lg:col-span-12"
                }`}
            >
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-10 shrink-0 gap-4">
                <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest flex items-center gap-3 shrink-0">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute h-3 w-3 rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative h-3 w-3 rounded-full bg-blue-500"></span>
                  </span>
                  Active Timers
                </h3>

                {user?.role === "Admin" && liveTracking.length > 0 && (
                  <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
                    {/* Search input */}
                    <div className="relative flex-1 w-full min-w-[100px] group">
                      <HiOutlineMagnifyingGlass
                        className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors"
                        size={18}
                      />
                      <input
                        type="text"
                        value={timerSearch}
                        onChange={(e) => setTimerSearch(e.target.value)}
                        placeholder="Search by employee name..."
                        className="w-full pl-12 pr-8 py-1.5 bg-white border border-slate-200 rounded-2xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/5 outline-none font-bold text-[10px] transition-all shadow-sm"
                      />
                      {timerSearch && (
                        <button
                          type="button"
                          onClick={() => setTimerSearch("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                          title="Clear search"
                        >
                          <HiOutlineXMark size={16} />
                        </button>
                      )}
                    </div>

                    {/* Status filter pills — now a sibling, not nested inside the input wrapper */}
                    <CustomDropdown
                      value={statusFilter}
                      onChange={(val) => setStatusFilter(val)}
                      options={[
                        { value: "all", label: "All Log Type" },
                        { value: "work", label: "Working" },
                        { value: "break", label: "On Break" },
                      ]}
                      placeholder="Filter by Status"
                      className=" max-w-[100px] "
                      buttonClass="py-1.5 px-4 bg-white border border-slate-200 rounded-2xl shadow-sm text-[10px] font-black tracking-widest transition-all cursor-pointer text-slate-500 hover:text-slate-800 max-w-[100px] shrink-0"
                    />

                    <div className="flex items-center gap-2 px-3 py-1.5 shrink-0">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                      <span className="text-[10px] font-bold text-green-700 uppercase tracking-wide">
                        {filteredLiveTracking.length} {statusFilter === "all" ? "Active" : statusFilter === "break" ? "On Break" : "Working"}
                      </span>
                    </div>

                    <button
                      onClick={handleStopAll}
                      disabled={isStoppingAll}
                      title="Stop All Sessions"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white rounded-full text-[10px] font-black uppercase tracking-tighter transition-all border border-red-100 cursor-pointer shrink-0"
                    >
                      <FiAlertTriangle size={12} /> {isStoppingAll ? 'Shutting Down...' : 'Stop All'}
                    </button>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                <AnimatePresence mode='popLayout'>

                  {filteredLiveTracking.length > 0 ? (
                    filteredLiveTracking.map((timer) => (
                      <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, x: 20 }} key={timer.id} onClick={() => handleActiveTimerClick(timer)} className="flex items-center gap-4 p-4 bg-slate-100 rounded-[1.8rem] border border-transparent hover:border-gray-200 hover:bg-gray-200 transition-all group">
                        <div className="relative shrink-0">
                          <img src={`https://ui-avatars.com/api/?name=${timer.employee}&background=2563eb&color=fff`} className="h-10 w-10 rounded-2xl object-cover" alt="user" />
                          <div className={`absolute -bottom-1 -right-1 w-3 h-3 border-2 border-white rounded-full ${timer.status === "break" ? "bg-amber-500" : "bg-emerald-500"
                            }`}></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-[11px] font-black text-slate-900 uppercase truncate">
                              {timer.employee} {timer.employeeCode && `(${timer.employeeCode})`}
                            </p>
                          </div>
                          <p className="text-[9px] text-slate-600 font-bold uppercase truncate">{timer.task} - {timer?.projectTitle} ({timer.projectCode})</p>
                        </div>
                        {user?.role === "Admin" && (
                          <>
                            <span className={`tracking-tighter px-3 py-1.5 rounded-full text-[10px] font-black uppercase ${timer.status === "break"
                              ? "bg-amber-100 text-amber-700 border border-amber-200"
                              : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                              }`}>
                              {timer.status === "break" ? "On Break" : "Working"}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStopEmployee(timer);
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white rounded-full text-[10px] font-black uppercase tracking-tighter transition-all border border-red-100 cursor-pointer" title="Stop Session">
                              <FiAlertTriangle size={12} /> {"Stop Session"}
                            </button>
                          </>
                        )}
                      </motion.div>
                    ))
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center italic text-slate-300 gap-2"><p className="text-[10px] uppercase tracking-[0.3em] font-black text-center px-10">No personnel logged into tasks</p></div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* --- ACTIVITY LOG (DATE GROUPED) --- */}
            {user?.role === "Admin" && (
              <div className="lg:col-span-7 bg-slate-900 rounded-[2rem] sm:rounded-[3rem] p-4 sm:p-6 lg:p-8 shadow-2xl border border-slate-800 flex flex-col h-[650px] sm:h-[700px]">                <div className="flex justify-between items-center mb-10 shrink-0 px-2">
                <h3 className="font-black text-white text-sm uppercase tracking-widest">Log History</h3>
                {/* Legend */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">
                      Attendance
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-orange-400" />
                    <span className="text-[8px] font-black text-orange-400 uppercase tracking-widest">
                      Task
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-400" />
                    <span className="text-[8px] font-black text-red-400 uppercase tracking-widest">
                      Difference
                    </span>
                  </div>
                </div>
              </div>

                <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar space-y-12">
                  {Object.keys(groupedLogs).length > 0 ? (
                    Object.keys(groupedLogs)
                      .sort((a, b) => b.localeCompare(a)) // Sort newest date first
                      .map((date) => (
                        <div key={date} className="space-y-3">
                          {/* Date Heading Group */}
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-10 shrink-0 px-1 sm:px-2 gap-4">
                            <div className="flex flex-wrap items-center gap-3">
                              <div className="bg-blue-500/10 p-2 rounded-xl">
                                <HiOutlineCalendarDays className="text-blue-400" size={16} />
                              </div>
                              <span className="text-white font-black text-xs uppercase tracking-[0.2em]">
                                {getFriendlyDate(date)}
                              </span>
                            </div>

                            <button
                              onClick={() => handleClearDay(date)}
                              disabled={isClearing}
                              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-600 text-red-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-red-500/20 cursor-pointer"
                            >
                              <BiTrash size={16} />
                              <span>Clear Logs</span>
                            </button>
                          </div>

                          {/* Entries for this specific date */}
                          <div className="space-y-4 pl-4 border-l border-slate-800 ml-4">
                            {groupedLogs[date].map((log) => (
                              <div key={log.id} className="flex gap-6 items-start group">
                                <div className="flex-1">
                                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 bg-white/5 p-4 sm:p-5 rounded-[1.5rem] sm:rounded-[1.8rem] border border-white/5 hover:border-white/10 transition-all">                                    <span className="font-black text-white text-xs uppercase tracking-tight">
                                    {log.userName} {`(${log.employeeCode || ''})`}
                                  </span>
                                    <div className="flex flex-col sm:items-end gap-2">

                                      {/* Values */}
                                      <div className="flex flex-wrap items-center gap-3">

                                        <span className="text-[10px] font-black text-emerald-400 tracking-tight tabular-nums flex items-center gap-1.5">
                                          <BiTimeFive
                                            className="text-emerald-400"
                                            size={9}
                                          />
                                          {log.attendanceWorked}
                                        </span>

                                        <span className="text-[10px] font-black text-orange-400 tracking-tight tabular-nums flex items-center gap-1.5">
                                          <BiTimeFive
                                            className="text-orange-400"
                                            size={9}
                                          />
                                          {log.totalDailyTime}
                                        </span>

                                        <span className="text-[10px] font-black text-red-400 tracking-tight tabular-nums flex items-center gap-1.5">
                                          <BiTimeFive
                                            className="text-red-400"
                                            size={9}
                                          />
                                          {log.idleFormatted}
                                        </span>

                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-700 text-[10px] font-black uppercase tracking-[0.4em]">
                      Awaiting Daily Summaries
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div >
      <ConfirmModal
        isOpen={confirmState.open}
        onClose={() => setConfirmState({ open: false })}
        onConfirm={handleConfirm}
        title={
          confirmState.action === "STOP_ALL"
            ? "Terminate All Sessions"
            : confirmState.action === "STOP_EMPLOYEE"
              ? "Stop Employee Session"
              : "Clear Logs"
        }
        message={
          confirmState.action === "STOP_ALL"
            ? "This will immediately stop ALL active sessions globally."
            : confirmState.action === "STOP_EMPLOYEE"
              ? `Are you sure you want to stop the active task session for ${confirmState.payload?.employee}?`
              : `This will permanently delete logs for ${confirmState.payload}.`
        }
        confirmText={
          confirmState.action === "STOP_ALL"
            ? "Terminate All"
            : confirmState.action === "STOP_EMPLOYEE"
              ? "Stop Session"
              : "Delete"
        }
        variant="danger"
        isLoading={
          isStoppingAll ||
          isStoppingEmployee ||
          isClearing
        }
      />

    </>
  );
};

export default AdminDashboard;
import React, { useEffect, useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiZap, FiClock, FiTarget, FiBriefcase, FiActivity, FiLock } from "react-icons/fi";
import { HiOutlineBolt } from 'react-icons/hi2';
import { toast } from "react-hot-toast";
import { useGetDashboardSummaryQuery } from "../../services/dashboardApi";
import { useGetMyTodayLogsQuery } from "../../services/timeLogApi";
import { useGetTodayStatusQuery, useClockInMutation, useClockOutMutation } from "../../services/attendanceApi";
import ClockInOut from "../../components/ClockInOut";
import TaskCard from "../../components/TaskCard";
import Loader from "../../components/Loader";
import Pagination from "../../components/Pagination";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import { useSocketEvents } from "../../hooks/useSocketEvents";

export default function EmployeeDashboard() {
  const timerRef = useRef(null);

  const [todaySeconds, setTodaySeconds] = useState(0);
  const [shiftSeconds, setShiftSeconds] = useState(0);
  const [runningTask, setRunningTask] = useState(null);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const {
    data: summaryData,
    isLoading: summaryLoading,
    refetch: refetchSummary
  } = useGetDashboardSummaryQuery();
  const { data: attendanceStatus, isLoading: attendanceLoading, refetch } = useGetTodayStatusQuery();
  const [clockIn, { isLoading: isClockingIn }] = useClockInMutation();
  const [clockOut, { isLoading: isClockingOut }] = useClockOutMutation();
  const { data: logsData, isSuccess: logsLoaded, refetch: refetchLogs } = useGetMyTodayLogsQuery();

  const isSyncingAttendance = isClockingIn || isClockingOut;


  useSocketEvents({
    onDashboardUpdate: () => {
      refetch();
      refetchSummary();
    },
    onTimeLogChange: () => {
      refetchSummary();
      refetchLogs();
    },
    onTaskChange: () => {
      refetchSummary();
    },
  });

  const allActiveTasks = useMemo(() => {
    return summaryData?.taskSnapshot || [];
  }, [summaryData]);

  const paginatedMissions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return allActiveTasks.slice(startIndex, startIndex + itemsPerPage);
  }, [allActiveTasks, currentPage]);

  const isOnShift = attendanceStatus?.clockIn && !attendanceStatus?.clockOut;

  // Sync Logic for Productivity and Active Task
  useEffect(() => {
    if (logsLoaded && logsData) {
      const { logs } = logsData;
      let totalWorkSeconds = 0;
      let activeTaskName = null;
      let isBreak = false;

      const activeLog = logs.find(log => log.isRunning);
      if (activeLog) {
        activeTaskName = activeLog.task?.title || "Active Mission";
        isBreak = activeLog.logType === "break";
      }

      logs.forEach(log => {
        if (log.logType === "work") {
          if (log.isRunning) {
            const diffSec = Math.floor((Date.now() - new Date(log.startTime).getTime()) / 1000);
            totalWorkSeconds += Math.max(0, diffSec);
          } else {
            totalWorkSeconds += (log.rawDurationSeconds || 0);
          }
        }
      });

      setRunningTask(activeTaskName);
      setIsOnBreak(isBreak);
      setTodaySeconds(totalWorkSeconds);
    }
  }, [logsData, logsLoaded]);

  // Productivity Ticker
  useEffect(() => {
    if (runningTask && !isOnBreak) {
      timerRef.current = setInterval(() => setTodaySeconds(prev => prev + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [runningTask, isOnBreak]);

  // Shift Timer Ticker
  useEffect(() => {
    let interval;
    if (isOnShift && attendanceStatus?.lastResumeTime) {
      const savedTime = attendanceStatus.totalSecondsWorked || 0;
      const resumeStart = new Date(attendanceStatus.lastResumeTime).getTime();

      interval = setInterval(() => {
        const currentSessionSeconds = Math.floor((Date.now() - resumeStart) / 1000);
        setShiftSeconds(savedTime + currentSessionSeconds);
      }, 1000);
    } else {
      setShiftSeconds(attendanceStatus?.totalSecondsWorked || 0);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isOnShift, attendanceStatus]);

  const handleAttendanceToggle = async () => {
    try {
      if (isOnShift) {
        await clockOut().unwrap();
        toast.success("Clocked Out Successfully");
      } else {
        await clockIn().unwrap();
        toast.success("Clock In Successfully");
      }
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || "Sync failed");
    }
  };

  const formatTime = (sec) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h}h ${m}m ${s}s`;
  };

  if (attendanceLoading || summaryLoading) return <Loader message="Syncing Systems..." />;

  return (
    <div className="min-h-screen bg-[#f1f5f9]">
      <PageHeader title="Dashboard" />

      {/* --- STATS GRID (5 COLUMNS) --- */}
      <div className="mx-auto px-8 pb-10">

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 my-8">
          <StatCard
            label="Task Timer"
            value={formatTime(todaySeconds)}
            icon={<FiClock className={runningTask && !isOnBreak ? "text-emerald-500 animate-pulse" : "text-slate-400"} />}
            variant={runningTask && !isOnBreak ? "active" : "default"}
          />

          <StatCard
            label="Live Tasks"
            value={allActiveTasks.length}
            icon={<FiTarget className="text-rose-500" />}
          />
          <StatCard
            label="Approved Leaves"
            value={summaryData?.approvedLeavesCount || 0}
            icon={<FiBriefcase className="text-blue-500" />}
          />
          <StatCard
            label="Attendance Timer"
            value={formatTime(shiftSeconds)}
            icon={<FiActivity className={isOnShift ? "text-emerald-500" : ""} />}
          />

          {/* 5th Interactive Attendance Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className={`p-6 rounded-[2.5rem] border-2 flex flex-col gap-1 justify-between transition-all duration-500 bg-white shadow-sm hover:border-orange-100 ${isOnShift ? "border-orange-200 shadow-orange-600/5 shadow-xl" : "border-slate-50"
              }`}
          >
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center mb-1">
              Daily Attendance
            </p>

            <button
              onClick={handleAttendanceToggle}
              disabled={isSyncingAttendance}
              className={`cursor-pointer disabled:cursor-not-allowed w-full py-3 rounded-[1.25rem] font-black text-[11px] uppercase tracking-widest transition-all shadow-md active:scale-95 ${isOnShift
                ? "bg-slate-900 text-white hover:bg-rose-600"
                : "bg-slate-900 text-white hover:bg-orange-600"
                }`}
            >
              {isSyncingAttendance ? "Syncing..." : (isOnShift ? "Clock Out" : "Clock In")}
            </button>

            <p className="text-[9px] font-bold text-slate-400 text-center uppercase tracking-tight h-2">
              {isOnShift && attendanceStatus.clockIn
                ? `Clocked In At ${new Date(attendanceStatus.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : "Clock In To Start Your Shift"}
            </p>
          </motion.div>
        </div>

        {/* --- MAIN CONTENT AREA --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {!isOnShift ? (
            /* LOCKED STATE OVERLAY */
            <div className="col-span-12 py-20 flex items-center justify-center text-center">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white p-12 rounded-[3rem] border-2 border-slate-50 shadow-2xl shadow-slate-200/50 max-w-md w-full"
              >
                <div className="w-24 h-24 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                  <FiLock size={44} />
                </div>
                <h4 className="text-3xl font-black text-slate-800 mb-3 tracking-tighter">Missions Locked</h4>
                <p className="text-slate-500 text-sm mb-10 leading-relaxed">
                  Please clock in using the attendance card above to access your live objectives and tracking systems.
                </p>

              </motion.div>
            </div>
          ) : (
            /* ACTIVE STATE CONTENT */
            <>
              {/* SIDEBAR: PROJECT CHRONOMETER */}
              <div className="lg:col-span-4">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-[#0f1115] p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group"
                >
                  <ClockInOut taskList={allActiveTasks} />
                  <FiZap className="absolute -right-10 -bottom-10 text-white/[0.03]" size={200} />
                </motion.div>
              </div>

              {/* MAIN: ACTIVE OBJECTIVES */}
              <div className="lg:col-span-8">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between px-4">
                    <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                      <HiOutlineBolt className="text-orange-500" /> Active Objectives
                    </h3>
                  </div>

                  <div className="min-h-[500px] space-y-4">
                    <AnimatePresence mode="popLayout">
                      {paginatedMissions.length > 0 ? (
                        paginatedMissions.map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            isTracking={runningTask === task.title && !isOnBreak}
                          />
                        ))
                      ) : (
                        <div className="h-[400px] flex flex-col items-center justify-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
                          <FiBriefcase size={40} className="text-slate-200 mb-4" />
                          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No assigned missions</p>
                        </div>
                      )}
                    </AnimatePresence>
                  </div>

                  {allActiveTasks.length > itemsPerPage && (
                    <div className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm mt-6">
                      <Pagination
                        pagination={{
                          current: currentPage,
                          total: Math.ceil(allActiveTasks.length / itemsPerPage),
                          count: allActiveTasks.length
                        }}
                        onPageChange={setCurrentPage}
                      />
                    </div>
                  )}
                </motion.div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
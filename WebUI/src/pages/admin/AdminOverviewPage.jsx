import React, { useEffect, useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiZap, FiClock, FiTarget, FiBriefcase, FiActivity, FiLock } from "react-icons/fi";
import { HiOutlineBolt } from 'react-icons/hi2';
import { useGetAdminOverviewQuery } from "../../services/dashboardApi";
import ClockInOut from "../../components/ClockInOut";
import TaskCard from "../../components/TaskCard";
import Loader from "../../components/Loader";
import Pagination from "../../components/Pagination";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import { useSocketEvents } from "../../hooks/useSocketEvents";
import { useSelector } from "react-redux";
import { BiTask } from "react-icons/bi";
import { useNavigate } from "react-router-dom";

export default function AdminOverView() {
    const { user } = useSelector((state) => state.auth);
    const navigate = useNavigate();
    const [liveSeconds, setLiveSeconds] = useState(0);
    const [runningTask, setRunningTask] = useState(null);
    const [isUnLocked, setIsUnLocked] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const {
        data: adminOverview, isLoading, refetch
    } = useGetAdminOverviewQuery(undefined, {
        skip: user?.role !== "Admin",
    });

    useSocketEvents({
        onDashboardUpdate: refetch,
        onTimeLogChange: refetch,
        onTaskChange: refetch,
        onAllocationChange: refetch,
    });

    useEffect(() => {
        setRunningTask(adminOverview?.activeTimer?.task || null);
        setLiveSeconds(adminOverview?.todaySeconds || 0);
    }, [adminOverview]);

    const allActiveTasks = useMemo(() => {
        return adminOverview?.taskSnapshot || [];
    }, [adminOverview]);

    const paginatedMissions = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return allActiveTasks.slice(startIndex, startIndex + itemsPerPage);
    }, [allActiveTasks, currentPage]);

    const formatTime = (sec) => {
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = sec % 60;
        return `${h}h ${m}m ${s}s`;
    };

    if (isLoading) return <Loader message="Syncing Systems..." />;

    return (
        <>
            <div className="min-h-[83vh] bg-[#f1f5f9]">
                <PageHeader title="Overview" />

                {/* --- STATS GRID (5 COLUMNS) --- */}
                <div className="mx-auto px-8 pb-10">

                    <div
                        className={`grid grid-cols-1 gap-6 my-8 md:grid-cols-3`}
                    >
                        <StatCard
                            label="Today's Work"
                            value={formatTime(liveSeconds)}
                            icon={<FiClock />}
                        />

                        <StatCard
                            label="Assigned Tasks"
                            value={allActiveTasks.length}
                            icon={<FiTarget />}
                        />

                        <StatCard
                            label="Running Task"
                            value={runningTask || "None"}
                            icon={<BiTask />}
                        />

                    </div>

                    {/* --- MAIN CONTENT AREA --- */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {!isUnLocked ? (
                            <div className="col-span-12 py-20 flex items-center justify-center text-center">
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="bg-white p-12 rounded-[3rem] border-2 border-slate-50 shadow-xl max-w-md w-full"
                                >
                                    <div className="w-24 h-24 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-8">
                                        <FiLock size={44} />
                                    </div>

                                    <h4 className="text-3xl font-black text-slate-800 mb-3">
                                        Tasks Locked
                                    </h4>

                                    <p className="text-slate-500 text-sm mb-8">
                                        Click unlock to access your task timer and assigned tasks.
                                    </p>

                                    <button
                                        onClick={() => setIsUnLocked(true)}
                                        className="cursor-pointer px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs"
                                    >
                                        Unlock Tasks
                                    </button>
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
                                        <ClockInOut
                                            taskList={allActiveTasks}
                                            totalSeconds={liveSeconds}
                                        />
                                    </motion.div>
                                </div>

                                {/* MAIN: ACTIVE OBJECTIVES */}
                                <div className="lg:col-span-8">
                                    <motion.div
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="space-y-2"
                                    >
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                                                <HiOutlineBolt className="text-orange-500" /> Active Objectives
                                            </h3>
                                        </div>

                                        <div className="min-h-[500px] space-y-2">
                                            <AnimatePresence mode="popLayout">
                                                {paginatedMissions.length > 0 ? (
                                                    paginatedMissions.map((task) => (
                                                        <TaskCard
                                                            key={task.id}
                                                            task={task}
                                                            isTracking={runningTask === task.title}
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
        </>
    );
}
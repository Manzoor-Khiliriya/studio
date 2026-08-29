import React, { useState, useMemo } from "react";
import { useGetEmployeeAllocationsQuery } from "../../services/taskAllocationApi";
import Loader from "../../components/Loader";
import PageHeader from "../../components/PageHeader";
import { useSocketEvents } from "../../hooks/useSocketEvents";
import { FiEdit, FiCalendar } from "react-icons/fi";
import AllocationModal from "../../components/AllocationModal";
import useDebounce from "../../hooks/useDebounce";
import { HiOutlineXMark } from "react-icons/hi2";

const getTodayStr = () => new Date().toISOString().split("T")[0];

export default function AdminTaskAllocationPage() {
    const [selectedAllocation, setSelectedAllocation] = useState(null);
    const [selectedDate, setSelectedDate] = useState(getTodayStr());
    const [nameFilter, setNameFilter] = useState("");

    const todayStr = getTodayStr();
    const isToday = selectedDate === todayStr;

    const minDate = useMemo(() => {
        const d = new Date();
        d.setFullYear(d.getFullYear() - 1);
        return d.toISOString().split("T")[0];
    }, []);

    const debouncedNameFilter = useDebounce(
        nameFilter.length > 1 ? nameFilter : "",
        400,
    );

    const hasActiveFilters = !isToday || nameFilter.length > 0;

    const clearFilters = () => {
        setSelectedDate(todayStr);
        setNameFilter("");
    };

    const {
        data: employees = [],
        isLoading,
        isFetching,
        refetch,
    } = useGetEmployeeAllocationsQuery(
        { date: selectedDate, employeeName: debouncedNameFilter },
        {
            refetchOnMountOrArgChange: true,
            refetchOnFocus: isToday,
            refetchOnReconnect: isToday,
            pollingInterval: isToday ? 30000 : 0,
        }
    );
    useSocketEvents({
        onTaskChange: isToday ? refetch : undefined,
        onAllocationChange: isToday ? refetch : undefined,
        onTimeLogChange: isToday ? refetch : undefined,
    });

    if (isLoading) return <Loader message="Loading task allocations..." />;

    return (
        <>
            {selectedAllocation && (
                <AllocationModal
                    allocation={selectedAllocation}
                    onClose={() => setSelectedAllocation(null)}
                    onSuccess={refetch}
                />
            )}

            <div className="max-w-[1750px] mx-auto min-h-[83vh] bg-slate-100">
                <div className="flex flex-wrap items-center justify-between gap-6 pr-8 bg-white">
                    <PageHeader
                        title="Task Allocation"
                        subtitle="Manage employee task priorities and allocations."
                    />
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
                            <input
                                type="text"
                                placeholder="Search employee..."
                                value={nameFilter}
                                onChange={(e) => setNameFilter(e.target.value)}
                                className="text-[11px] font-black text-slate-700 bg-transparent outline-none w-32"
                            />
                        </div>
                        <div className="flex items-center cursor-pointer gap-2 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
                            <FiCalendar size={14} className="text-slate-400" />
                            <input
                                type="date"
                                value={selectedDate}
                                min={minDate}
                                max={todayStr}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="text-[11px] font-black text-slate-700 bg-transparent outline-none cursor-pointer"
                            />
                        </div>

                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="shadow-sm flex items-center gap-1.5 px-4 py-2.5 text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest cursor-pointer"
                            >
                                <HiOutlineXMark size={16} strokeWidth={2.5} />
                                <span>RESET FILTERS</span>
                            </button>
                        )}

                        <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-200 pr-3">
                                Employees
                            </span>
                            <span className="text-[11px] font-black text-slate-700">
                                {employees.length}
                            </span>
                        </div>
                    </div>
                </div>

                {employees.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[50vh]">
                        <div className="py-10 text-center">
                            <h3 className="text-lg font-black text-slate-800">
                                {isToday ? "No Active Allocations Found" : "No Allocations Found"}
                            </h3>
                            <p className="mt-2 text-sm text-slate-600">
                                {isToday
                                    ? "No employee task allocations are available yet."
                                    : `No employee task allocations are available for ${selectedDate}.`}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="p-8 grid grid-cols-1 xl:grid-cols-2 gap-3">
                        {employees.map((group) => (
                            <div
                                key={group.employee._id}
                                className="bg-white border border-slate-300 shadow-sm overflow-hidden rounded-xl"
                            >
                                {/* EMPLOYEE NAME */}
                                <div className="px-2 py-3 text-center border-b border-slate-300 bg-slate-200 flex items-center justify-between gap-2">
                                    <h2 className="text-lg font-black uppercase text-slate-900">
                                        {group.employee?.user?.name} {group.employee.employeeCode ? `(${group.employee?.user?.role} - ${group.employee?.employeeCode})` : `(${group.employee?.user?.role})`}
                                    </h2>
                                    <span className="text-[9px] font-black text-slate-800 uppercase tracking-widest">
                                        {group.tasks.length} tasks
                                    </span>
                                </div>

                                {/* FIXED HEADER */}
                                <table className="w-full table-fixed">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="w-[13%] px-2 py-2 text-left text-[10px] uppercase font-black text-slate-500">Project</th>
                                            <th className="w-[18%] px-1 py-2 text-left text-[10px] uppercase font-black text-slate-500">Task</th>
                                            <th className="w-[15%] px-2 py-2 text-left text-[10px] uppercase font-black text-slate-500">Project Type</th>
                                            <th className="w-[7%] px-1 py-2 text-left text-[10px] uppercase font-black text-slate-500">Priority</th>
                                            <th className="w-[7%] px-1 py-2 text-left text-[10px] uppercase font-black text-slate-500">Role</th>
                                            <th className="w-[11%] px-1 py-2 text-left text-[10px] uppercase font-black text-slate-500">
                                                Target Hrs
                                            </th>
                                            <th className="w-[11%] px-1 py-2 text-left text-[10px] uppercase font-black text-slate-500">
                                                Actual Hrs
                                            </th>
                                            <th className="w-[10%] px-1 py-2 text-left text-[10px] uppercase font-black text-slate-500">
                                                Proficiency
                                            </th>
                                            <th className="w-[8%] px-1 py-2 text-left text-[10px] uppercase font-black text-slate-500">Action</th>
                                        </tr>
                                    </thead>
                                </table>

                                {/* SCROLLABLE BODY */}
                                <div className="overflow-y-auto max-h-[84px] custom-scrollbar">
                                    <table className="w-full table-fixed">
                                        <tbody>
                                            {(() => {
                                                const live = group.tasks.find(a => a.isCurrentlyWorking);
                                                const sorted = [
                                                    ...(live ? [live] : []),
                                                    ...group.tasks.filter(a => a._id !== live?._id),
                                                ];
                                                return sorted.map((allocation) => (
                                                    <tr key={allocation._id} className={`border-t border-slate-100 ${allocation.isCurrentlyWorking ? "bg-emerald-100" : ""}`}>
                                                        <td className="w-[13%] px-2 py-2">
                                                            <p className="text-[10px] font-black text-slate-700 uppercase truncate">
                                                                {allocation.task?.project?.title}
                                                            </p>
                                                        </td>
                                                        <td className="w-[18%] px-1 py-2">
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-[10px] font-black text-slate-700 uppercase truncate">
                                                                    {allocation.task?.title}
                                                                </p>
                                                                {allocation.isCurrentlyWorking && (
                                                                    <span className="inline-flex shrink-0 items-center gap-1 text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                                                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse inline-block" />
                                                                        Live
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="w-[15%] px-2 py-2">
                                                            <p className="text-[10px] font-black text-slate-700 truncate">
                                                                {allocation.task?.project?.projectType?.name || ""}
                                                            </p>
                                                        </td>
                                                        <td className="w-[7%] px-2 py-2">
                                                            <p className="text-[10px] font-black text-slate-700">{allocation.priorityOrder}</p>
                                                        </td>
                                                        <td className="w-[7%] px-2 py-2">
                                                            <p className={`text-[10px] font-black ${allocation.role === "Main" ? "text-orange-600" : "text-slate-700"}`}>
                                                                {allocation.role}
                                                            </p>
                                                        </td>
                                                        {/* TARGET HRS */}
                                                        <td className="w-[11%] px-2 py-2">
                                                            <p className="text-[10px] font-black text-slate-700">
                                                                {allocation.todayAllocatedFormatted || "0h 0m 0s"}
                                                            </p>
                                                        </td>

                                                        {/* ACTUAL HRS */}
                                                        <td className="w-[11%] px-2 py-2">
                                                            <p
                                                                className={`text-[10px] font-black ${allocation.isOverWorked
                                                                    ? "text-rose-600"
                                                                    : "text-emerald-600"
                                                                    }`}
                                                            >
                                                                {allocation.todayWorkedFormatted || "0h 0m 0s"}
                                                            </p>
                                                        </td>

                                                        {/* PROFICIENCY */}
                                                        <td className="w-[10%] px-2 py-2">
                                                            {(() => {
                                                                const proficiency = allocation.proficiency;
                                                                if (proficiency === null || proficiency === undefined) {
                                                                    return <p className="text-[10px] font-black text-emerald-600">100%</p>;
                                                                }
                                                                const colorClass =
                                                                    proficiency >= 100
                                                                        ? "text-emerald-600"
                                                                        : proficiency >= 70
                                                                            ? "text-amber-600"
                                                                            : "text-rose-600";
                                                                return (
                                                                    <p className={`text-[10px] font-black ${colorClass}`}>
                                                                        {proficiency}%
                                                                    </p>
                                                                );
                                                            })()}
                                                        </td>
                                                        <td className="w-[8%] px-2 py-2">
                                                            <button
                                                                onClick={() => setSelectedAllocation(allocation)}
                                                                className="text-yellow-500 hover:text-yellow-600 rounded-lg transition-all duration-200 active:scale-90 cursor-pointer"
                                                            >
                                                                <FiEdit size={18} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ));
                                            })()}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div >
        </>
    );
}
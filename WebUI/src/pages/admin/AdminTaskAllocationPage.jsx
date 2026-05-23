import React, { useState } from "react";
import { useGetEmployeeAllocationsQuery } from "../../services/taskAllocationApi";
import Loader from "../../components/Loader";
import PageHeader from "../../components/PageHeader";
import { useSocketEvents } from "../../hooks/useSocketEvents";
import { FiEdit, FiEdit2 } from "react-icons/fi";
import AllocationModal from "../../components/AllocationModal";

export default function AdminTaskAllocationPage() {
    const [selectedAllocation, setSelectedAllocation] = useState(null);

    const {
        data: employees = [],
        isLoading,
        refetch,
    } = useGetEmployeeAllocationsQuery(
        undefined,
        {
            refetchOnMountOrArgChange: true,
            refetchOnFocus: true,
            refetchOnReconnect: true,
            pollingInterval: 30000,
        }
    );

    useSocketEvents({
        onTaskChange: refetch,
        onAllocationChange: refetch,
        onTimeLogChange: refetch,
    });

    if (isLoading) return <Loader />;

    return (
        <>
            {selectedAllocation && (
                <AllocationModal
                    allocation={selectedAllocation}
                    onClose={() => setSelectedAllocation(null)}
                    onSuccess={refetch}
                />
            )}

            <div className="max-w-[1750px] mx-auto min-h-screen bg-slate-100">
                <div className="flex flex-wrap items-center justify-between gap-6 pr-8 bg-white">
                    <PageHeader
                        title="Task Allocation"
                        subtitle="Manage employee task priorities and allocations."
                    />
                    <div className="flex items-center gap-3">
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

                <div className="p-8 grid grid-cols-1 xl:grid-cols-2 gap-3">
                    {employees.map((group) => (
                        <div
                            key={group.employee._id}
                            className="bg-white border border-slate-300 shadow-sm overflow-hidden rounded-xl"
                        >
                            {/* EMPLOYEE NAME */}
                            <div className="px-6 py-3 text-center border-b border-slate-300 bg-slate-200">
                                <h2 className="text-lg font-black uppercase text-slate-900">
                                    {group.employee?.user?.name} - ({group.employee?.employeeCode})
                                </h2>
                            </div>

                            {/* FIXED HEADER */}
                            <table className="w-full table-fixed">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="w-1/6 px-2 py-2 text-left text-[10px] uppercase font-black text-slate-500">Project</th>
                                        <th className="w-1/6 px-1 py-2 text-left text-[10px] uppercase font-black text-slate-500">Task</th>
                                        <th className="w-1/9 px-1 py-2 text-left text-[10px] uppercase font-black text-slate-500">Priority</th>
                                        <th className="w-1/9 px-1 py-2 text-left text-[10px] uppercase font-black text-slate-500">Role</th>
                                        <th className="w-2/5 px-1 py-2 text-left text-[10px] uppercase font-black text-slate-500">Today</th>
                                        <th className="w-1/12 px-1 py-2 text-left text-[10px] uppercase font-black text-slate-500">Action</th>
                                    </tr>
                                </thead>
                            </table>

                            {/* SCROLLABLE BODY */}
                            <div className="overflow-y-auto max-h-[42px] custom-scrollbar">
                                <table className="w-full table-fixed">
                                    <tbody>
                                        {(() => {
                                            const live = group.tasks.find(a => a.isCurrentlyWorking);
                                            const sorted = [
                                                ...(live ? [live] : []),
                                                ...group.tasks.filter(a => a._id !== live?._id),
                                            ];
                                            return sorted.map((allocation) => (
                                                <tr key={allocation._id} className={`border-t border-slate-100 ${allocation.isCurrentlyWorking ? "bg-emerald-50/50" : ""}`}>
                                                    <td className="w-1/6 px-2 py-2">
                                                        <p className="text-[10px] font-black text-slate-700 uppercase truncate">
                                                            {allocation.task?.project?.title}
                                                        </p>
                                                    </td>
                                                    <td className="w-1/6 px-2 py-2">
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
                                                    <td className="w-1/9 px-2 py-2">
                                                        <p className="text-[10px] font-black text-slate-700">{allocation.priorityOrder}</p>
                                                    </td>
                                                    <td className="w-1/9 px-2 py-2">
                                                        <p className={`text-[10px] font-black ${allocation.role === "Main" ? "text-orange-600" : "text-slate-700"}`}>
                                                            {allocation.role}
                                                        </p>
                                                    </td>
                                                    <td className="w-2/5 px-2 py-2">
                                                        <div className="flex items-center gap-3 text-[10px] font-black">
                                                            <span className="text-slate-700 w-[120px] shrink-0">
                                                                {allocation.todayAllocatedFormatted || "0 Hrs 0 Mins 0 Secs"}
                                                            </span>
                                                            {allocation.isOverWorked ? (
                                                                <span className="text-rose-600">+ {allocation.overWorkedFormatted}</span>
                                                            ) : (
                                                                <span className="text-emerald-600">{allocation.todayWorkedFormatted || "0 Hrs 0 Mins 0 Secs"}</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="w-1/12 px-2 py-2">
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
            </div >
        </>
    );
}
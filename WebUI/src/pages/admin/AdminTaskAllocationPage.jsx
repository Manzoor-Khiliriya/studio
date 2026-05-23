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

                <div className="p-8 grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {employees.map((group) => (
                        <div
                            key={group.employee._id}
                            className="bg-white border border-slate-300 shadow-sm overflow-visible"
                        >
                            <div className="px-6 py-3 text-center border-b border-slate-300 bg-slate-200">
                                <h2 className="text-lg font-black uppercase text-slate-900">
                                    {group.employee?.user?.name} - ({group.employee?.employeeCode})
                                </h2>
                            </div>

                            <table className="w-full">
                                <thead>
                                    <tr>
                                        <th className="px-5 py-2 text-left text-[10px] uppercase font-black text-slate-500">Project</th>
                                        <th className="px-5 py-2 text-left text-[10px] uppercase font-black text-slate-500">Task</th>
                                        <th className="px-5 py-2 text-left text-[10px] uppercase font-black text-slate-500">Priority</th>
                                        <th className="px-5 py-2 text-left text-[10px] uppercase font-black text-slate-500">Role</th>
                                        <th className="px-5 py-2 text-left text-[10px] uppercase font-black text-slate-500">Today</th>
                                        <th className="px-5 py-2 text-left text-[10px] uppercase font-black text-slate-500">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {group.tasks.map((allocation) => (
                                        <tr key={allocation._id} className="border-t border-slate-100">
                                            <td className="px-5 py-3">
                                                <span className="text-sm font-bold text-slate-700 uppercase">
                                                    {allocation.task?.project?.title}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className="text-sm font-bold text-slate-700 uppercase">
                                                    {allocation.task?.title}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className="text-sm font-bold text-slate-700">
                                                    {allocation.priorityOrder}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className={`text-[10px] font-black ${allocation.role === "Main" ? " text-orange-600" : "text-slate-700"}`}>
                                                    {allocation.role}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-3 text-[10px] font-black">
                                                    <span className="text-slate-700 w-[100px]">
                                                        {allocation.todayAllocatedFormatted || "0 Hrs 0 Mins 0 Secs"}
                                                    </span>
                                                    {allocation.isOverWorked ? (
                                                        <span className="text-rose-600">
                                                            + {allocation.overWorkedFormatted}
                                                        </span>
                                                    ) : (
                                                        <span className="text-emerald-600">
                                                            {allocation.todayWorkedFormatted || "0 Hrs 0 Mins 0 Secs"}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3">
                                                <button
                                                    onClick={() => setSelectedAllocation(allocation)}
                                                    className="text-yellow-500 hover:text-yellow-600 rounded-lg transition-all duration-200 active:scale-90 cursor-pointer"
                                                    title="Update Allocation"
                                                >
                                                    <FiEdit size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}
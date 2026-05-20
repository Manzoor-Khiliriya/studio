import React from "react";
import {
    useGetEmployeeAllocationsQuery,
    useUpdateTaskAllocationMutation,
} from "../../services/taskAllocationApi";
import Loader from "../../components/Loader";
import { toast } from "react-hot-toast";
import PageHeader from "../../components/PageHeader";
import CustomDropdown from "../../components/CustomDropdown";

export default function AdminTaskAllocationPage() {
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
        }
    );

    const [updateAllocation] = useUpdateTaskAllocationMutation();

    const handleUpdate = async (id, field, value) => {
        try {
            await updateAllocation({
                id,
                [field]: value,
            }).unwrap();

            toast.success("Updated");

            refetch();
        } catch (err) {
            toast.error(err?.data?.message || "Update failed");
        }
    };

    if (isLoading) return <Loader />;

    return (
        <div className="max-w-[1750px] mx-auto min-h-screen bg-slate-100">
            {/* HEADER */}

            <div className="flex flex-wrap items-center justify-between gap-6 pr-8 bg-white">
                <PageHeader
                    title="Task History"
                    subtitle=" Manage employee task priorities and allocations."
                />

                {/* RIGHT */}
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
                        {/* EMPLOYEE HEADER */}
                        <div className="px-6 py-3 text-center border-b border-slate-300 bg-slate-200">
                            <h2 className="text-lg font-black uppercase text-slate-900">
                                {group.employee?.user?.name} - ({group.employee?.employeeCode})
                            </h2>
                        </div>

                        {/* TASK TABLE */}
                        <div className="">
                            <table className="w-full">
                                <thead className="">
                                    <tr>
                                        <th className="px-6 py-2 text-left text-[10px] uppercase font-black text-slate-500">
                                            Project
                                        </th>

                                        <th className="px-6 py-2 text-left text-[10px] uppercase font-black text-slate-500">
                                            Task
                                        </th>

                                        <th className="px-6 py-2 text-left text-[10px] uppercase font-black text-slate-500">
                                            Priority
                                        </th>

                                        <th className="px-6 py-2 text-left text-[10px] uppercase font-black text-slate-500">
                                            Role
                                        </th>

                                        <th className="px-6 py-2 text-left text-[10px] uppercase font-black text-slate-500">
                                            Time Allocated
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {group.tasks.map((allocation) => (
                                        <tr
                                            key={allocation._id}
                                            className="border-t border-slate-100"
                                        >
                                            <td className="px-6 py-3`">
                                                <span className="font-black text-slate-900 text-sm uppercase">
                                                    {allocation.task?.project?.title}
                                                </span>
                                            </td>

                                            {/* TASK */}
                                            <td className="px-6 py-3`">
                                                <span className="font-black text-slate-900 text-sm uppercase">
                                                    {allocation.task?.title}
                                                </span>
                                            </td>

                                            {/* PRIORITY */}
                                            <td className="px-6 py-3">
                                                <input
                                                    type="number"
                                                    min={1}
                                                    defaultValue={allocation.priorityOrder}
                                                    onBlur={(e) =>
                                                        handleUpdate(
                                                            allocation._id,
                                                            "priorityOrder",
                                                            Number(e.target.value),
                                                        )
                                                    }
                                                    className="w-12 py-2 text-sm text-center font-bold outline-none"
                                                />
                                            </td>

                                            {/* ROLE */}
                                            <td className="px-6 py-3">
                                                <CustomDropdown
                                                    value={allocation.role}
                                                    onChange={(val) =>
                                                        handleUpdate(allocation._id, "role", val)
                                                    }
                                                    options={[
                                                        {
                                                            label: "Main",
                                                            value: "Main",
                                                        },
                                                        {
                                                            label: "Support",
                                                            value: "Support",
                                                        },
                                                    ]}
                                                    className="w-22"
                                                    buttonClass="
    w-full
    py-2
    text-sm
    font-bold
    bg-white
    text-slate-700
  "
                                                />
                                            </td>

                                            {/* HOURS */}
                                            <td className="px-6 py-3">
                                                <input
                                                    type="number"
                                                    min={0}
                                                    defaultValue={allocation.allocatedHours}
                                                    onBlur={(e) =>
                                                        handleUpdate(
                                                            allocation._id,
                                                            "allocatedHours",
                                                            Number(e.target.value),
                                                        )
                                                    }
                                                    className="w-12 py-2 text-center text-sm font-bold outline-none"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

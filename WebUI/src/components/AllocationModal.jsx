import React, { useState } from "react";
import CommonModal, { InputGroup } from "./CommonModal";
import CustomDropdown from "./CustomDropdown";
import { toast } from "react-hot-toast";
import { useUpdateTaskAllocationMutation } from "../services/taskAllocationApi";

export default function AllocationModal({ allocation, onClose, onSuccess }) {
    const [hours, setHours] = useState(Math.floor((allocation.todayAllocatedSeconds || 0) / 3600));
    const [minutes, setMinutes] = useState(Math.floor(((allocation.todayAllocatedSeconds || 0) % 3600) / 60));
    const [seconds, setSeconds] = useState((allocation.todayAllocatedSeconds || 0) % 60);
    const [role, setRole] = useState(allocation.role);
    const [priorityOrder, setPriorityOrder] = useState(allocation.priorityOrder);

    // "reassign" = close current slot and start fresh | "edit" = just fix current slot
    const [mode, setMode] = useState("reassign");

    const [updateAllocation, { isLoading }] = useUpdateTaskAllocationMutation();

    const handleSave = async () => {
        try {
            await updateAllocation({
                id: allocation._id,
                hours, minutes, seconds, role, priorityOrder,
                reassign: mode === "reassign",
            }).unwrap();
            toast.success(mode === "reassign" ? "Task reassigned" : "Allocation updated");
            onSuccess();
            onClose();
        } catch (err) {
            toast.error(err?.data?.message || "Update failed");
        }
    };

    return (
        <CommonModal
            isOpen={true}
            onClose={onClose}
            title="Update Allocation"
            submitText={mode === "reassign" ? "Reassign" : "Update"}
            isLoading={isLoading}
            onSubmit={handleSave}
            maxWidth="max-w-md"
        >
            {/* INFO */}
            <div className="bg-slate-50 flex items-center justify-center gap-2 mx-auto rounded-xl px-4 py-3 mb-5">
                <p className="text-sm font-black text-slate-700 uppercase">
                    {allocation.task?.project?.title} -
                </p>
                <p className="text-sm font-black text-slate-700 uppercase">
                    {allocation.task?.title}
                </p>
                {allocation.slotCount > 1 && (
                    <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                        Slot {allocation.slotIndex}
                    </span>
                )}
            </div>

            <div className="space-y-4">

                {/* MODE TOGGLE */}
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                    {[
                        { key: "reassign", label: "Assign Again" },
                        { key: "edit", label: "Fix Current" },
                    ].map((m) => (
                        <button
                            key={m.key}
                            type="button"
                            onClick={() => setMode(m.key)}
                            className={`py-2 rounded-lg text-[11px] font-black uppercase transition-all cursor-pointer ${
                                mode === m.key
                                    ? "bg-white text-orange-600 shadow-sm"
                                    : "text-slate-500 hover:text-slate-700"
                            }`}
                        >
                            {m.label}
                        </button>
                    ))}
                </div>

                <p className="text-[10px] font-bold text-slate-500 -mt-2">
                    {mode === "reassign"
                        ? "Saves today's current time as it is and starts a new slot from 0h 0m 0s."
                        : "Only corrects the target time of the current slot. No new slot is created."}
                </p>

                {/* PRIORITY + ROLE */}
                <div className="grid grid-cols-2 gap-3">
                    <InputGroup label="Priority Order">
                        <input
                            type="number"
                            min={1}
                            value={priorityOrder}
                            onChange={(e) => setPriorityOrder(Number(e.target.value))}
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-orange-400"
                        />
                    </InputGroup>
                    <InputGroup label="Role">
                        <CustomDropdown
                            value={role}
                            onChange={setRole}
                            options={[
                                { label: "Main", value: "Main" },
                                { label: "Support", value: "Support" },
                            ]}
                            buttonClass="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold"
                        />
                    </InputGroup>
                </div>

                {/* ALLOCATED TIME */}
                <InputGroup label={mode === "reassign" ? "New Slot Allocated Time" : "Today's Allocated Time"}>
                    <div className="flex items-center gap-2">
                        <div className="flex-1">
                            <input
                                type="number"
                                min={0}
                                max={23}
                                value={hours}
                                onChange={(e) => setHours(Number(e.target.value))}
                                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-center outline-none focus:border-orange-400"
                            />
                            <p className="text-[9px] text-slate-400 font-black text-center mt-1">HRS</p>
                        </div>
                        <span className="text-slate-300 font-black text-lg mb-4">:</span>
                        <div className="flex-1">
                            <input
                                type="number"
                                min={0}
                                max={59}
                                value={minutes}
                                onChange={(e) => setMinutes(Number(e.target.value))}
                                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-center outline-none focus:border-orange-400"
                            />
                            <p className="text-[9px] text-slate-400 font-black text-center mt-1">MIN</p>
                        </div>
                        <span className="text-slate-300 font-black text-lg mb-4">:</span>
                        <div className="flex-1">
                            <input
                                type="number"
                                min={0}
                                max={59}
                                value={seconds}
                                onChange={(e) => setSeconds(Number(e.target.value))}
                                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-center outline-none focus:border-orange-400"
                            />
                            <p className="text-[9px] text-slate-400 font-black text-center mt-1">SEC</p>
                        </div>
                    </div>
                </InputGroup>

                {/* WORKED TODAY */}
                <div className="bg-slate-50 rounded-xl px-4 py-3 flex items-center justify-between">
                    <span className="text-sm font-black text-slate-700 uppercase tracking-widest">
                        Worked Today :
                    </span>
                    <span className="text-sm font-black text-emerald-600">
                        {allocation.todayWorkedFormatted || "0h 0m 0s"}
                        {allocation.isOverWorked && (
                            <span className="text-rose-600 text-[10px] ml-2">
                                (+{allocation.overWorkedFormatted})
                            </span>
                        )}
                    </span>
                </div>

            </div>
        </CommonModal>
    );
}
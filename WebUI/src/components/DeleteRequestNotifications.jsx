import React, { useState, useRef } from "react";
import { HiOutlineTrash, HiOutlineCheck, HiOutlineXMark } from "react-icons/hi2";
import { FiShield } from "react-icons/fi";
import { useGetPendingDeleteRequestsQuery, useRespondToDeleteRequestMutation } from "../services/userApi";
import { useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useOnClickOutside } from "../hooks/useOnClickOutside";

export default function DeleteRequestNotifications() {
    const { user } = useSelector((state) => state.auth);
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef();

    useOnClickOutside(ref, () => setIsOpen(false));

    const { data: pendingRequests = [], refetch } = useGetPendingDeleteRequestsQuery(undefined, {
        skip: user?.role !== "Admin",
        pollingInterval: 30000,
    });

    const [respondToDeleteRequest, { isLoading }] = useRespondToDeleteRequestMutation();

    const handleRespond = async (requestId, action) => {
        const t = toast.loading(action === "approve" ? "Approving..." : "Rejecting...");
        try {
            const result = await respondToDeleteRequest({ requestId, action }).unwrap();
            toast.success(result.message, { id: t });
            refetch();
        } catch (err) {
            toast.error(err?.data?.message || "Failed", { id: t });
        }
    };

    if (user?.role !== "Admin") return null;

    return (
        <div className="relative" ref={ref}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen((prev) => !prev)}
                className={`p-2.5 rounded-xl transition-all border relative cursor-pointer ${
                    isOpen
                        ? "bg-orange-100 border-orange-200 text-orange-600 shadow-inner"
                        : "bg-white border-slate-100 text-slate-500 hover:border-orange-200 hover:bg-orange-200 shadow-sm"
                }`}
            >
                <FiShield size={20} />
                {pendingRequests.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full animate-bounce" />
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 15, scale: 0.95 }}
                        className="absolute right-0 mt-3 w-80 md:w-96 bg-white rounded-[2rem] shadow-2xl shadow-orange-900/10 border border-orange-50 overflow-hidden z-50"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-orange-50 flex justify-between items-center bg-orange-50/30">
                            <div>
                                <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">
                                    Admin Delete Requests
                                </h3>
                                <p className="text-[9px] text-slate-400 font-bold mt-0.5">
                                    Requires your consent to proceed
                                </p>
                            </div>
                            <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                                {pendingRequests.length} PENDING
                            </span>
                        </div>

                        {/* List */}
                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                            {pendingRequests.length === 0 ? (
                                <div className="p-12 text-center flex flex-col items-center gap-3">
                                    <FiShield className="text-slate-200" size={40} />
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                        No Pending Requests
                                    </p>
                                </div>
                            ) : (
                                pendingRequests.map((req) => (
                                    <div
                                        key={req._id}
                                        className="px-5 py-4 border-b border-slate-50 hover:bg-slate-50 transition-all"
                                    >
                                        {/* Request Info */}
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className="w-9 h-9 bg-rose-100 rounded-xl flex items-center justify-center shrink-0">
                                                <HiOutlineTrash size={14} className="text-rose-500" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[11px] font-black text-slate-800 uppercase truncate">
                                                    {req.targetUser?.name}
                                                </p>
                                                <p className="text-[9px] text-slate-400 font-bold mt-0.5">
                                                    Requested by {req.requestedBy?.name}
                                                </p>
                                                <p className="text-[9px] text-slate-400 font-bold mt-0.5">
                                                    {req.approvals?.length} approval{req.approvals?.length !== 1 ? "s" : ""} so far
                                                </p>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleRespond(req._id, "approve")}
                                                disabled={isLoading}
                                                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                                            >
                                                <HiOutlineCheck size={12} />
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleRespond(req._id, "reject")}
                                                disabled={isLoading}
                                                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-rose-500 hover:bg-rose-600 text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                                            >
                                                <HiOutlineXMark size={12} />
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
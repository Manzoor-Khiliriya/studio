import React, { useState, useRef } from "react";
import { HiOutlineTrash, HiOutlineCheck, HiOutlineXMark } from "react-icons/hi2";
import { FiShield } from "react-icons/fi";
import { useGetPendingDeleteRequestsQuery, useRespondToDeleteRequestMutation } from "../services/userApi";
import { useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useOnClickOutside } from "../hooks/useOnClickOutside";
import { useSocketEvents } from "../hooks/useSocketEvents";

export default function DeleteRequestNotifications() {
    const { user } = useSelector((state) => state.auth);
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef();

    useOnClickOutside(ref, () => setIsOpen(false));

    const { data: allRequests = [], refetch } = useGetPendingDeleteRequestsQuery(undefined, {
        skip: user?.role !== "Admin",
        pollingInterval: 30000,
    });

    const [respondToDeleteRequest, { isLoading }] = useRespondToDeleteRequestMutation();

    useSocketEvents({
        onDeleteRequestChange: refetch,
    });

    // Requests needing action (not responded yet)
    const pendingAction = allRequests.filter((r) => !r.hasResponded && r.status === "Pending");

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
    // if (allRequests.length === 0) return null;

    return (
        <div className="relative" ref={ref}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen((prev) => !prev)}
                className={`p-2.5 rounded-xl transition-all border relative cursor-pointer ${isOpen
                        ? "bg-orange-100 border-orange-200 text-orange-600 shadow-inner"
                        : "bg-white border-slate-100 text-slate-500 hover:border-orange-200 hover:bg-orange-200 shadow-sm"
                    }`}
            >
                <FiShield size={20} />
                {pendingAction.length > 0 && (
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
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-orange-50/30">
                            <div>
                                <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">
                                    Admin Delete Requests
                                </h3>
                                <p className="text-[9px] text-slate-400 font-bold mt-0.5">
                                    {pendingAction.length} awaiting your consent
                                </p>
                            </div>
                            <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                                {pendingAction.length} TOTAL
                            </span>
                        </div>

                        {/* List */}
                        <div className="max-h-[420px] overflow-y-auto custom-scrollbar divide-y divide-slate-50">
                            {allRequests.map((req) => (
                                <div key={req._id} className="px-5 py-4 hover:bg-slate-50 transition-all">

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
                                        </div>
                                    </div>

                                    {/* Who responded */}
                                    <div className="mb-3 space-y-1">
                                        {req.approvals?.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {req.approvals.map((a) => (
                                                    <span key={a._id} className="text-[8px] font-black bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full uppercase">
                                                        ✓ {a.name}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        {req.rejections?.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {req.rejections.map((a) => (
                                                    <span key={a._id} className="text-[8px] font-black bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full uppercase">
                                                        ✗ {a.name}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions or status */}
                                    {req.hasResponded ? (
                                        <div className={`text-center py-2 rounded-xl text-[9px] font-black uppercase tracking-widest ${req.myAction === "approved"
                                                ? "bg-emerald-50 text-emerald-600"
                                                : req.myAction === "rejected"
                                                    ? "bg-rose-50 text-rose-600"
                                                    : "bg-slate-50 text-slate-500"
                                            }`}>
                                            {req.myAction === "approved" && "✓ You approved this request"}
                                            {req.myAction === "rejected" && "✗ You rejected this request"}
                                            {req.myAction === "requested" && "↑ You initiated this request"}
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleRespond(req._id, "approve")}
                                                disabled={isLoading}
                                                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                                            >
                                                <HiOutlineCheck size={12} /> Approve
                                            </button>
                                            <button
                                                onClick={() => handleRespond(req._id, "reject")}
                                                disabled={isLoading}
                                                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-rose-500 hover:bg-rose-600 text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                                            >
                                                <HiOutlineXMark size={12} /> Reject
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
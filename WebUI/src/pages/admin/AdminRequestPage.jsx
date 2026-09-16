import React, { useState } from 'react';
import { HiOutlineCheck, HiOutlineXMark, HiOutlineClock } from 'react-icons/hi2';
import { toast } from 'react-hot-toast';
import {
    useGetAdjustmentRequestsQuery,
    useReviewAdjustmentRequestMutation,
} from '../../services/timeLogAdjustmentApi';
import CustomDropdown from '../../components/CustomDropdown';
import ConfirmModal from '../../components/ConfirmModal';

const formatDateTime = (d) =>
    new Date(d).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    });

const AdminRequestPage = () => {
    const [statusFilter, setStatusFilter] = useState('Pending');
    const { data: requests = [], isLoading } = useGetAdjustmentRequestsQuery(statusFilter);
    const [reviewRequest, { isLoading: isReviewing }] = useReviewAdjustmentRequestMutation();

    const [confirmState, setConfirmState] = useState({ open: false, request: null, decision: null });

    const handleDecision = (request, decision) => {
        setConfirmState({ open: true, request, decision });
    };

    const handleConfirm = async () => {
        const { request, decision } = confirmState;
        try {
            await reviewRequest({ id: request._id, decision }).unwrap();
            toast.success(`Request ${decision.toLowerCase()}`);
        } catch (err) {
            toast.error(err?.data?.error || 'Failed to review request');
        } finally {
            setConfirmState({ open: false, request: null, decision: null });
        }
    };

    return (
        <div className="bg-white rounded-[2rem] border border-slate-200 p-6 sm:p-8 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
                <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest">
                    Time Correction Requests
                </h3>

                <CustomDropdown
                    value={statusFilter}
                    onChange={setStatusFilter}
                    options={[
                        { value: 'All', label: 'All Requests' },
                        { value: 'Pending', label: 'Pending' },
                        { value: 'Approved', label: 'Approved' },
                        { value: 'Rejected', label: 'Rejected' },
                    ]}
                    placeholder="Filter by Status"
                    buttonClass="py-1.5 px-4 bg-slate-100/80 rounded-xl border border-slate-200/50 shadow-sm text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer text-slate-500 hover:text-slate-800 min-w-[140px]"
                />
            </div>

            {isLoading ? (
                <p className="text-[11px] text-slate-400 font-bold uppercase text-center py-10">Loading...</p>
            ) : requests.length === 0 ? (
                <p className="text-[11px] text-slate-400 font-bold uppercase text-center py-10">
                    No {statusFilter !== 'All' ? statusFilter.toLowerCase() : ''} requests found
                </p>
            ) : (
                <div className="space-y-4">
                    {requests.map((req) => (
                        <div
                            key={req._id}
                            className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100"
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[11px] font-black text-slate-900 uppercase">
                                        {req.user?.name} {req.user?.employee?.employeeCode && `(${req.user.employee.employeeCode})`}
                                    </span>
                                    <span
                                        className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${req.status === 'Pending'
                                                ? 'bg-amber-100 text-amber-700'
                                                : req.status === 'Approved'
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-red-100 text-red-700'
                                            }`}
                                    >
                                        {req.status}
                                    </span>
                                </div>

                                <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">
                                    {req.task?.title || 'Untitled Task'}
                                </p>

                                <div className="flex items-center gap-4 mt-2 text-[10px] font-bold text-slate-600">
                                    <span className="flex items-center gap-1">
                                        <HiOutlineClock size={11} className="text-slate-400" />
                                        Recorded stop: {formatDateTime(req.originalEndTime)}
                                    </span>
                                    <span className="text-slate-300">→</span>
                                    <span className="text-emerald-600">
                                        Requested: {formatDateTime(req.requestedEndTime)}
                                    </span>
                                </div>

                                <p className="text-[10px] text-slate-500 italic mt-2">"{req.reason}"</p>
                            </div>

                            {req.status === 'Pending' && (
                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        onClick={() => handleDecision(req, 'Approved')}
                                        disabled={isReviewing}
                                        className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer border border-emerald-100"
                                    >
                                        <HiOutlineCheck size={14} /> Approve
                                    </button>
                                    <button
                                        onClick={() => handleDecision(req, 'Rejected')}
                                        disabled={isReviewing}
                                        className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer border border-red-100"
                                    >
                                        <HiOutlineXMark size={14} /> Reject
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <ConfirmModal
                isOpen={confirmState.open}
                onClose={() => setConfirmState({ open: false, request: null, decision: null })}
                onConfirm={handleConfirm}
                title={confirmState.decision === 'Approved' ? 'Approve Correction' : 'Reject Correction'}
                message={
                    confirmState.decision === 'Approved'
                        ? `This will update ${confirmState.request?.user?.name}'s session to end at ${confirmState.request ? formatDateTime(confirmState.request.requestedEndTime) : ''}.`
                        : `This will reject ${confirmState.request?.user?.name}'s correction request.`
                }
                confirmText={confirmState.decision === 'Approved' ? 'Approve' : 'Reject'}
                variant={confirmState.decision === 'Approved' ? 'default' : 'danger'}
                isLoading={isReviewing}
            />
        </div>
    );
};

export default AdminRequestPage;
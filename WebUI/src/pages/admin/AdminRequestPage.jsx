import React, { useState, useMemo } from 'react';
import { HiOutlineCheck, HiOutlineXMark, HiOutlineClock, HiOutlineMagnifyingGlass } from 'react-icons/hi2';
import { toast } from 'react-hot-toast';
import {
    useGetAdjustmentRequestsQuery,
    useReviewAdjustmentRequestMutation,
} from '../../services/timeLogAdjustmentApi';
import CustomDropdown from '../../components/CustomDropdown';
import ConfirmModal from '../../components/ConfirmModal';
import PageHeader from '../../components/PageHeader';
import Loader from '../../components/Loader';
import useDebounce from '../../hooks/useDebounce';
import { useSocketEvents } from '../../hooks/useSocketEvents';

const formatDateTime = (d) =>
    new Date(d).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });

export default function AdminRequestPage() {
    const [statusFilter, setStatusFilter] = useState('Pending');
    const [nameFilter, setNameFilter] = useState('');
    const debouncedNameFilter = useDebounce(
        nameFilter.length > 1 ? nameFilter : '',
        400,
    );

    const { data: requests = [], isLoading, refetch } = useGetAdjustmentRequestsQuery(statusFilter);

    useSocketEvents({
        onTimeAdjustmentChange: refetch,
    });

    const [reviewRequest, { isLoading: isReviewing }] = useReviewAdjustmentRequestMutation();

    const [confirmState, setConfirmState] = useState({ open: false, request: null, decision: null });

    const filteredRequests = useMemo(() => {
        if (!debouncedNameFilter) return requests;
        const term = debouncedNameFilter.trim().toLowerCase();
        return requests.filter(
            (req) =>
                req.user?.name?.toLowerCase().includes(term) ||
                req.user?.employee?.employeeCode?.toLowerCase().includes(term),
        );
    }, [requests, debouncedNameFilter]);

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

    const hasActiveFilters = statusFilter !== 'Pending' || nameFilter.length > 0;

    const clearFilters = () => {
        setStatusFilter('Pending');
        setNameFilter('');
    };

    if (isLoading) return <Loader message="Loading correction requests..." />;

    return (
        <>
            <div className="max-w-[1750px] mx-auto min-h-[83vh] bg-slate-100">
                <PageHeader
                    title="Time Correction Requests"
                    subtitle="Review and approve auto-stopped session corrections."
                    iconText="T"
                />

                <main className="max-w-[1750px] mx-auto px-4 sm:px-6 lg:px-8 pb-6 sm:pb-10 -mt-6 sm:-mt-10">
                    {/* FILTER BAR */}
                    <div className="bg-white/90 backdrop-blur-xl border border-slate-200 p-4 sm:p-5 rounded-2xl sm:rounded-[2.5rem] shadow-xl shadow-slate-200/50 mb-6 sm:mb-8 flex flex-wrap items-center gap-3 sm:gap-4">
                        <div className="relative flex-1 min-w-[160px] sm:min-w-[200px] group">
                            <HiOutlineMagnifyingGlass
                                className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors"
                                size={18}
                            />

                            <input
                                type="text"
                                placeholder="Search by employee name..."
                                value={nameFilter}
                                onChange={(e) => setNameFilter(e.target.value)}
                                className="w-full pl-12 pr-6 py-3 sm:py-3.5 bg-white border border-slate-200 rounded-2xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/5 outline-none font-bold text-xs transition-all shadow-sm"
                            />
                        </div>

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
                            buttonClass="py-3 sm:py-3.5 px-4 sm:px-6 bg-slate-100/80 rounded-xl border border-slate-200/50 shadow-sm text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer text-slate-500 hover:text-slate-800 min-w-[160px]"
                        />

                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="shadow-sm flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-3.5 text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all font-bold text-xs cursor-pointer shrink-0"
                            >
                                <HiOutlineXMark size={18} strokeWidth={2.5} />
                                <span className="hidden sm:inline">RESET FILTERS</span>
                            </button>
                        )}

                        <div className="flex items-center gap-3 bg-slate-100/80 px-4 py-3 sm:py-3.5 rounded-xl border border-slate-200/50 shadow-sm w-full sm:w-auto sm:ml-auto justify-center sm:justify-start">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-300 pr-3">
                                Requests
                            </span>
                            <span className="text-[11px] font-black text-slate-700">
                                {filteredRequests.length}
                            </span>
                        </div>
                    </div>

                    {/* CONTENT */}
                    {filteredRequests.length === 0 ? (
                        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm flex flex-col items-center justify-center min-h-[50vh]">
                            <div className="py-10 text-center">
                                <h3 className="text-lg font-black text-slate-800">
                                    No {statusFilter !== 'All' ? statusFilter.toLowerCase() : ''} Requests Found
                                </h3>
                                <p className="mt-2 text-sm text-slate-600">
                                    {debouncedNameFilter
                                        ? `No requests match "${debouncedNameFilter}".`
                                        : statusFilter === 'Pending'
                                            ? 'There are no correction requests waiting for review.'
                                            : `No requests match the "${statusFilter}" filter.`}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3 sm:gap-4">
                            {filteredRequests.map((req) => (
                                <div
                                    key={req._id}
                                    className="bg-white border border-slate-200 shadow-sm rounded-[1.5rem] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4"
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
                                            Task Name: {req.task?.title || 'Untitled Task'}
                                        </p>

                                        <div className="flex items-center gap-4 mt-2 text-[10px] font-bold text-slate-600 flex-wrap">
                                            <span className="flex items-center gap-1">
                                                <HiOutlineClock size={11} className="text-slate-400" />
                                                Recorded stop: {formatDateTime(req.originalEndTime)}
                                            </span>
                                            <span className="text-slate-800">→</span>
                                            <span className="text-emerald-600">
                                                Requested: {formatDateTime(req.requestedEndTime)}
                                            </span>
                                        </div>

                                        <p className="text-[10px] text-slate-800 mt-2">Reason: {req.reason}</p>
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
                </main>
            </div>

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
                variant={confirmState.decision === 'Approved' ? 'success' : 'danger'}
                isLoading={isReviewing}
            />
        </>
    );
}
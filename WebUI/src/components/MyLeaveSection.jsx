import React, { useState } from "react";
import {
    HiOutlineShieldCheck,
    HiOutlineClock,
    HiOutlineCalendar,
    HiOutlineTrash,
    HiOutlinePencilAlt,
    HiOutlineLockClosed,
    HiOutlineSparkles,
    HiOutlineFilter,
} from "react-icons/hi";
import { toast } from "react-hot-toast";

// API Services
import {
    useGetMyLeavesQuery,
    useDeleteLeaveMutation,
} from "../services/leaveApi";

// Components
import Table from "./Table";
import Loader from "./Loader";
import LeaveModal from "./LeaveModal";
import Pagination from "./Pagination";
import PageHeader from "./PageHeader";
import { useSocketEvents } from "../hooks/useSocketEvents";
import ConfirmModal from "./ConfirmModal";
import CustomDropdown from "./CustomDropdown";
import { HiOutlinePlusCircle } from "react-icons/hi2";

export default function MyLeaveSection() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedLeave, setSelectedLeave] = useState(null);
    const [confirmState, setConfirmState] = useState({
        open: false,
        leaveId: null,
    });

    // --- FILTER & PAGINATION STATE ---
    const [page, setPage] = useState(1);
    const [typeFilter, setTypeFilter] = useState("All");
    const [statusFilter, setStatusFilter] = useState("All");
    const [limit, setLimit] = useState(5);

    // --- DATA FETCHING ---
    const { data, isLoading, isFetching, refetch } = useGetMyLeavesQuery({
        page,
        limit: limit,
        type: typeFilter === "All" ? "" : typeFilter,
        status: statusFilter === "All" ? "" : statusFilter,
    });

    useSocketEvents({
        onLeaveChange: refetch,
    });

    const [deleteLeave] = useDeleteLeaveMutation();

    // --- HANDLERS ---
    const handleDelete = async (id) => {
        setConfirmState({
            open: true,
            leaveId: id,
        });
    };

    const handleConfirmDelete = async () => {
        const loadingToast = toast.loading("Deleting request...");
        try {
            await deleteLeave(confirmState.leaveId).unwrap();
            toast.success("Request voided", { id: loadingToast });
        } catch (err) {
            toast.error(err?.data?.message || "Protocol failure", {
                id: loadingToast,
            });
        } finally {
            setConfirmState({ open: false, leaveId: null });
        }
    };

    const openEditModal = (leave) => {
        setSelectedLeave(leave);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedLeave(null);
    };

    // --- TABLE COLUMNS ---
    const columns = [
        {
            header: "Leave Type",
            render: (req) => (
                <p className="text-[10px] text-slate-700 font-black uppercase tracking-widest">
                    {req.type}
                </p>
            ),
        },
        {
            header: "Leave Reason",
            className: "text-left",
            render: (req) => (
                <p className="text-[10px] text-slate-700 font-black uppercase truncate max-w-[280px] italic">
                    {req.reason || "No operational context provided"}
                </p>
            ),
        },
        {
            header: "Requested On",
            className: "text-center",
            render: (req) => (
                <div className="flex items-center justify-center gap-2">
                    <HiOutlineCalendar className="text-orange-500" size={13} />
                    <p className="text-[10px] text-slate-700 font-black tracking-widest uppercase">
                        {new Date(req.createdAt).toLocaleDateString("en-IN")}
                    </p>
                </div>
            ),
        },
        {
            header: "Leave Timeline",
            className: "text-center",
            render: (req) => (
                <div className="flex items-center justify-center gap-2">
                    <HiOutlineCalendar className="text-orange-500" size={13} />
                    <p className="text-[10px] text-slate-700 font-black tracking-widest uppercase">
                        {new Date(req.startDate).toLocaleDateString("en-IN")} —{" "}
                        {new Date(req.endDate).toLocaleDateString("en-IN")}
                    </p>
                </div>
            ),
        },
        {
            header: "No Of Days",
            className: "text-center",
            render: (req) => (
                <p className=" text-center text-slate-700 text-[10px] uppercase font-black">
                    {req.businessDays || 0} days
                </p>
            ),
        },
        {
            header: "Approval Flow",
            className: "text-center",
            render: (req) => (
                <div className="flex flex-col gap-1 text-left">
                    {req.approvalFlow?.map((step, index) => (
                        <div
                            key={index}
                            className="flex items-center gap-2 text-[9px] font-black uppercase"
                        >
                            <span className="min-w-[90px]">
                                {step.role}
                            </span>

                            {step.status === "Approved" && (
                                <>
                                    <span className="text-emerald-600">
                                        Approved
                                    </span>

                                    <span className="text-slate-700">
                                        {new Date(step.approvedAt).toLocaleDateString("en-IN")}
                                    </span>
                                </>
                            )}

                            {step.status === "Rejected" && (
                                <span className="text-red-600">
                                    Rejected
                                </span>
                            )}

                            {step.status === "Pending" && (
                                <span className="text-orange-600">
                                    Pending
                                </span>
                            )}

                            {step.status === "Waiting" && (
                                <span className="text-slate-400">
                                    Waiting
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            ),
        },
        {
            header: "Status",
            className: "text-center",
            render: (req) => (
                <div className="text-center">
                    <StatusBadge status={req.status} />
                </div>
            ),
        },
        {
            header: "Actions",
            className: "text-center",
            render: (req) => (
                <div className="flex justify-center items-start gap-2">
                    {req.status === "Pending" &&
                        req.currentLevel === 0 ? (
                        <>
                            <button
                                onClick={() => openEditModal(req)}
                                className="text-yellow-500 hover:text-yellow-600  transition-all cursor-pointer"
                            >
                                <HiOutlinePencilAlt size={18} />
                            </button>
                            <button
                                onClick={() => handleDelete(req._id)}
                                className=" text-rose-500 hover:text-rose-600 transition-all cursor-pointer"
                            >
                                <HiOutlineTrash size={18} />
                            </button>
                        </>
                    ) : (
                        <button className="text-slate-500 hover:text-slate-600  transition-all cursor-not-allowed">
                            <HiOutlineLockClosed size={18} />
                        </button>
                    )}
                </div>
            ),
        },
    ];

    if (isLoading) return <Loader message="Accessing Personal Ledger..." />;

    return (
        <div className="max-w-[1750px] mx-auto bg-slate-100">

            <main className="max-w-[1750px] mx-auto mt-8 pb-20">
                {/* TACTICAL FILTER BAR */}
                <div className="relative z-[200] flex flex-wrap items-center gap-4 mb-8 bg-white/90 backdrop-blur-xl p-1.5 rounded-2xl border border-slate-200 shadow-sm">
                    <CustomDropdown
                        value={typeFilter}
                        onChange={(val) => {
                            setTypeFilter(val);
                            setPage(1);
                        }}
                        options={[
                            { label: "All Leave Types", value: "All" },
                            { label: "Earned Leave", value: "Earned Leave" },
                            { label: "Sick Leave", value: "Sick Leave" },
                            { label: "Bereavement Leave", value: "Bereavement Leave" },
                            { label: "Paternity Leave", value: "Paternity Leave" },
                            { label: "Maternity Leave", value: "Maternity Leave" },
                            { label: "Casual Leave", value: "Casual Leave" },
                            { label: "Compensatory Off", value: "Compensatory Off" },
                            { label: "LOP", value: "LOP" },
                        ].map((t) => ({
                            label: t.label || t,
                            value: t.value || t,
                        }))}
                        className="min-w-[170px]"
                        buttonClass="shadow-sm bg-slate-50 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl text-slate-700 border border-slate-100"
                    />


                    <CustomDropdown
                        value={statusFilter}
                        onChange={(val) => {
                            setStatusFilter(val);
                            setPage(1);
                        }}
                        options={[
                            {
                                label: "All Leave Status",
                                value: "All",
                            },
                            {
                                label: "Under Review",
                                value: "Pending",
                            },
                            {
                                label: "Approved",
                                value: "Approved",
                            },
                            {
                                label: "Rejected",
                                value: "Rejected",
                            },
                        ]}
                        className="min-w-[170px]"
                        buttonClass="shadow-sm bg-slate-50 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl text-slate-700 border border-slate-100"
                    />

                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 mx-1.5 px-3.5 py-2.5 bg-slate-50 border border-slate-100 text-[10px] font-black hover:bg-orange-600 hover:text-white rounded-xl transition-all uppercase tracking-widest shadow-sm shadow-orange-200 cursor-pointer active:scale-95"
                    >
                        <HiOutlinePlusCircle size={18} />
                        <span>Apply Leave</span>
                    </button>

                    {isFetching && (
                        <div className="ml-auto flex items-center gap-3 px-6 py-1 bg-orange-50 rounded-2xl border border-orange-100">
                            <div className="w-2 h-2 bg-orange-500 rounded-2xl animate-pulse" />
                            <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">
                                Syncing...
                            </span>
                        </div>
                    )}


                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 relative z-0">
                    {/* STATS SECTION */}
                    <div className="xl:col-span-3 space-y-6">
                        <StatBox
                            label="Earned Leaves"
                            value={`${data?.balances?.earnedLeave?.remaining?.toFixed(1) || 0}`}
                            unit="Days"
                            color="orange"
                        />
                    </div>

                    {/* TABLE SECTION */}
                    <div className="xl:col-span-9 flex flex-col">
                        <div
                            className={`bg-white rounded-[2rem] border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-visible transition-all duration-300 ${isFetching ? "opacity-50" : "opacity-100"}`}
                        >
                            <div className="rounded-t-[2rem] overflow-hidden">
                                <Table
                                    columns={columns}
                                    data={data?.history || []}
                                    emptyMessage="No leave request records found."
                                />
                            </div>

                            <div className="bg-slate-50/50 p-4 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 rounded-b-[2rem]">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100 pr-3">
                                            Page Limit
                                        </span>
                                        <CustomDropdown
                                            value={limit.toString()}
                                            onChange={(val) => {
                                                setLimit(Number(val));
                                                setCurrentPage(1);
                                            }}
                                            options={[5, 10, 25, 50].map((v) => ({
                                                label: `${v}`,
                                                value: v.toString(),
                                            }))}
                                            className="w-10"
                                            buttonClass="w-full p-1 bg-transparent text-[9px] font-black cursor-pointer text-slate-700 flex items-center gap-2"
                                        />
                                    </div>

                                    {data?.pagination?.totalLeaves && (
                                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight ml-2">
                                            Total {data?.pagination?.totalLeaves} Leave Requests
                                        </span>
                                    )}
                                </div>
                                <Pagination
                                    pagination={{
                                        current: page,
                                        total: data?.pagination?.totalPages || 1,
                                        count: data?.pagination?.totalLeaves || 0,
                                        limit: limit,
                                    }}
                                    onPageChange={setPage}
                                    loading={isFetching}
                                    label="Records"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <LeaveModal
                isOpen={isModalOpen}
                onClose={closeModal}
                initialData={selectedLeave}
            />

            <ConfirmModal
                isOpen={confirmState.open}
                onClose={() => setConfirmState({ open: false, leaveId: null })}
                onConfirm={handleConfirmDelete}
                title="Cancel Leave Request"
                message="This will permanently cancel your pending leave request."
                confirmText="Delete"
                variant="danger"
            />
        </div>
    );
}

const StatBox = ({ label, value, unit, color, icon }) => (
    <div className="p-10 rounded-[3rem] bg-white border border-slate-200 shadow-xl shadow-slate-200/30 relative overflow-hidden group hover:border-orange-500/30 transition-all duration-500">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 relative">
            {label}
        </p>
        <div className="flex items-baseline gap-2 relative z-10">
            <h3
                className={`text-6xl font-black tracking-tighter tabular-nums ${color === "orange" ? "text-orange-500" : "text-slate-900"}`}
            >
                {value}
            </h3>
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                {unit}
            </span>
        </div>
    </div>
);

export const StatusBadge = ({ status }) => {
    const styles = {
        Pending: "text-orange-600 border-orange-100",
        Approved: "text-emerald-600 border-emerald-100",
        Rejected: "text-rose-600 border-rose-100",
    };

    const label = {
        Pending: "Under Review",
        Approved: "Approved",
        Rejected: "Declined",
    };

    return (
        <p
            className={`text-[9px] font-black uppercase tracking-[0.2em] ${styles[status]}`}
        >
            {label[status]}
        </p>
    );
};

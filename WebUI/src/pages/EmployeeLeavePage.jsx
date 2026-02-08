import React, { useState } from 'react';
import {
  HiOutlinePlus, HiOutlineShieldCheck, HiOutlineClock,
  HiOutlineCalendar, HiOutlineTrash, HiOutlinePencilAlt,
  HiOutlineLockClosed
} from 'react-icons/hi';
import { toast, Toaster } from 'react-hot-toast';
import {
  useGetMyLeavesQuery,
  useApplyLeaveMutation,
  useUpdateLeaveMutation,
  useDeleteLeaveMutation
} from '../services/leaveApi';

import Table from "../components/Table";
import Loader from "../components/Loader";
import LeaveModal from "../components/LeaveModal";
import Pagination from "../components/Pagination"; // Using your custom component

export default function EmployeeLeavePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);

  // --- PAGINATION STATE ---
  const [page, setPage] = useState(1);
  const limit = 6;

  // --- DATA FETCHING ---
  const { data, isLoading, isFetching } = useGetMyLeavesQuery({ page, limit });
  const [applyLeave] = useApplyLeaveMutation();
  const [updateLeave] = useUpdateLeaveMutation();
  const [deleteLeave] = useDeleteLeaveMutation();

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = Object.fromEntries(formData.entries());

    const loadingToast = toast.loading(selectedLeave ? "Recalculating request..." : "Transmitting application...");
    try {
      if (selectedLeave) {
        await updateLeave({ id: selectedLeave._id, ...payload }).unwrap();
        toast.success("Registry entry updated", { id: loadingToast });
      } else {
        await applyLeave(payload).unwrap();
        toast.success("Application successfully filed", { id: loadingToast });
        setPage(1);
      }
      closeModal();
    } catch (err) {
      toast.error(err?.data?.message || "Transmission error", { id: loadingToast });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("CRITICAL: Cancel this pending request? This cannot be undone.")) return;

    const loadingToast = toast.loading("Purging request from ledger...");
    try {
      await deleteLeave(id).unwrap();
      toast.success("Request successfully voided", { id: loadingToast });
    } catch (err) {
      toast.error(err?.data?.message || "Protocol failure", { id: loadingToast });
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

  const columns = [
    {
      header: "Type / Justification",
      render: (req) => (
        <div className="flex flex-col py-2">
          <p className="font-black text-slate-900 uppercase text-sm tracking-tight">{req.type}</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase truncate max-w-[250px] italic">
            {req.reason || "No operational context provided"}
          </p>
        </div>
      )
    },
    {
      header: "Timeframe",
      render: (req) => (
        <div className="flex flex-col text-xs font-black text-slate-700">
          <div className="flex items-center gap-2">
            <HiOutlineCalendar className="text-orange-500" size={16} />
            <span className="tabular-nums">
              {new Date(req.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              <span className="mx-2 text-slate-300">→</span>
              {new Date(req.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <span className="text-[9px] text-slate-400 mt-1 uppercase tracking-widest pl-6">
            Impact: {req.businessDays} Operational Days
          </span>
        </div>
      )
    },
    {
      header: "Status",
      className: "text-center",
      render: (req) => <StatusBadge status={req.status} />
    },
    {
      header: "Protocol Action",
      className: "text-right pr-10",
      render: (req) => (
        <div className="flex justify-end gap-3">
          {req.status === 'Pending' ? (
            <>
              <button
                onClick={() => openEditModal(req)}
                className="p-3 bg-slate-50 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-2xl transition-all border border-transparent hover:border-orange-100"
              >
                <HiOutlinePencilAlt size={18} />
              </button>
              <button
                onClick={() => handleDelete(req._id)}
                className="p-3 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all border border-transparent hover:border-rose-100"
              >
                <HiOutlineTrash size={18} />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl opacity-40 grayscale">
              <HiOutlineLockClosed size={14} className="text-slate-500" />
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Read Only</span>
            </div>
          )}
        </div>
      )
    }
  ];

  if (isLoading) return <Loader message="Accessing Personal Ledger..." />;

  const history = data?.history || [];
  const stats = data?.stats || null;
  const paginationData = data?.pagination || { totalPages: 1, totalLeaves: 0 };

  return (
    <div className="max-w-[1700px] mx-auto pb-32 px-10 pt-10">
      <Toaster position="bottom-right" />

      {/* COMMAND HEADER */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10 mb-16">
        <div>
          <h1 className="text-8xl font-black text-slate-900 tracking-tighter uppercase leading-[0.8]">My Wallet</h1>
          <div className="flex items-center gap-3 mt-6">
            <span className="bg-slate-900 text-white text-[10px] font-black px-5 py-2 rounded-xl uppercase tracking-[0.3em]">
              System Ledger
            </span>
            {isFetching && (
              <span className="flex items-center gap-2 text-orange-600 text-[10px] font-black uppercase animate-pulse">
                <div className="w-2 h-2 bg-orange-500 rounded-full" /> Updating...
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-orange-500/20 active:scale-95 cursor-pointer"
        >
          <HiOutlinePlus strokeWidth={2.5} size={20} />
          <span>New Application</span>
        </button>

      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
        {/* STATS TERMINAL */}
        <div className="xl:col-span-3 space-y-8">
          <StatBox label="Total Accrued" value={`${stats?.earned?.toFixed(1) || 0}D`} color="orange" icon={<HiOutlineShieldCheck />} />
          <StatBox label="Net Available" value={`${stats?.remaining || 0}D`} color="slate" icon={<HiOutlineClock />} />

          <div className="p-8 rounded-[3rem] bg-slate-900 text-white border-b-8 border-orange-500 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <HiOutlineLockClosed className="text-orange-500" size={20} />
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Data Integrity Protocol</h4>
            </div>
            <p className="text-[11px] text-slate-400 font-bold leading-relaxed uppercase tracking-wider">
              Approved or Rejected entries are permanently written to the ledger. Contact Administration for corrections.
            </p>
          </div>
        </div>

        {/* REGISTRY TABLE & HUB */}
        <div className="xl:col-span-9 flex flex-col gap-6">
          <div className={`bg-white rounded-[4rem] border border-slate-100 shadow-3xl shadow-slate-200/50 overflow-hidden transition-all duration-300 ${isFetching ? 'opacity-60 scale-[0.995]' : 'opacity-100'}`}>

            <Table columns={columns} data={history} emptyMessage="No transactions found." />

            {/* INTEGRATED YOUR PAGINATION COMPONENT */}
            <Pagination
              pagination={{
                current: page,
                total: paginationData.totalPages,
                count: paginationData.totalLeaves
              }}
              onPageChange={(newPage) => setPage(newPage)}
              loading={isFetching}
              label="Records"
            />

          </div>
        </div>
      </div>

      <LeaveModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={handleFormSubmit}
        initialData={selectedLeave}
      />
    </div>
  );
}

const StatBox = ({ label, value, color, icon }) => (
  <div className="p-12 rounded-[3.5rem] bg-white border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group hover:border-orange-500/20 transition-all duration-500">
    <div className={`absolute -top-6 -right-6 text-8xl text-slate-50 group-hover:text-orange-50 transition-colors duration-500`}>
      {icon}
    </div>
    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3 relative z-10">{label}</p>
    <h3 className={`text-6xl font-black relative z-10 tracking-tighter tabular-nums ${color === 'orange' ? 'text-orange-500' : 'text-slate-900'}`}>
      {value}
    </h3>
  </div>
);

const StatusBadge = ({ status }) => {
  const styles = {
    Pending: "bg-orange-50 text-orange-600 border-orange-100 shadow-orange-100/50",
    Approved: "bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-100/50",
    Rejected: "bg-rose-50 text-rose-600 border-rose-100 shadow-rose-100/50"
  };

  return (
    <span className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border-2 shadow-sm ${styles[status]}`}>
      {status === 'Approved' ? 'Authorized' : status === 'Rejected' ? 'Declined' : 'Pending'}
    </span>
  );
};
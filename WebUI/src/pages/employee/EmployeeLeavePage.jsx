import React, { useState } from 'react';
import {
  HiOutlineShieldCheck, HiOutlineClock,
  HiOutlineCalendar, HiOutlineTrash, HiOutlinePencilAlt,
  HiOutlineLockClosed, HiOutlineSparkles, HiOutlineFilter
} from 'react-icons/hi';
import { toast } from 'react-hot-toast';

// API Services
import {
  useGetMyLeavesQuery,
  useDeleteLeaveMutation
} from '../../services/leaveApi';

// Components
import Table from "../../components/Table";
import Loader from "../../components/Loader";
import LeaveModal from "../../components/LeaveModal";
import Pagination from "../../components/Pagination";
import PageHeader from "../../components/PageHeader";

export default function EmployeeLeavePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);

  // --- FILTER & PAGINATION STATE ---
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const limit = 8;

  // --- DATA FETCHING ---
  const { data, isLoading, isFetching } = useGetMyLeavesQuery({
    page,
    limit,
    type: typeFilter === "All" ? "" : typeFilter,
    status: statusFilter === "All" ? "" : statusFilter
  });

  const [deleteLeave] = useDeleteLeaveMutation();

  // --- HANDLERS ---
  const handleDelete = async (id) => {
    if (!window.confirm("CRITICAL: Cancel this pending request?")) return;
    const loadingToast = toast.loading("Purging request...");
    try {
      await deleteLeave(id).unwrap();
      toast.success("Request voided", { id: loadingToast });
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
      )
    },
    {
      header: "Requested On",
      className: "text-center",
      render: (req) => (
        <div className="flex items-center justify-center gap-2">
          <HiOutlineCalendar className="text-orange-500" size={13} />
          <p className="text-[10px] text-slate-700 font-black tracking-widest uppercase">
            {new Date(req.createdAt).toLocaleDateString('en-IN')}
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
            {new Date(req.startDate).toLocaleDateString('en-IN')} — {new Date(req.endDate).toLocaleDateString('en-IN')}
          </p>
        </div>
      ),
    },
    {
      header: "No Of Days",
      className: "text-center",
      render: (req) => <p className=" text-center text-slate-700 text-[10px] uppercase font-black">{req.businessDays || 0} days</p>
    },
    {
      header: "Status",
      className: "text-center",
      render: (req) => <div className="text-center"><StatusBadge status={req.status} /></div>,
    },
    {
      header: "Actions",
      className: "text-center",
      render: (req) => (
        <div className="flex justify-center items-start gap-2">
          {req.status === 'Pending' ? (
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
            <button
                className="text-slate-500 hover:text-slate-600  transition-all cursor-not-allowed"
              >
                <HiOutlineLockClosed size={18} />
              </button>
          )}
        </div>
      )
    }
  ];

  if (isLoading) return <Loader message="Accessing Personal Ledger..." />;

  return (
    <div className="max-w-[1750px] mx-auto min-h-screen bg-slate-100">
      <PageHeader
        title="My Leaves"
        subtitle="Operational absence logs and earned credit registry."
        actionLabel="Apply for Leave"
        onAction={() => setIsModalOpen(true)}
      />

      <main className="max-w-[1750px] mx-auto px-8 -mt-10 pb-20">

        {/* TACTICAL FILTER BAR */}
        <div className="flex flex-wrap items-center gap-4 mb-8 bg-white/90 backdrop-blur-xl p-5 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/40">
          <div className="flex items-center gap-3 bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100">
            <HiOutlineFilter className="text-slate-400" size={16} />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-200 pr-4">Type</span>
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="bg-transparent text-[10px] font-black outline-none cursor-pointer text-slate-700 uppercase"
            >
              {["All", "Sick Leave", "Personal Leave", "Annual Leave", "Maternity Leave", "Unpaid Leave", "Other Leave"].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200/50">
            {["All", "Pending", "Approved", "Rejected"].map((s) => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1); }}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === s
                  ? "bg-white text-orange-600 shadow-md ring-1 ring-slate-200"
                  : "text-slate-500 hover:text-slate-800 cursor-pointer"
                  }`}
              >
                {s === 'Pending' ? 'Review' : s === 'Approved' ? 'Authorized' : s}
              </button>
            ))}
          </div>

          {isFetching && (
            <div className="ml-auto flex items-center gap-3 px-6 py-2 bg-orange-50 rounded-full border border-orange-100">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Syncing...</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
          {/* STATS SECTION */}
          <div className="xl:col-span-3 space-y-6">
            <StatBox
              label="Earned Credits"
              value={`${data?.balances?.annualLeave?.earned?.toFixed(1) || 0}`}
              unit="Days"
              color="orange"
              icon={<HiOutlineSparkles />}
            />
            <StatBox
              label="Remaining"
              value={`${data?.stats?.remaining || 0}`}
              unit="Days"
              color="slate"
              icon={<HiOutlineShieldCheck />}
            />
          </div>

          {/* TABLE SECTION */}
          <div className="xl:col-span-9 flex flex-col">
            <div className={`bg-white rounded-[3.5rem] border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden transition-all duration-300 ${isFetching ? 'opacity-50' : 'opacity-100'}`}>
              <Table
                columns={columns}
                data={data?.history || []}
                emptyMessage="No registry entries found for selected criteria."
              />

              <div className="bg-slate-50/50 p-6 border-t border-slate-100">
                <Pagination
                  pagination={{
                    current: page,
                    total: data?.pagination?.totalPages || 1,
                    count: data?.pagination?.totalLeaves || 0,
                    limit: limit
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
    </div>
  );
}


const StatBox = ({ label, value, unit, color, icon }) => (
  <div className="p-10 rounded-[3rem] bg-white border border-slate-200 shadow-xl shadow-slate-200/30 relative overflow-hidden group hover:border-orange-500/30 transition-all duration-500">
    <div className="absolute -top-4 -right-4 text-7xl text-slate-50 group-hover:text-orange-50 transition-all duration-500">
      {icon}
    </div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 relative z-10">{label}</p>
    <div className="flex items-baseline gap-2 relative z-10">
      <h3 className={`text-6xl font-black tracking-tighter tabular-nums ${color === 'orange' ? 'text-orange-500' : 'text-slate-900'}`}>
        {value}
      </h3>
      <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{unit}</span>
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
    <p className={`text-[9px] font-black uppercase tracking-[0.2em] ${styles[status]}`}>
      {label[status]}
    </p>
  );
};
import React, { useState } from 'react';
import {
  HiOutlinePlus, HiOutlineShieldCheck, HiOutlineClock,
  HiOutlineCalendar, HiOutlineTrash, HiOutlinePencilAlt,
  HiOutlineLockClosed, HiOutlineSparkles, HiOutlineFilter
} from 'react-icons/hi';
import { toast, Toaster } from 'react-hot-toast';

// API Services
import {
  useGetMyLeavesQuery,
  useApplyLeaveMutation,
  useUpdateLeaveMutation,
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
  // Passing filters directly to the query for backend-side filtering
  const { data, isLoading, isFetching } = useGetMyLeavesQuery({ 
    page, 
    limit,
    type: typeFilter === "All" ? "" : typeFilter,
    status: statusFilter === "All" ? "" : statusFilter
  });

  const [applyLeave] = useApplyLeaveMutation();
  const [updateLeave] = useUpdateLeaveMutation();
  const [deleteLeave] = useDeleteLeaveMutation();

  // --- HANDLERS ---
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = Object.fromEntries(formData.entries());

    const loadingToast = toast.loading(selectedLeave ? "Updating registry..." : "Filing application...");
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
    if (!window.confirm("CRITICAL: Cancel this pending request?")) return;
    const loadingToast = toast.loading("Purging request...");
    try {
      await deleteLeave(id).unwrap();
      toast.success("Request voided", { id: loadingToast });
    } catch (err) {
      toast.error(err?.data?.message || "Protocol failure", { id: loadingToast });
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedLeave(null);
  };

  // --- TABLE COLUMNS ---
  const columns = [
    {
      header: "Category / Context",
      render: (req) => (
        <div className="flex flex-col py-3">
          <p className="font-black text-slate-900 uppercase text-sm tracking-tight">{req.type}</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase truncate max-w-[280px] italic mt-0.5">
            {req.reason || "No operational context provided"}
          </p>
        </div>
      )
    },
    {
      header: "Operational Window",
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
          <span className="text-[9px] text-slate-400 mt-1 uppercase tracking-widest pl-6 font-bold">
            Duration: {req.businessDays} Days
          </span>
        </div>
      )
    },
    {
      header: "Auth Status",
      className: "text-center",
      render: (req) => <StatusBadge status={req.status} />
    },
    {
      header: "Action",
      className: "text-right pr-8",
      render: (req) => (
        <div className="flex justify-end gap-2">
          {req.status === 'Pending' ? (
            <>
              <button onClick={() => { setSelectedLeave(req); setIsModalOpen(true); }} className="p-2.5 bg-slate-50 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all border border-slate-100 cursor-pointer hover:border-orange-200">
                <HiOutlinePencilAlt size={16} />
              </button>
              <button onClick={() => handleDelete(req._id)} className="p-2.5 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-slate-100 cursor-pointer hover:border-rose-200">
                <HiOutlineTrash size={16} />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl opacity-40">
              <HiOutlineLockClosed size={14} className="text-slate-500" />
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Locked</span>
            </div>
          )}
        </div>
      )
    }
  ];

  if (isLoading) return <Loader message="Accessing Personal Ledger..." />;

  return (
    <div className="min-h-screen">
      <PageHeader 
        title="My Wallet"
        subtitle="Operational absence logs and earned credit registry."
        actionLabel="Apply for Leave"
        onAction={() => setIsModalOpen(true)}
      />

      <main className="max-w-[1700px] mx-auto px-8 -mt-10 pb-20">
        
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
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  statusFilter === s 
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
              value={`${data?.stats?.earned?.toFixed(1) || 0}`} 
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
        onSubmit={handleFormSubmit} 
        initialData={selectedLeave} 
      />
    </div>
  );
}

// --- SUB-COMPONENTS ---

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

const StatusBadge = ({ status }) => {
  const styles = {
    Pending: "bg-orange-50 text-orange-600 border-orange-100",
    Approved: "bg-emerald-50 text-emerald-600 border-emerald-100",
    Rejected: "bg-rose-50 text-rose-600 border-rose-100"
  };

  return (
    <span className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border-2 shadow-sm ${styles[status]}`}>
      {status === 'Approved' ? 'Authorized' : status === 'Rejected' ? 'Declined' : 'Review'}
    </span>
  );
};
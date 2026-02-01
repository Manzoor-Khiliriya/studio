import React, { useState } from 'react';
import { HiOutlinePlus, HiOutlineShieldCheck, HiOutlineClock, HiOutlineCalendar, HiOutlineTrash, HiOutlinePencilAlt } from 'react-icons/hi';
import { toast, Toaster } from 'react-hot-toast';
import { 
  useGetMyLeavesQuery, 
  useApplyLeaveMutation, 
  useUpdateLeaveMutation, 
  useCancelLeaveMutation 
} from '../services/leaveApi';

import Table from "../components/Table";
import Loader from "../components/Loader";
import LeaveModal from "../components/LeaveModal";

export default function EmployeeLeavePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null); // For Editing

  // RTK Query Hooks
  const { data, isLoading, isFetching } = useGetMyLeavesQuery();
  const [applyLeave] = useApplyLeaveMutation();
  const [updateLeave] = useUpdateLeaveMutation();
  const [cancelLeave] = useCancelLeaveMutation();

  // Handle Create or Update
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = Object.fromEntries(formData.entries());

    try {
      if (selectedLeave) {
        // Update existing
        await updateLeave({ id: selectedLeave._id, ...payload }).unwrap();
        toast.success("Request updated successfully");
      } else {
        // Create new
        await applyLeave(payload).unwrap();
        toast.success("Application transmitted");
      }
      closeModal();
    } catch (err) {
      toast.error(err?.data?.message || "Operation failed");
    }
  };

  // Handle Delete (Cancel)
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to cancel this pending request?")) {
      try {
        await cancelLeave(id).unwrap();
        toast.success("Request removed");
      } catch (err) {
        toast.error(err?.data?.message || "Could not delete");
      }
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
      header: "Type / Details",
      render: (req) => (
        <div className="flex flex-col">
          <p className="font-black text-slate-800 uppercase text-sm">{req.type}</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase truncate max-w-[200px]">
            {req.reason || "No context provided"}
          </p>
        </div>
      )
    },
    {
      header: "Duration",
      render: (req) => (
        <div className="flex flex-col text-xs font-bold text-slate-600">
          <div className="flex items-center gap-2">
            <HiOutlineCalendar className="text-orange-500" />
            {new Date(req.startDate).toLocaleDateString()} <span className="text-slate-300">→</span> {new Date(req.endDate).toLocaleDateString()}
          </div>
          <span className="text-[9px] text-slate-400 ml-6 uppercase">{req.businessDays} Work Days</span>
        </div>
      )
    },
    {
      header: "Status",
      className: "text-center",
      render: (req) => <StatusBadge status={req.status} />
    },
    {
      header: "Actions",
      className: "text-right pr-6",
      render: (req) => (
        <div className="flex justify-end gap-3">
          {req.status === 'Pending' ? (
            <>
              <button 
                onClick={() => openEditModal(req)}
                className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all"
                title="Edit Request"
              >
                <HiOutlinePencilAlt size={18} />
              </button>
              <button 
                onClick={() => handleDelete(req._id)}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                title="Cancel Request"
              >
                <HiOutlineTrash size={18} />
              </button>
            </>
          ) : (
            <span className="text-[9px] font-black text-slate-300 uppercase px-3 py-1 bg-slate-50 rounded-lg">Locked</span>
          )}
        </div>
      )
    }
  ];

  if (isLoading) return <Loader message="Decrypting Registry..." />;

  const history = data?.history || [];
  const stats = data?.stats || null;

  return (
    <div className="max-w-[1800px] mx-auto pb-20 px-6">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10 mt-10">
        <div>
          <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase mb-2">My Wallet</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
            Personal Leave Ledger {isFetching && <span className="text-orange-500 animate-pulse ml-2">• Syncing</span>}
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="bg-slate-900 text-white px-10 py-5 rounded-[2.5rem] font-black text-lg hover:bg-orange-600 transition-all shadow-xl active:scale-95 border-b-4 border-slate-950"
        >
           <HiOutlinePlus className="inline mr-2" /> New Request
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Stats Sidebar */}
        <div className="lg:col-span-3 space-y-6">
          <StatBox label="Accrued Leave" value={`${stats?.earned || 0}d`} color="orange" icon={<HiOutlineShieldCheck />} />
          <StatBox label="Available Balance" value={`${stats?.remaining || 0}d`} color="slate" icon={<HiOutlineClock />} />
          
          <div className="p-6 rounded-[2rem] bg-slate-50 border-2 border-dashed border-slate-200">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Policy Note</h4>
            <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
              Requests can only be edited or cancelled while in "Pending" status. Approved leaves require Admin intervention to modify.
            </p>
          </div>
        </div>

        {/* Main Table Area */}
        <div className="lg:col-span-9">
          <div className="bg-white rounded-[3.5rem] border-2 border-slate-50 shadow-sm overflow-hidden min-h-[500px]">
            <Table columns={columns} data={history} emptyMessage="No history found in your ledger." />
          </div>
        </div>
      </div>

      {/* Reusable Modal for Create/Edit */}
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
  <div className="p-10 rounded-[3.5rem] bg-white border-2 border-slate-50 shadow-sm relative overflow-hidden group">
    <div className={`absolute -top-6 -right-6 text-6xl text-${color === 'orange' ? 'orange' : 'slate'}-50 opacity-50`}>{icon}</div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 relative z-10">{label}</p>
    <h3 className={`text-5xl font-black relative z-10 tracking-tighter ${color === 'orange' ? 'text-orange-600' : 'text-slate-900'}`}>{value}</h3>
  </div>
);

const StatusBadge = ({ status }) => {
  const styles = { 
    Pending: "bg-orange-50 text-orange-600 border-orange-100", 
    Approved: "bg-emerald-50 text-emerald-600 border-emerald-100", 
    Rejected: "bg-rose-50 text-rose-600 border-rose-100" 
  };
  return <span className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border ${styles[status]}`}>{status}</span>;
};
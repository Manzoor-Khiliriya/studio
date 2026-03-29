import React, { useState, useMemo } from "react";
import {
  HiOutlineClipboardDocumentList,
  HiOutlineUserCircle,
  HiOutlineMagnifyingGlass,
  HiOutlineCog6Tooth,
  HiOutlineCalendarDays,
  HiOutlineArrowPath
} from "react-icons/hi2";
import { toast } from "react-hot-toast";

// API Services
import {
  useGetAllLeavesQuery,
  useProcessLeaveMutation,
  useUpdateLeaveSettingsMutation,
  useDeleteLeaveMutation
} from "../../services/leaveApi";

// Components
import Table from "../../components/Table";
import Loader from "../../components/Loader";
import Pagination from "../../components/Pagination";
import ConfirmModal from "../../components/ConfirmModal";
import LeaveModal from "../../components/LeaveModal"; // Reusing Employee Modal
import CommonModal, { InputGroup } from "../../components/CommonModal";

// Helpers
import { 
  getAdminLeaveColumns, 
  getQuotaColumns, 
  getCasualLopColumns 
} from "../../utils/adminLeaveListHelper";

export default function AdminLeavePage() {
  const [activeTab, setActiveTab] = useState("requests");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Filter State
  const [dateRange, setDateRange] = useState("all");
  const [customDates, setCustomDates] = useState({ start: "", end: "" });

  // Modals State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  
  // Unified Confirm Modal State
  const [confirmConfig, setConfirmConfig] = useState({ 
    isOpen: false, 
    id: null, 
    status: null, 
    mode: 'status', // 'status' or 'delete'
    employeeName: "" 
  });

  const [configForm, setConfigForm] = useState({ leaveType: "Sick Leave", value: 10 });

  // RTK Query
  const { data, isLoading, isFetching } = useGetAllLeavesQuery({
    search: searchQuery,
    page,
    limit,
    view: activeTab,
    dateRange,
    startDate: customDates.start,
    endDate: customDates.end,
  });

  const [processLeave, { isLoading: isProcessing }] = useProcessLeaveMutation();
  const [updateSettings] = useUpdateLeaveSettingsMutation();
  const [deleteLeave, { isLoading: isDeleting }] = useDeleteLeaveMutation();

  // --- HANDLERS ---

  const handleResetFilters = () => {
    setDateRange("all");
    setCustomDates({ start: "", end: "" });
    setPage(1);
  };

  const handleOpenConfirm = (id, newStatus, rowData) => {
    setConfirmConfig({ 
      isOpen: true, 
      id, 
      status: newStatus, 
      mode: 'status', 
      employeeName: rowData?.user?.name || "Employee" 
    });
  };

  const handleOpenDelete = (id, rowData) => {
    setConfirmConfig({ 
      isOpen: true, 
      id, 
      mode: 'delete', 
      employeeName: rowData?.user?.name || "Record" 
    });
  };

  const handleOpenEdit = (leave) => {
    setSelectedLeave(leave);
    setIsEditModalOpen(true);
  };

  const executeAction = async () => {
    const { id, status, mode } = confirmConfig;
    const tId = toast.loading(mode === 'delete' ? "Purging record..." : `Updating to ${status}...`);
    
    try {
      if (mode === 'delete') {
        await deleteLeave(id).unwrap();
        toast.success("Record deleted permanently", { id: tId });
      } else {
        await processLeave({ id, status }).unwrap();
        toast.success(`Request ${status}`, { id: tId });
      }
      setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
    } catch (err) {
      toast.error(err.data?.message || "Operation failed", { id: tId });
    }
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    const tId = toast.loading(`Updating Policy...`);
    try {
      await updateSettings({ leaveType: configForm.leaveType, value: Number(configForm.value) }).unwrap();
      toast.success(`Policy updated`, { id: tId });
      setIsSettingsOpen(false);
    } catch (err) {
      toast.error("Update failed", { id: tId });
    }
  };

  // --- COLUMN MEMO ---
  const columns = useMemo(() => {
    if (activeTab === "requests") 
      return getAdminLeaveColumns(handleOpenConfirm, handleOpenEdit, handleOpenDelete);
    if (activeTab === "quota") 
      return getQuotaColumns();
    return getCasualLopColumns(handleOpenEdit, handleOpenDelete);
  }, [activeTab]);

  if (isLoading) return <Loader message="Accessing Attendance Matrix..." />;

  const leaves = data?.leaves || [];
  const paginationData = data?.pagination || { totalLeaves: 0, totalPages: 1 };

  return (
    <div className="p-8 bg-slate-100 min-h-screen">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Leave Management</h1>
          <p className="text-slate-500 text-sm font-medium">Monitoring personnel availability and policy compliance</p>
        </div>

        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
          {[
            { id: 'requests', label: 'Requests', icon: <HiOutlineClipboardDocumentList size={16} /> },
            { id: 'quota', label: 'Quotas', icon: <HiOutlineUserCircle size={16} /> },
            { id: 'casual-lop', label: 'Casual/LOP', icon: <HiOutlineCalendarDays size={16} /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setPage(1); handleResetFilters(); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${activeTab === tab.id ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex flex-col md:flex-row items-center gap-3 mb-8">
        <div className="relative flex-1 group w-full">
          <HiOutlineMagnifyingGlass className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search employee by name..."
            className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl focus:border-orange-500 outline-none font-bold text-xs transition-all shadow-sm"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
          />
        </div>

        {activeTab !== "quota" && (
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-full md:w-auto">
            <select
              className="bg-slate-50 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest outline-none rounded-xl cursor-pointer text-slate-700 min-w-[140px]"
              value={dateRange}
              onChange={(e) => { setDateRange(e.target.value); setPage(1); }}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="month">This Month</option>
              <option value="custom">Custom Range</option>
            </select>
            <button onClick={handleResetFilters} className="p-2.5 text-slate-400 hover:text-orange-600"><HiOutlineArrowPath size={18} /></button>
          </div>
        )}

        <button onClick={() => setIsSettingsOpen(true)} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-orange-600 transition-all cursor-pointer shadow-lg shadow-slate-200">
          <HiOutlineCog6Tooth />
        </button>
      </div>

      {/* TABLE */}
      <div className="border border-slate-200 rounded-[2rem] overflow-hidden bg-white shadow-xl shadow-slate-200/50">
        <div className={isFetching ? "opacity-50" : "opacity-100"}>
          <Table columns={columns} data={leaves} emptyMessage="No records matching filters." />
        </div>

        <div className="bg-white p-6 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <select
              value={limit}
              onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
              className="bg-slate-50 px-4 py-2 rounded-xl text-[9px] font-black outline-none cursor-pointer text-orange-600 border border-slate-100"
            >
              {[10, 25, 50].map((v) => <option key={v} value={v}>{v} Rows</option>)}
            </select>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Total {paginationData.totalLeaves} Records</span>
          </div>

          <Pagination
            pagination={{ current: page, total: paginationData.totalPages, count: paginationData.totalLeaves, limit }}
            onPageChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            loading={isFetching}
            label="Leaves"
          />
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* 1. Shared Edit Modal */}
      <LeaveModal 
        isOpen={isEditModalOpen} 
        onClose={() => { setIsEditModalOpen(false); setSelectedLeave(null); }} 
        initialData={selectedLeave} 
        isAdmin={true} 
      />

      {/* 2. Unified Confirm Modal (Status & Delete) */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={executeAction}
        isLoading={isProcessing || isDeleting}
        variant={confirmConfig.mode === "delete" ? "danger" : (confirmConfig.status === "Approved" ? "success" : "warning")}
        title={confirmConfig.mode === "delete" ? "Delete Record" : `${confirmConfig.status} Request`}
        message={
          confirmConfig.mode === "delete" 
            ? `Permanently delete the leave record for ${confirmConfig.employeeName}? This action is irreversible.`
            : ""
        }
      />

      {/* 3. Settings Modal */}
      <CommonModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} title="Policy Configuration" subtitle="Update Quotas" maxWidth="max-w-md">
        <form onSubmit={handleUpdateSettings} className="space-y-6">
          <InputGroup label="Policy Type">
            <select
              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none text-[11px] uppercase"
              value={configForm.leaveType}
              onChange={(e) => setConfigForm({ ...configForm, leaveType: e.target.value })}
            >
              <option value="Annual Leave">Annual Leave</option>
              <option value="Sick Leave">Sick Leave</option>
              <option value="Casual Leave">Casual Leave</option>
            </select>
          </InputGroup>
          <InputGroup label="Value (Days)">
            <input
              type="number" step="0.5" required
              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black outline-none text-slate-900 text-lg"
              value={configForm.value}
              onChange={(e) => setConfigForm({ ...configForm, value: e.target.value })}
            />
          </InputGroup>
          <div className="flex gap-4 pt-4">
            <button type="submit" className="flex-1 py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase hover:bg-orange-600">Save</button>
            <button type="button" onClick={() => setIsSettingsOpen(false)} className="flex-1 py-4 text-[11px] font-black uppercase text-slate-400">Cancel</button>
          </div>
        </form>
      </CommonModal>
    </div>
  );
}
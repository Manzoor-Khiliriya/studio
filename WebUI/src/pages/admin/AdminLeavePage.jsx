import React, { useState, useMemo, useEffect } from "react";
import {
  HiOutlineClipboardDocumentList,
  HiOutlineUserCircle,
  HiOutlineMagnifyingGlass,
  HiOutlineCog6Tooth,
} from "react-icons/hi2";
import { toast } from "react-hot-toast";

// API Services
import {
  useGetAllLeavesQuery,
  useProcessLeaveMutation,
  useGetLeaveSettingsQuery,
  useUpdateLeaveSettingsMutation
} from "../../services/leaveApi";

// Components
import Table from "../../components/Table";
import Loader from "../../components/Loader";
import Pagination from "../../components/Pagination";
import ConfirmModal from "../../components/ConfirmModal";
import CommonModal, { InputGroup } from "../../components/CommonModal";

// Helpers
import { getAdminLeaveColumns } from "../../utils/adminLeaveListHelper";

export default function AdminLeavePage() {
  // --- STATE ---
  const [activeTab, setActiveTab] = useState("requests");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // State for dynamic leave configuration
  const [configForm, setConfigForm] = useState({ leaveType: "Sick Leave", value: 10 });

  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    id: null,
    status: null,
    employeeName: "",
  });

  // --- DATA FETCHING ---
  const { data, isLoading, isFetching } = useGetAllLeavesQuery({
    search: searchQuery,
    status: activeTab === "requests" ? (statusFilter === "All" ? "" : statusFilter) : "",
    page,
    limit,
    view: activeTab,
  });

  const [updateSettings, { isLoading: isUpdatingSettings }] = useUpdateLeaveSettingsMutation();
  const [processLeave, { isLoading: isProcessing }] = useProcessLeaveMutation();

  // --- HANDLERS ---
  const handleOpenConfirm = (id, newStatus, rowData) => {
    setConfirmConfig({
      isOpen: true,
      id: id,
      status: newStatus,
      employeeName: rowData?.user?.name || "Employee",
    });
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    try {
      await updateSettings({
        leaveType: configForm.leaveType,
        value: Number(configForm.value)
      }).unwrap();
      toast.success(`${configForm.leaveType} Policy Updated`);
      setIsSettingsOpen(false);
    } catch (err) {
      toast.error(err.data?.message || "Update failed");
    }
  };

  const executeStatusUpdate = async () => {
    const { id, status } = confirmConfig;
    const toastId = toast.loading(`Updating status...`);
    try {
      await processLeave({ id, status }).unwrap();
      toast.success(`Request ${status}`, { id: toastId });
      setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
    } catch (err) {
      toast.error(err.data?.message || "Update failed", { id: toastId });
    }
  };

  // --- REUSABLE COLUMN RENDERER ---
  const renderQuotaCell = (balance, colorClass = "text-slate-900", isAccrual = false) => {
    if (!balance) return <span className="text-[10px] text-slate-300">N/A</span>;
    return (
      <div className="flex flex-col gap-1 min-w-[80px]">
        <div className="flex items-center justify-between border-b border-slate-50 pb-0.5">
          <span className="text-[8px] font-black text-slate-400 uppercase">Rem</span>
          <span className={`text-xs font-black ${colorClass}`}>{balance.remaining}d</span>
        </div>
        <div className="flex flex-col text-[8px] font-bold text-slate-500 uppercase">
          <span>Used: {balance.taken}d</span>
          <span>Total: {isAccrual ? balance.earned : balance.quota}d</span>
        </div>
      </div>
    );
  };

  // --- QUOTA COLUMN DEFINITIONS (SEPARATE SECTIONS) ---
  const quotaColumns = [
    {
      header: "Employee",
      render: (r) => (
        <div className="flex flex-col">
          <span className="font-black text-slate-900 text-sm uppercase">{r.employee?.user?.name || r.user?.name}</span>
          <span className="text-[9px] font-bold text-slate-400 uppercase italic">{r.employee?.designation || "Staff"}</span>
        </div>
      ),
    },
    {
      header: "Annual Leave",
      render: (r) => renderQuotaCell(r.balances?.["Annual Leave"], "text-emerald-600", true),
    },
    {
      header: "Sick Leave",
      render: (r) => renderQuotaCell(r.balances?.["Sick Leave"], "text-orange-600"),
    },
    {
      header: "Bereavement",
      render: (r) => renderQuotaCell(r.balances?.["Bereavement Leave"], "text-blue-600"),
    },
    {
      header: "Paternity",
      render: (r) => renderQuotaCell(r.balances?.["Paternity Leave"], "text-indigo-600"),
    },
    {
      header: "Maternity",
      render: (r) => renderQuotaCell(r.balances?.["Maternity Leave"], "text-pink-600"),
    },
    {
      header: "Casual/LOP",
      render: (r) => (
        <div className="flex flex-col gap-1">
          <div className="text-[9px] font-bold text-slate-600 uppercase flex justify-between">
            <span>Casual:</span> <b>{r.balances?.["Casual Leave"]?.taken ?? 0}d</b>
          </div>
          <div className="text-[9px] font-bold text-red-500 uppercase flex justify-between">
            <span>LOP:</span> <b>{r.balances?.["LOP"]?.taken ?? 0}d</b>
          </div>
        </div>
      ),
    },
  ];

  const columns = useMemo(() => {
    return activeTab === "requests" ? getAdminLeaveColumns(handleOpenConfirm) : quotaColumns;
  }, [activeTab]);

  if (isLoading) return <Loader message="Accessing Attendance Matrix..." />;

  const leaves = data?.leaves || [];
  const paginationData = data?.pagination || { totalLeaves: 0, totalPages: 1 };

  return (
    <div className="p-8 bg-white min-h-screen">

      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white font-black text-2xl italic shadow-lg shadow-orange-200">L</span>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Leave Management</h1>
          </div>
          <p className="text-slate-500 text-sm font-medium ml-1">
            {activeTab === 'requests' ? "Manage and review employee requests" : "Individual tracking for all leave categories"}
          </p>
        </div>

        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
          <button
            onClick={() => { setActiveTab('requests'); setPage(1); }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${activeTab === 'requests' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <HiOutlineClipboardDocumentList size={16} /> Requests
          </button>
          <button
            onClick={() => { setActiveTab('quota'); setPage(1); }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${activeTab === 'quota' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <HiOutlineUserCircle size={16} /> Quota Matrix
          </button>
        </div>
      </div>

      {/* FILTERS */}
      <div className="bg-slate-50/50 border border-slate-100 p-5 rounded-[2rem] mb-8 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[300px]">
          <HiOutlineMagnifyingGlass className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search employee..."
            className="w-full pl-12 pr-6 py-3.5 bg-white border border-slate-200 rounded-2xl focus:border-orange-500 outline-none font-bold text-xs transition-all shadow-sm"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
          />
        </div>

        <button
          onClick={() => setIsSettingsOpen(true)}
          className="p-3.5 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:text-orange-500 transition-all shadow-sm cursor-pointer"
          title="Policy Settings"
        >
          <HiOutlineCog6Tooth size={20} />
        </button>
      </div>

      {/* TABLE */}
      <div className="border border-slate-100 rounded-[2rem] overflow-x-auto bg-white shadow-sm">
        <div className={`${isFetching ? "opacity-50" : "opacity-100"} transition-opacity duration-200`}>
          <Table
            columns={columns}
            data={leaves}
            emptyMessage="No registry records found."
          />
        </div>

        {/* PAGINATION */}
        <div className="bg-slate-50/50 p-6 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 py-2 bg-white rounded-xl border border-slate-200">
              Total {paginationData?.totalLeaves} Results
            </span>
            <select
              value={limit}
              onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
              className="bg-white border border-slate-200 px-3 py-2 rounded-xl text-[10px] font-black outline-none cursor-pointer"
            >
              {[5, 10, 20, 50].map((v) => <option key={v} value={v}>Show {v}</option>)}
            </select>
          </div>
          <Pagination
            pagination={{ current: page, total: paginationData.totalPages }}
            onPageChange={setPage}
            loading={isFetching}
          />
        </div>
      </div>

      {/* --- SETTINGS MODAL --- */}
      <CommonModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title="Leave Configuration"
        subtitle="Set Monthly Accrual or Yearly Quota"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleUpdateSettings} className="space-y-6">
          <InputGroup label="Policy Type">
            <select
              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:border-orange-500 text-xs"
              value={configForm.leaveType}
              onChange={(e) => setConfigForm({ ...configForm, leaveType: e.target.value })}
            >
              <option value="Annual Leave">Annual Leave (Days/Month)</option>
              <option value="Sick Leave">Sick Leave (Days/Year)</option>
              <option value="Bereavement Leave">Bereavement Leave (Days/Year)</option>
              <option value="Paternity Leave">Paternity Leave (Days/Year)</option>
              <option value="Maternity Leave">Maternity Leave (Days/Year)</option>
            </select>
          </InputGroup>

          <InputGroup label="Value (Days)">
            <input
              type="number"
              step="0.1"
              required
              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:border-orange-500 text-slate-900"
              value={configForm.value}
              onChange={(e) => setConfigForm({ ...configForm, value: e.target.value })}
            />
          </InputGroup>

          <div className="flex gap-4 pt-4">
            <button type="submit" disabled={isUpdatingSettings} className="flex-1 py-4 bg-slate-900 text-white rounded-[1.5rem] text-[11px] font-black uppercase hover:bg-orange-600 transition-all shadow-xl shadow-orange-100 disabled:opacity-50">
              {isUpdatingSettings ? "Updating..." : "Save Policy"}
            </button>
            <button type="button" onClick={() => setIsSettingsOpen(false)} className="flex-1 py-4 text-[11px] font-black uppercase text-slate-400 hover:text-slate-600 transition-colors">Discard</button>

          </div>
        </form>
      </CommonModal>

      {/* --- CONFIRMATION MODAL --- */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={executeStatusUpdate}
        isLoading={isProcessing}
        title={`${confirmConfig.status} Request`}
        message={`Updating request for ${confirmConfig.employeeName} to ${confirmConfig.status}.`}
        variant={confirmConfig.status === "Approved" ? "success" : "danger"}
      />
    </div>
  );
}
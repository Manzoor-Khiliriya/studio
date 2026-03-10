import React, { useState, useMemo, useEffect } from "react";
import {
  HiOutlineClipboardDocumentList,
  HiOutlineUserCircle,
  HiOutlineMagnifyingGlass,
  HiOutlineCog6Tooth,
  HiOutlineCalendarDays,
  HiOutlineXMark,
} from "react-icons/hi2";
import { toast, Toaster } from "react-hot-toast";

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
  const [configForm, setConfigForm] = useState({ annualLeaveRate: 1.5, yearlySickQuota: 18 });

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

  const { data: globalSettings } = useGetLeaveSettingsQuery();
  const [updateSettings, { isLoading: isUpdatingSettings }] = useUpdateLeaveSettingsMutation();
  const [processLeave, { isLoading: isProcessing }] = useProcessLeaveMutation();

  useEffect(() => {
    if (globalSettings) {
      setConfigForm({
        annualLeaveRate: globalSettings.annualLeaveRate,
        yearlySickQuota: globalSettings.yearlySickQuota,
      });
    }
  }, [globalSettings]);

  // --- HANDLERS ---
  const handleOpenConfirm = (id, newStatus, rowData) => {
    setConfirmConfig({
      isOpen: true,
      id: id,
      status: newStatus,
      employeeName: rowData?.user?.name || "Operator",
    });
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    try {
      await updateSettings(configForm).unwrap();
      toast.success("Registry Config Updated");
      setIsSettingsOpen(false);
    } catch (err) {
      toast.error(err.data?.message || "Update failed");
    }
  };

  const executeStatusUpdate = async () => {
    const { id, status } = confirmConfig;
    const toastId = toast.loading(`Updating registry...`);
    try {
      await processLeave({ id, status }).unwrap();
      toast.success(`Request ${status}`, { id: toastId });
      setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
    } catch (err) {
      toast.error(err.data?.message || "Update failed", { id: toastId });
    }
  };

  // --- COLUMN DEFINITIONS ---
  const quotaColumns = [
    {
      header: "Employee",
      render: (r) => (
        <div className="flex flex-col">
          <span className="font-black text-slate-900 text-sm uppercase">{r.employee?.user?.name || r.employee?.name}</span>
          <span className="text-[9px] font-bold text-slate-400 uppercase italic">{r.employee?.designation || "Staff"}</span>
        </div>
      ),
    },
    {
      header: "Annual Leave",
      render: (r) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Bal:</span>
            <span className="text-xs font-black text-emerald-600">{r.annualRemaining}d</span>
          </div>
          <div className="text-[9px] font-bold text-slate-400">Taken: <span className="text-slate-900">{r.annualTaken}d</span> / {r.annualEarned}d</div>
        </div>
      ),
    },
    {
      header: "Sick/Casual Leave",
      render: (r) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Bal:</span>
            <span className="text-xs font-black text-orange-600">{r.sickRemaining}d</span>
          </div>
          <div className="text-[9px] font-bold text-slate-400">Taken: <span className="text-slate-900">{r.sickTaken}d</span> / {r.sickQuota}d</div>
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

  const pageTitle = "Leave Management";
  const iconText = pageTitle.charAt(0).toUpperCase();

  return (
    <div className="p-8 bg-white">

      {/* HEADER SECTION - Unified with Task Calendar Style */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white font-black text-2xl italic shadow-lg shadow-orange-200">
              {iconText}
            </span>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">
              {pageTitle}
            </h1>
          </div>
          <p className="text-slate-500 text-sm font-medium ml-1">
            {activeTab === 'requests' ? "Employee Leave Requests" : "Employee Leave Quotas"}
          </p>
        </div>

        {/* TAB SWITCHER - Inset Pill Style */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
          <button
            onClick={() => { setActiveTab('requests'); setPage(1); }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${activeTab === 'requests' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
              }`}
          >
            <HiOutlineClipboardDocumentList size={16} />
            Leave Requests
          </button>
          <button
            onClick={() => { setActiveTab('quota'); setPage(1); }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${activeTab === 'quota' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
              }`}
          >
            <HiOutlineUserCircle size={16} />
            Employee Leave
          </button>
        </div>
      </div>

      {/* FILTER BAR - Tactical Style */}
      <div className="bg-slate-50/50 border border-slate-100 p-5 rounded-[2rem] mb-8 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[300px] group">
          <HiOutlineMagnifyingGlass className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder={activeTab === 'requests' ? "Search employee..." : "Search employee logs..."}
            className="w-full pl-12 pr-6 py-3.5 bg-white border border-slate-200 rounded-2xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/5 outline-none font-bold text-xs transition-all shadow-sm group"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
          />
        </div>

        {activeTab === "requests" && (
          <div className="flex bg-white p-1 rounded-xl border border-slate-200">
            {["All", "Pending", "Approved", "Rejected"].map((status) => (
              <button
                key={status}
                onClick={() => { setStatusFilter(status); setPage(1); }}
                className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-tighter transition-all cursor-pointer ${statusFilter === status ? "bg-slate-900 text-white" : "text-slate-400 hover:bg-slate-50"
                  }`}
              >
                {status === "Pending" ? "Review" : status}
              </button>
            ))}
          </div>
        )}

        <button
          onClick={() => setIsSettingsOpen(true)}
          className="p-3.5 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:text-orange-500 transition-all shadow-sm cursor-pointer"
          title="Leave Configuration"
        >
          <HiOutlineCog6Tooth size={20} />
        </button>
      </div>

      {/* DATA TABLE CONTAINER */}
      <div className="border border-slate-100 rounded-[2rem] overflow-hidden bg-white shadow-sm">
        <div className={`${isFetching ? "opacity-50" : "opacity-100"} transition-opacity duration-200`}>
          <Table
            columns={columns}
            data={leaves}
            emptyMessage={activeTab === "requests" ? "No attendance records found." : "No employee quota logs detected."}
          />
        </div>

        {/* PAGINATION FOOTER - Integrated Limit Selector */}
        <div className="bg-slate-50/50 p-6 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100 pr-3">Page Limit</span>
              <select
                value={limit}
                onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                className="bg-transparent text-[9px] font-black outline-none cursor-pointer text-slate-700"
              >
                {[5, 10, 20, 50].map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight ml-2">Total {paginationData?.totalLeaves} results</span>
          </div>
          <Pagination
            pagination={{ current: page, total: paginationData.totalPages, count: paginationData.totalLeaves, limit: limit }}
            onPageChange={setPage}
            loading={isFetching}
            label="Records"
          />
        </div>
      </div>

      {/* --- CONFIGURATION MODAL --- */}
      <CommonModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title="Registry Configuration"
        subtitle="Adjust global leave accrual parameters"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleUpdateSettings} className="space-y-6">
          <InputGroup label="Annual Rate (Days/Month)">
            <input
              type="number"
              step="0.1"
              required
              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:border-orange-500 focus:bg-white transition-all text-slate-900"
              value={configForm.annualLeaveRate}
              onChange={(e) => setConfigForm({ ...configForm, annualLeaveRate: e.target.value })}
            />
          </InputGroup>

          <InputGroup label="Sick/Casual Quota (Days/Year)">
            <input
              type="number"
              required
              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:border-orange-500 focus:bg-white transition-all text-slate-900"
              value={configForm.yearlySickQuota}
              onChange={(e) => setConfigForm({ ...configForm, yearlySickQuota: e.target.value })}
            />
          </InputGroup>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => setIsSettingsOpen(false)}
              className="flex-1 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={isUpdatingSettings}
              className="flex-1 py-4 bg-slate-900 text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-xl shadow-orange-100 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isUpdatingSettings ? "Updating..." : "Save Settings"}
            </button>
          </div>
        </form>
      </CommonModal>

      {/* --- CONFIRMATION MODAL --- */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={executeStatusUpdate}
        isLoading={isProcessing}
        title={confirmConfig.status === "Approved" ? "Approve Request" : "Decline Request"}
        message={`Confirming ${confirmConfig.status} status for ${confirmConfig.employeeName}.`}
        variant={confirmConfig.status === "Approved" ? "success" : "danger"}
      />
    </div>
  );
}
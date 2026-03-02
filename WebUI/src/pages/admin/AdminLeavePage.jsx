import React, { useState, useMemo, useEffect } from "react";
import {
  HiOutlineUserGroup,
  HiOutlineXMark,
  HiOutlineClipboardDocumentList,
  HiOutlineUserCircle,
  HiOutlineMagnifyingGlass,
  HiOutlineCog6Tooth
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
import PageHeader from "../../components/PageHeader";
import Table from "../../components/Table";
import Loader from "../../components/Loader";
import Pagination from "../../components/Pagination";
import ConfirmModal from "../../components/ConfirmModal";

// Helpers
import { getAdminLeaveColumns } from "../../utils/adminLeaveListHelper";
import CommonModal, { InputGroup } from "../../components/CommonModal";

export default function AdminLeavePage() {
  // --- VIEW STATE ---
  const [activeTab, setActiveTab] = useState("requests");

  // --- FILTER STATE ---
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);

  // --- SETTINGS MODAL STATE ---
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [configForm, setConfigForm] = useState({ annualLeaveRate: 1.5, yearlySickQuota: 18 });

  // --- MODAL STATE ---
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

  // Sync settings data to local form when modal opens
  useEffect(() => {
    if (globalSettings) {
      setConfigForm({
        annualLeaveRate: globalSettings.annualLeaveRate,
        yearlySickQuota: globalSettings.yearlySickQuota,
      });
    }
  }, [globalSettings, isSettingsOpen]);

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
      toast.success("Global Proportions Updated");
      setIsSettingsOpen(false);
    } catch (err) {
      toast.error(err.data?.message || "Failed to update settings");
    }
  };

  const executeStatusUpdate = async () => {
    const { id, status } = confirmConfig;
    const toastId = toast.loading(`Updating registry to ${status}...`);

    try {
      await processLeave({ id, status }).unwrap();
      toast.success(`Request successfully ${status}`, { id: toastId });
      setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
    } catch (err) {
      toast.error(err.data?.message || "Registry update failed", { id: toastId });
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("All");
    setPage(1);
  };

  // --- COLUMN DEFINITIONS ---
  const quotaColumns = [
    {
      header: "Employee",
      render: (r) => (
        <div className="flex flex-col">
          <span className="font-black text-slate-900 text-sm uppercase">{r.employee?.user?.name || r.employee?.name}</span>
          <span className="text-[9px] font-bold text-slate-400 uppercase italic">
            {r.employee?.designation || "Staff"}
          </span>
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
          <div className="text-[9px] font-bold text-slate-400">
            Taken: <span className="text-slate-900">{r.annualTaken}d</span> / {r.annualEarned}d
          </div>
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
          <div className="text-[9px] font-bold text-slate-400">
            Taken: <span className="text-slate-900">{r.sickTaken}d</span> / {r.sickQuota}d
          </div>
        </div>
      ),
    },
  ];

  const columns = useMemo(() => {
    return activeTab === "requests"
      ? getAdminLeaveColumns(handleOpenConfirm)
      : quotaColumns;
  }, [activeTab]);

  if (isLoading) return <Loader message="Accessing Attendance Matrix..." />;

  const leaves = data?.leaves || [];
  const paginationData = data?.pagination || { totalLeaves: 0, totalPages: 1 };

  return (
    <div className="min-h-screen">
      <Toaster position="bottom-right" />
      <PageHeader
        title="Attendance Hub"
        subtitle="Manage employee absence requests and operational capacity logs."
      />

      <main className="max-w-[1700px] mx-auto px-8 -mt-10">

        {/* TACTICAL VIEW SWITCHER & SETTINGS */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex gap-4">
            <button
              onClick={() => { setActiveTab("requests"); setPage(1); }}
              className={`flex items-center gap-3 px-8 py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.15em] transition-all shadow-xl shadow-slate-200/50 ${activeTab === "requests" ? "bg-slate-900 text-white scale-105" : "bg-white text-slate-400 hover:bg-slate-50 border border-slate-100"}`}
            >
              <HiOutlineClipboardDocumentList size={22} />
              Request Logs
            </button>
            <button
              onClick={() => { setActiveTab("quota"); setPage(1); }}
              className={`flex items-center gap-3 px-8 py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.15em] transition-all shadow-xl shadow-slate-200/50 ${activeTab === "quota" ? "bg-orange-500 text-white scale-105" : "bg-white text-slate-400 hover:bg-slate-50 border border-slate-100"}`}
            >
              <HiOutlineUserCircle size={22} />
              Employee Quotas
            </button>
          </div>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-2 px-6 py-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 hover:text-orange-500 transition-all shadow-sm"
          >
            <HiOutlineCog6Tooth size={20} />
            Config
          </button>
        </div>

        {/* TACTICAL FILTER BAR */}
        <div className="bg-white/90 backdrop-blur-xl border border-slate-200 p-5 rounded-[2.5rem] shadow-xl shadow-slate-200/50 mb-8 flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[300px] group">
              <HiOutlineMagnifyingGlass className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={20} />
              <input
                type="text"
                placeholder={activeTab === "requests" ? "Search operator by name..." : "Find employee quota details..."}
                className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/5 outline-none font-bold text-sm transition-all"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              />
            </div>

            {activeTab === "requests" && (
              <div className="flex bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/50">
                {["All", "Pending", "Approved", "Rejected"].map((status) => (
                  <button
                    key={status}
                    onClick={() => { setStatusFilter(status); setPage(1); }}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === status ? "bg-white text-orange-600 shadow-md ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-800"}`}
                  >
                    {status === "Pending" ? "Review" : status === "Approved" ? "Authorized" : status === "Rejected" ? "Declined" : status}
                  </button>
                ))}
              </div>
            )}

            {(searchQuery || statusFilter !== "All") && (
              <button onClick={clearFilters} className="flex items-center gap-2 px-6 py-3 text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-2xl transition-all font-bold text-xs cursor-pointer">
                <HiOutlineXMark size={18} strokeWidth={2.5} />
                <span>RESET</span>
              </button>
            )}
          </div>
        </div>

        {/* DATA TABLE CONTAINER */}
        <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col group/table">
          <div className={`${isFetching ? "opacity-50 pointer-events-none" : "opacity-100"} transition-opacity duration-200`}>
            <Table
              columns={columns}
              data={leaves}
              emptyMessage={activeTab === "requests" ? "No attendance records found." : "No employee quota logs detected."}
            />
          </div>

          {/* PAGINATION FOOTER */}
          <div className="bg-slate-50/50 p-6 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100 pr-3">Page Limit</span>
                <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }} className="bg-transparent text-[9px] font-black outline-none cursor-pointer text-slate-700">
                  {[5, 10, 20, 50].map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight ml-2">Total {paginationData?.totalLeaves} results</span>
            </div>
            <Pagination pagination={{ current: page, total: paginationData.totalPages, count: paginationData.totalLeaves, limit: limit }} onPageChange={setPage} loading={isFetching} label="Records" />
          </div>
        </div>
      </main>

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

          {/* ACTION BUTTONS */}
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
              {isUpdatingSettings ? (
                <>
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Updating...
                </>
              ) : (
                "Save Settings"
              )}
            </button>
          </div>
        </form>
      </CommonModal>

      {/* --- STATUS UPDATE MODAL --- */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={executeStatusUpdate}
        isLoading={isProcessing}
        title={confirmConfig.status === "Approved" ? "Approve Request" : "Decline Request"}
        message={`Confirming ${confirmConfig.status} status for ${confirmConfig.employeeName}. This change will be final and archived.`}
        variant={confirmConfig.status === "Approved" ? "success" : "danger"}
        confirmText={confirmConfig.status === "Approved" ? "Confirm Approval" : "Confirm Decline"}
      />
    </div>
  );
}
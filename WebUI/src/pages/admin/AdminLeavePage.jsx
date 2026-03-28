import React, { useState, useMemo } from "react";
import {
  HiOutlineClipboardDocumentList,
  HiOutlineUserCircle,
  HiOutlineMagnifyingGlass,
  HiOutlineCog6Tooth,
  HiOutlineCalendarDays
} from "react-icons/hi2";
import { toast } from "react-hot-toast";

import {
  useGetAllLeavesQuery,
  useProcessLeaveMutation,
  useUpdateLeaveSettingsMutation
} from "../../services/leaveApi";

import Table from "../../components/Table";
import Loader from "../../components/Loader";
import Pagination from "../../components/Pagination";
import ConfirmModal from "../../components/ConfirmModal";
import CommonModal, { InputGroup } from "../../components/CommonModal";
import { getAdminLeaveColumns } from "../../utils/adminLeaveListHelper";

export default function AdminLeavePage() {
  const [activeTab, setActiveTab] = useState("requests"); // "requests", "quota", "casual-lop"
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [configForm, setConfigForm] = useState({ leaveType: "Sick Leave", value: 10 });
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, id: null, status: null, employeeName: "" });

  const { data, isLoading, isFetching } = useGetAllLeavesQuery({
    search: searchQuery,
    page,
    limit,
    view: activeTab,
  });

  const [updateSettings, { isLoading: isUpdatingSettings }] = useUpdateLeaveSettingsMutation();
  const [processLeave, { isLoading: isProcessing }] = useProcessLeaveMutation();

  const handleOpenConfirm = (id, newStatus, rowData) => {
    setConfirmConfig({ isOpen: true, id, status: newStatus, employeeName: rowData?.user?.name || "Employee" });
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

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading(`Updating ${configForm.leaveType} Policy...`);
    try {
      await updateSettings({
        leaveType: configForm.leaveType,
        value: Number(configForm.value)
      }).unwrap();

      toast.success(`Success: ${configForm.leaveType} updated to ${configForm.value} days`, { id: loadingToast });
      setIsSettingsOpen(false);
    } catch (err) {
      toast.error(err.data?.message || "Update failed", { id: loadingToast });
    }
  };

  // --- COLUMN DEFINITIONS ---
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
  ];

  const casualLopColumns = [
    {
      header: "Employee",
      render: (r) => (
        <div className="flex flex-col">
          <span className="font-black text-slate-900 text-[11px] uppercase">{r.user?.name}</span>
          <span className="text-[8px] font-bold text-slate-400 uppercase italic">{r.user?.employee?.designation}</span>
        </div>
      ),
    },
    {
      header: "Type",
      render: (r) => (
        <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${r.type === 'LOP' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
          {r.type}
        </span>
      ),
    },
    {
      header: "Dates",
      render: (r) => (
        <div className="text-[10px] font-bold text-slate-700">
          {new Date(r.startDate).toLocaleDateString()} - {new Date(r.endDate).toLocaleDateString()}
        </div>
      ),
    },
    { header: "Days", render: (r) => <b className="text-slate-900 text-[10px]">{r.duration}d</b> },
    { header: "Reason", render: (r) => <span className="text-[10px] text-slate-500 italic truncate max-w-[150px] inline-block">{r.reason}</span> },
  ];

  const columns = useMemo(() => {
    if (activeTab === "requests") return getAdminLeaveColumns(handleOpenConfirm);
    if (activeTab === "quota") return quotaColumns;
    return casualLopColumns;
  }, [activeTab]);

  if (isLoading) return <Loader message="Accessing Attendance Matrix..." />;

  const leaves = data?.leaves || [];
  const paginationData = data?.pagination || { totalLeaves: 0, totalPages: 1 };

  return (
    <div className="p-8 bg-white min-h-screen">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Leave Manager</h1>
          <p className="text-slate-500 text-sm font-medium">Monitoring personnel availability and policy compliance</p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
          {[
            { id: 'requests', label: 'Requests', icon: <HiOutlineClipboardDocumentList size={16} /> },
            { id: 'quota', label: 'Quota Matrix', icon: <HiOutlineUserCircle size={16} /> },
            { id: 'casual-lop', label: 'Casual/LOP', icon: <HiOutlineCalendarDays size={16} /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setPage(1); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${activeTab === tab.id ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* SEARCH */}
      <div className="flex items-center gap-4 mb-8">
        <div className="relative flex-1">
          <HiOutlineMagnifyingGlass className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search employee by name..."
            className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:border-orange-500 outline-none font-bold text-xs"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
          />
        </div>
        <button onClick={() => setIsSettingsOpen(true)} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-orange-600 transition-all cursor-pointer">
          <HiOutlineCog6Tooth size={20} />
        </button>
      </div>

      {/* TABLE */}
      <div className="border border-slate-100 rounded-[2rem] overflow-hidden bg-white shadow-sm">
        <div className={isFetching ? "opacity-50" : "opacity-100"}>
          <Table columns={columns} data={leaves} emptyMessage="No registry records found." />
        </div>

        <div className="bg-slate-50/50 p-6 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Total {paginationData?.totalLeaves} Records Found
          </span>
          <Pagination
            pagination={{ current: page, total: paginationData.totalPages }}
            onPageChange={setPage}
            loading={isFetching}
          />
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={executeStatusUpdate}
        isLoading={isProcessing}
        title={`${confirmConfig.status} Request`}
        message={`Confirm status change for ${confirmConfig.employeeName}.`}
        variant={confirmConfig.status === "Approved" ? "success" : "danger"}
      />

      {/* --- SETTINGS MODAL --- */}
      <CommonModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title="Leave Configuration"
        subtitle="Update Annual Accrual or Yearly Quotas"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleUpdateSettings} className="space-y-6">
          <InputGroup label="Policy Type">
            <select
              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:border-orange-500 text-[11px] uppercase tracking-wider"
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
            <div className="relative">
              <input
                type="number"
                step="0.1"
                required
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black outline-none focus:border-orange-500 text-slate-900 text-lg"
                value={configForm.value}
                onChange={(e) => setConfigForm({ ...configForm, value: e.target.value })}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">
                {configForm.leaveType === "Annual Leave" ? "Per Month" : "Per Year"}
              </span>
            </div>
          </InputGroup>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={isUpdatingSettings}
              className="flex-1 py-4 bg-slate-900 text-white rounded-[1.5rem] text-[11px] font-black uppercase hover:bg-orange-600 transition-all shadow-xl shadow-orange-100 disabled:opacity-50"
            >
              {isUpdatingSettings ? "Updating..." : "Save Policy"}
            </button>
            <button
              type="button"
              onClick={() => setIsSettingsOpen(false)}
              className="flex-1 py-4 text-[11px] font-black uppercase text-slate-400 hover:text-slate-600 transition-colors"
            >
              Discard
            </button>
          </div>
        </form>
      </CommonModal>
    </div>
  );
}


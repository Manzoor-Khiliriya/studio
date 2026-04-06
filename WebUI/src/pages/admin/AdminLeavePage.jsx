import React, { useState, useMemo } from "react";
import {
  HiOutlineClipboardDocumentList,
  HiOutlineUserCircle,
  HiOutlineMagnifyingGlass,
  HiOutlineCog6Tooth,
  HiOutlineCalendarDays,
  HiOutlineArrowPath,
  HiOutlineArrowDownTray // Added Export Icon
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
import LeaveModal from "../../components/LeaveModal";
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
  const [statusFilter, setStatusFilter] = useState("All");

  // Filter State
  const [dateRange, setDateRange] = useState("current-week");
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
    mode: 'status',
    employeeName: ""
  });

  const [configForm, setConfigForm] = useState({ leaveType: "Sick Leave", value: 10 });

  // RTK Query
  const { data, isLoading, isFetching } = useGetAllLeavesQuery({
    search: searchQuery,
    page,
    limit,
    view: activeTab,
    status: statusFilter,
    dateRange,
    startDate: customDates.start,
    endDate: customDates.end,
  });

  const [processLeave, { isLoading: isProcessing }] = useProcessLeaveMutation();
  const [updateSettings] = useUpdateLeaveSettingsMutation();
  const [deleteLeave, { isLoading: isDeleting }] = useDeleteLeaveMutation();

  // --- CSV EXPORT LOGIC ---
  const handleExportCSV = () => {
    if (!data?.leaves || data.leaves.length === 0) {
      return toast.error("No data available to export");
    }

    let csvContent = "";
    let fileName = `leave_report_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`;

    if (activeTab === "quota") {
      // 1. Define detailed headers
      const headers = [
        "Employee",
        "Code",
        "Annual (Earned)", "Annual (Used)", "Annual (Bal)",
        "Sick (Quota)", "Sick (Used)", "Sick (Bal)",
        "Bereavement (Quota)", "Bereavement (Used)", "Bereavement (Bal)",
        "Paternity (Quota)", "Paternity (Used)", "Paternity (Bal)",
        "Maternity (Quota)", "Maternity (Used)", "Maternity (Bal)"
      ];

      const rows = data.leaves.map(r => {
        const b = r.balances || {};

        return [
          r.employee?.user?.name || "N/A",
          r.employee?.employeeCode || "N/A",
          b["Annual Leave"]?.earned || 0,
          b["Annual Leave"]?.taken || 0,
          b["Annual Leave"]?.remaining || 0,
          b["Sick Leave"]?.quota || 0,
          b["Sick Leave"]?.taken || 0,
          b["Sick Leave"]?.remaining || 0,
          b["Bereavement Leave"]?.quota || 0,
          b["Bereavement Leave"]?.taken || 0,
          b["Bereavement Leave"]?.remaining || 0,
          b["Paternity Leave"]?.quota || 0,
          b["Paternity Leave"]?.taken || 0,
          b["Paternity Leave"]?.remaining || 0,
          b["Maternity Leave"]?.quota || 0,
          b["Maternity Leave"]?.taken || 0,
          b["Maternity Leave"]?.remaining || 0,
        ];
      });

      // 2. Generate CSV Content
      csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    } else {
      const headers = ["Employee", "Employee Code", "Type", "Requested On", "Start Date", "End Date", "Duration", "Status"];
      const rows = data.leaves.map(r => [
        r.user?.name,
        r.user?.employee?.employeeCode || "N/A",
        r.type,
        new Date(r.createdAt).toLocaleDateString('en-IN'),
        new Date(r.startDate).toLocaleDateString('en-IN'),
        new Date(r.endDate).toLocaleDateString('en-IN'),
        `${r.duration} days`,
        r.status
      ]);
      csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV Exported Successfully");
  };

  // --- HANDLERS ---
  const handleResetFilters = () => {
    setDateRange("current-week");
    setCustomDates({ start: "", end: "" });
    setStatusFilter("All");
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
    <div className="max-w-[1750px] mx-auto  p-8 bg-slate-100 min-h-screen">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-2">Leave Management</h1>
          <p className="text-slate-500 text-sm font-medium">Monitoring personnel availability and policy compliance</p>
        </div>

        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
          {[
            { id: 'requests', label: 'Leave Requests', icon: <HiOutlineClipboardDocumentList size={16} /> },
            { id: 'quota', label: 'Leave Quotas', icon: <HiOutlineUserCircle size={16} /> },
            { id: 'casual-lop', label: 'Casual/LOP Leaves', icon: <HiOutlineCalendarDays size={16} /> }
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
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex flex-col md:flex-row items-center gap-3">
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
              {activeTab === "requests" && (
                <select
                  className="bg-slate-50 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest outline-none rounded-xl cursor-pointer text-slate-700 min-w-[140px] border border-slate-100"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="All">All Status</option>
                  <option value="Pending" className="text-orange-500 font-bold">Pending</option>
                  <option value="Approved" className="text-emerald-500 font-bold">Approved</option>
                  <option value="Rejected" className="text-rose-500 font-bold">Declined</option>
                </select>
              )}

              <select
                className="bg-slate-50 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest outline-none rounded-xl cursor-pointer text-slate-700 min-w-[160px]  border border-slate-100"
                value={dateRange}
                onChange={(e) => {
                  setDateRange(e.target.value);
                  setPage(1);
                  if (e.target.value !== 'custom') setCustomDates({ start: "", end: "" });
                }}
              >
                <option value="all">All</option>
                <option value="today">Today</option>
                <option value="upcoming">Upcoming Leaves</option>
                <option value="current-week">Current Week</option>
                <option value="last-week">Last Week</option>
                <option value="current-month">Current Month</option>
                <option value="last-month">Last Month</option>
                <option value="custom">Custom Range</option>
              </select>

              {/* Reset Button - Modified to reset to "current-week" */}
              <button
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("All");
                  setDateRange("current-week");
                  setCustomDates({ start: "", end: "" });
                  setPage(1);
                }}
                className="cursor-pointer p-2.5 text-orange-400 hover:text-orange-600 transition-colors"
                title="Reset Filters"
              >
                <HiOutlineArrowPath size={18} />
              </button>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleExportCSV}
              className="p-4 bg-white text-slate-900 border border-slate-200 rounded-2xl hover:text-orange-600 transition-all cursor-pointer shadow-sm"
              title="Export to CSV"
            >
              <HiOutlineArrowDownTray size={18} />
            </button>
            <button onClick={() => setIsSettingsOpen(true)} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-orange-600 transition-all cursor-pointer shadow-lg shadow-slate-200">
              <HiOutlineCog6Tooth size={18} />
            </button>
          </div>
        </div>


        {/* --- CUSTOM DATE INPUTS --- */}
        {dateRange === "custom" && activeTab !== "quota" && (
          <div className="flex flex-wrap items-center gap-3 p-4 bg-orange-50 border border-orange-100 rounded-[1.5rem] animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-orange-600 ml-2">From:</span>
              <input
                type="date"
                className="bg-white px-4 py-2 rounded-xl border border-orange-200 text-xs font-bold outline-none focus:border-orange-500"
                value={customDates.start}
                onChange={(e) => setCustomDates(prev => ({ ...prev, start: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-orange-600">To:</span>
              <input
                type="date"
                className="bg-white px-4 py-2 rounded-xl border border-orange-200 text-xs font-bold outline-none focus:border-orange-500"
                value={customDates.end}
                onChange={(e) => setCustomDates(prev => ({ ...prev, end: e.target.value }))}
              />
            </div>
            <div className="ml-auto flex items-center gap-2 pr-4">
              <p className="text-[9px] font-bold text-orange-400 italic ml-auto mr-4">
                {activeTab === 'requests' ? "Filtering by submission date" : "Filtering by leave start date"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* TABLE */}
      <div className="border border-slate-200 rounded-[2rem] overflow-hidden bg-white shadow-xl shadow-slate-200/50">
        <div className={isFetching ? "opacity-50" : "opacity-100"}>
          <Table columns={columns} data={leaves} emptyMessage="No records matching filters." />
        </div>

        <div className="bg-white p-6 border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-200 pr-3">Page Limit</span>
              <select
                value={limit}
                onChange={(e) => { setLimit(Number(e.target.value)); setCurrentPage(1); }}
                className="bg-transparent text-[9px] font-black outline-none focus:ring-0 cursor-pointer text-slate-700"
              >
                {[5, 10, 25, 50].map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
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
      <LeaveModal
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setSelectedLeave(null); }}
        initialData={selectedLeave}
        isAdmin={true}
      />

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

      <CommonModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title="Policy Configuration"
        subtitle="Update Leave Quotas"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleUpdateSettings} className="space-y-6">
          <InputGroup label="Leave Type">
            <select
              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none text-[11px] uppercase focus:border-orange-500 transition-all"
              value={configForm.leaveType}
              onChange={(e) => setConfigForm({ ...configForm, leaveType: e.target.value })}
            >
              {/* Filtered List: No Casual or LOP */}
              <option value="Annual Leave">Annual Leave</option>
              <option value="Sick Leave">Sick Leave</option>
              <option value="Bereavement Leave">Bereavement Leave</option>
              <option value="Paternity Leave">Paternity Leave</option>
              <option value="Maternity Leave">Maternity Leave</option>
            </select>
          </InputGroup>

          <InputGroup label={configForm.leaveType === "Annual Leave" ? "Days Per Month" : "Days Per Year"}>
            <div className="relative">
              <input
                type="number"
                step="0.5"
                required
                placeholder="e.g. 1.5"
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black outline-none text-slate-900 text-lg focus:border-orange-500"
                value={configForm.value}
                onChange={(e) => setConfigForm({ ...configForm, value: e.target.value })}
              />
              <span className="absolute right-10 top-1/2 -translate-y-1/2 text-[12px] font-black text-slate-400 uppercase">
                Days
              </span>
            </div>
          </InputGroup>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="flex-1 py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase hover:bg-orange-600 cursor-pointer transition-all shadow-lg hover:shadow-orange-200"
            >
              Save Policy
            </button>
            <button
              type="button"
              onClick={() => setIsSettingsOpen(false)}
              className="flex-1 py-4 text-[11px] font-black uppercase text-slate-400 cursor-pointer hover:text-slate-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </CommonModal>
    </div>
  );
}
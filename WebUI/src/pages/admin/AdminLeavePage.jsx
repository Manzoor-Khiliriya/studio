import React, { useState, useMemo } from "react";
import {
  HiOutlineClipboardDocumentList,
  HiOutlineUserCircle,
  HiOutlineMagnifyingGlass,
  HiOutlineCog6Tooth,
  HiOutlineCalendarDays,
  HiOutlineArrowPath,
  HiOutlineArrowDownTray
} from "react-icons/hi2";
import { toast } from "react-hot-toast";
import {
  useGetAllLeavesQuery,
  useProcessLeaveMutation,
  useUpdateLeaveSettingsMutation,
  useDeleteLeaveMutation,
  useAdjustAnnualLeaveMutation
} from "../../services/leaveApi";
import Table from "../../components/Table";
import Loader from "../../components/Loader";
import Pagination from "../../components/Pagination";
import ConfirmModal from "../../components/ConfirmModal";
import LeaveModal from "../../components/LeaveModal";
import CommonModal, { InputGroup } from "../../components/CommonModal";
import {
  getAdminLeaveColumns,
  getQuotaColumns,
  getCasualLopColumns
} from "../../utils/adminLeaveListHelper";
import { useSocketEvents } from "../../hooks/useSocketEvents";
import CustomDropdown from "../../components/CustomDropdown";
import useDebounce from "../../hooks/useDebounce";

export default function AdminLeavePage() {
  const [activeTab, setActiveTab] = useState("requests");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [statusFilter, setStatusFilter] = useState("All");
  const [adjustUser, setAdjustUser] = useState(null);
  const [adjustValue, setAdjustValue] = useState(0);

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

  const [configForm, setConfigForm] = useState({
    leaveType: "Sick Leave",
    value: 10,
    carryForwardLimit: 0
  });

  const debouncedSearch = useDebounce(
    searchQuery.length > 1 ? searchQuery : "",
    400
  );
  // RTK Query
  const { data, isLoading, isFetching, refetch } = useGetAllLeavesQuery({
    search: debouncedSearch,
    page,
    limit,
    view: activeTab,
    status: statusFilter,
    dateRange,
    startDate: customDates.start,
    endDate: customDates.end,
  }, {
    refetchOnMountOrArgChange: false,
    keepUnusedDataFor: 300
  });

  const [processLeave, { isLoading: isProcessing }] = useProcessLeaveMutation();
  const [updateSettings] = useUpdateLeaveSettingsMutation();
  const [deleteLeave, { isLoading: isDeleting }] = useDeleteLeaveMutation();
  const [adjustAnnualLeave] = useAdjustAnnualLeaveMutation();

  useSocketEvents({
    onLeaveChange: refetch,
  });
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
    const tId = toast.loading(mode === 'delete' ? "Deleting record..." : `Updating to ${status}...`);

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

  const handleUpdateSettings = async () => {
    e.preventDefault();
    const tId = toast.loading(`Updating Policy...`);
    try {
      await updateSettings({
        leaveType: configForm.leaveType,
        value: Number(configForm.value),
        carryForwardLimit: Number(configForm.carryForwardLimit)
      }).unwrap(); toast.success(`Policy updated`, { id: tId });
      setIsSettingsOpen(false);
    } catch (err) {
      toast.error("Update failed", { id: tId });
    }
  };

  const handleAdjustmentSave = async () => {
    const tId = toast.loading("Updating adjustment...");
    try {
      await adjustAnnualLeave({
        userId: adjustUser._id,
        value: Number(adjustValue)
      }).unwrap();

      toast.success("Adjustment updated", { id: tId });
      setAdjustUser(null);
      refetch();
    } catch (err) {
      toast.error("Failed", { id: tId });
    }
  };

  const columns = useMemo(() => {
    if (activeTab === "requests")
      return getAdminLeaveColumns(handleOpenConfirm, handleOpenEdit, handleOpenDelete);
    if (activeTab === "quota")
      return getQuotaColumns(setAdjustUser, setAdjustValue);
    return getCasualLopColumns(handleOpenEdit, handleOpenDelete);
  }, [activeTab]);

  const leaves =
    data?.view === activeTab ? data.leaves : null;
  const paginationData = data?.pagination || { totalLeaves: 0, totalPages: 1 };
  const isTabLoading =
    isFetching &&
    data?.view !== activeTab;
  if (isLoading) return <Loader message="Accessing Attendance Matrix..." />;

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
                <CustomDropdown
                  value={statusFilter}
                  onChange={(val) => {
                    setStatusFilter(val);
                    setPage(1);
                  }}
                  options={[
                    { label: "All Status", value: "All" },
                    { label: "Pending", value: "Pending" },
                    { label: "Approved", value: "Approved" },
                    { label: "Declined", value: "Rejected" }
                  ]}
                  className="min-w-[140px]"
                  buttonClass="bg-slate-50 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl text-slate-700 border border-slate-100"
                />
              )}

              <CustomDropdown
                value={dateRange}
                onChange={(val) => {
                  setDateRange(val);
                  setPage(1);
                  if (val !== "custom") setCustomDates({ start: "", end: "" });
                }}
                options={[
                  { label: "All", value: "all" },
                  { label: "Today", value: "today" },
                  { label: "Upcoming Leaves", value: "upcoming" },
                  { label: "Current Week", value: "current-week" },
                  { label: "Last Week", value: "last-week" },
                  { label: "Current Month", value: "current-month" },
                  { label: "Last Month", value: "last-month" },
                  { label: "Custom Range", value: "custom" }
                ]}
                className="min-w-[160px]"
                buttonClass="bg-slate-50 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl text-slate-700 border border-slate-100"
              />

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
          {isTabLoading || !leaves ? (
            <Loader message="Loading data..." />
          ) : (
            <Table
              columns={columns}
              data={leaves}
              emptyMessage="No records found."
            />
          )}
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
        variant={confirmConfig.mode === "delete" ? "danger" : (confirmConfig.status === "Approved" ? "success" : "danger")}
        title={
          confirmConfig.mode === "delete"
            ? "Delete Record"
            : confirmConfig.status === "Approved"
              ? "Approve Request"
              : confirmConfig.status === "Rejected"
                ? "Reject Request"
                : "Update Request"
        }
        message={
          confirmConfig.mode === "delete"
            ? `Permanently delete the leave record for ${confirmConfig.employeeName}? This action is irreversible.`
            : confirmConfig.status === "Approved"
              ? `Approve leave request for ${confirmConfig.employeeName}? This will mark the request as approved.`
              : confirmConfig.status === "Rejected"
                ? `Reject leave request for ${confirmConfig.employeeName}? This action will decline the request.`
                : "Are you sure you want to proceed?"
        }
      />

      <CommonModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title="Policy Configuration"
        maxWidth="max-w-md"
        onSubmit={handleUpdateSettings}
        submitText="Save"
      >
        <form
          onSubmit={(e) => e.preventDefault()}
          className="space-y-4"
        >
          <InputGroup label="Leave Type">
            <CustomDropdown
              value={configForm.leaveType}
              onChange={(val) =>
                setConfigForm({ ...configForm, leaveType: val })
              }
              options={[
                "Annual Leave",
                "Sick Leave",
                "Bereavement Leave",
                "Paternity Leave",
                "Maternity Leave"
              ]}
              className="w-full"
              buttonClass="form-input text-xs font-bold -pl-6"
            />
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

          {configForm.leaveType === "Annual Leave" && (
            <InputGroup label="Carry Forward Limit">
              <input
                type="number"
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black outline-none text-slate-900 text-lg focus:border-orange-500"
                value={configForm.carryForwardLimit}
                onChange={(e) =>
                  setConfigForm({
                    ...configForm,
                    carryForwardLimit: e.target.value
                  })
                }
              />
            </InputGroup>
          )}

        </form>
      </CommonModal>

      <CommonModal
        isOpen={!!adjustUser}
        onClose={() => setAdjustUser(null)}
        title="Adjust Annual Leave"
        onSubmit={handleAdjustmentSave}
        submitText="Save"
        maxWidth="max-w-sm"
      >
        <InputGroup label="Adjustment (+ / -)">
          <input
            type="number"
            step="0.5"
            value={adjustValue}
            onChange={(e) => setAdjustValue(Number(e.target.value))}
            className="form-input pl-20"
          />
        </InputGroup>

      </CommonModal>
    </div>
  );
}
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

// API Services
import { useGetAllEmployeesQuery } from "../../services/employeeApi";
import { useChangeUserStatusMutation, useDeleteUserMutation } from "../../services/userApi";

// Icons
import { HiOutlineMagnifyingGlass, HiOutlineXMark } from "react-icons/hi2";

// Components
import PageHeader from "../../components/PageHeader";
import Table from "../../components/Table";
import Loader from "../../components/Loader";
import Pagination from "../../components/Pagination";
import EmployeeModal from "../../components/EmployeeModal";
import ConfirmModal from "../../components/ConfirmModal";

// Helpers
import { getEmployeeColumns } from "../../utils/adminEmployeeListHelper";

export default function EmployeeListPage() {
  const navigate = useNavigate();

  // --- UI STATE ---
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(5);

  // Modal States
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);

  // Unified Confirmation Modal State
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    type: null, // 'delete' or 'toggle'
  });

  // --- API HOOKS ---
  const { data, isLoading, isFetching } = useGetAllEmployeesQuery({
    page: currentPage,
    limit: limit,
    status: statusFilter === "All" ? undefined : statusFilter,
    search: searchTerm,
  });

  const [changeUserStatus, { isLoading: isUpdatingStatus }] = useChangeUserStatusMutation();
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();

  // --- CONSOLIDATED HANDLERS ---

  const closeConfirmModal = () => {
    setConfirmConfig({ isOpen: false, type: null });
  };

  const handleExecuteConfirm = async () => {
    if (!selectedEmp) return;

    const isDelete = confirmConfig.type === 'delete';
    const loadingMessage = isDelete ? "Deleting records..." : "Updating access...";
    const t = toast.loading(loadingMessage);

    try {
      if (isDelete) {
        // Handle Deletion
        await deleteUser(selectedEmp.user._id).unwrap();
        toast.success("Employee removed successfully", { id: t });
      } else {
        // Handle Status Toggle
        const currentStatus = selectedEmp.user?.status;
        const newStatus = currentStatus === "Enable" ? "Disable" : "Enable";
        await changeUserStatus({ id: selectedEmp.user._id, status: newStatus }).unwrap();
        toast.success(`Access ${newStatus === "Enable" ? "enabled" : "disabled"}`, { id: t });
      }
      closeConfirmModal();
      setSelectedEmp(null);
    } catch (err) {
      toast.error(err?.data?.message || "Operation failed", { id: t });
    }
  };

  // --- TABLE COLUMNS CONFIG ---
  const columns = useMemo(() => getEmployeeColumns({
    onEdit: (emp) => {
      setSelectedEmp(emp);
      setIsEmployeeModalOpen(true);
    },
    onDelete: (emp) => {
      setSelectedEmp(emp);
      setConfirmConfig({ isOpen: true, type: 'delete' });
    },
    onToggle: (emp) => {
      setSelectedEmp(emp);
      setConfirmConfig({ isOpen: true, type: 'toggle' });
    }
  }), []);

  if (isLoading) return <Loader message="Accessing Workforce Database..." />;

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Personnel Hub"
        subtitle="Manage agent credentials, performance metrics, and tactical access."
        iconText="E"
        actionLabel="Add Employee"
        onAction={() => { setSelectedEmp(null); setIsEmployeeModalOpen(true); }}
      />

      <main className="mx-auto px-8 -mt-10">
        {/* SEARCH & FILTER BAR */}
        <div className="bg-white/90 backdrop-blur-xl border border-slate-200 p-5 rounded-[2.5rem] shadow-xl shadow-slate-200/50 mb-8 flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[300px] group">
              <HiOutlineMagnifyingGlass className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={20} />
              <input
                type="text"
                placeholder="Search employee name..."
                className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/5 outline-none font-bold text-sm transition-all"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>

            <div className="flex bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/50">
              {["All", "Active", "Disabled"].map((status) => (
                <button
                  key={status}
                  onClick={() => { setStatusFilter(status); setCurrentPage(1); }}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === status
                    ? "bg-white text-orange-600 shadow-md ring-1 ring-slate-200"
                    : "text-slate-500 hover:text-slate-800"
                    }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {(searchTerm || statusFilter !== "All") && (
              <button
                onClick={() => { setSearchTerm(""); setStatusFilter("All"); }}
                className="flex items-center gap-2 px-6 py-3 text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-2xl transition-all font-bold text-xs cursor-pointer"
              >
                <HiOutlineXMark size={18} strokeWidth={2.5} />
                <span>CLEAR FILTERS</span>
              </button>
            )}
          </div>
        </div>

        {/* DATA TABLE CONTAINER */}
        <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col group/table">
          <Table
            columns={columns}
            data={data?.employees || []}
            onRowClick={(emp) => navigate(`/employees/${emp.user?._id}`)}
            emptyMessage="No personnel found matching current criteria."
          />

          {/* PAGINATION FOOTER */}
          <div className="bg-slate-50/50 p-6 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100 pr-3">
                  Page Limit
                </span>
                <select
                  value={limit}
                  onChange={(e) => { setLimit(Number(e.target.value)); setCurrentPage(1); }}
                  className="bg-transparent text-[9px] font-black outline-none focus:ring-0 cursor-pointer text-slate-700"
                >
                  {[5, 10, 25, 50].map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>

              {data?.totalEmployees && (
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight ml-2">
                  Total {data?.totalEmployees} results
                </span>
              )}
            </div>

            <Pagination
              pagination={{
                current: data?.currentPage,
                total: data?.totalPages,
                count: data?.totalEmployees,
                limit: limit,
              }}
              onPageChange={setCurrentPage}
              loading={isFetching}
              label="Personnel"
            />
          </div>
        </div>
      </main>

      {/* 1. EMPLOYEE ADD/EDIT MODAL */}
      <EmployeeModal
        isOpen={isEmployeeModalOpen}
        onClose={() => setIsEmployeeModalOpen(false)}
        editData={selectedEmp}
      />

      {/* 2. UNIFIED CONFIRMATION MODAL (Handles Delete and Status Toggles) */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={closeConfirmModal}
        onConfirm={handleExecuteConfirm}
        isLoading={isUpdatingStatus || isDeleting}

        // Dynamic properties based on the type of action
        title={confirmConfig.type === 'delete' ? "Delete Employee" : "Update Access"}
        message={confirmConfig.type === 'delete'
          ? `You are about to permanently delete ${selectedEmp?.user?.name}. This action cannot be undone.`
          : `Are you sure you want to change the access status for ${selectedEmp?.user?.name}?`}

        confirmText={
          confirmConfig.type === 'delete'
            ? "Delete Employee"
            : (selectedEmp?.user?.status === "Enable" ? "Disable Access" : "Enable Access")
        }
        // Dynamic Visual Variant
        variant={
          confirmConfig.type === 'delete'
            ? 'danger'
            : (selectedEmp?.user?.status === "Enable" ? 'danger' : 'success')
        }

      />
    </div>
  );
}
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { 
  useGetAllEmployeesQuery 
} from "../../services/employeeApi";
import { 
  useChangeUserStatusMutation, 
  useDeleteUserMutation 
} from "../../services/userApi";

// Icons
import { HiOutlineMagnifyingGlass, HiOutlineXMark } from "react-icons/hi2";

// Components
import PageHeader from "../../components/PageHeader";
import Table from "../../components/Table";
import Loader from "../../components/Loader";
import Pagination from "../../components/Pagination";
import EmployeeModal from "../../components/EmployeeModal";
import DeleteConfirmModal from "../../components/DeleteConfirmModal";

// Helpers
import { getEmployeeColumns } from "../../utils/adminEmployeeListHelper";

export default function EmployeeListPage() {
  const navigate = useNavigate();

  // --- STATE ---
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // --- API ---
  const { data, isLoading, isFetching } = useGetAllEmployeesQuery({
    page: currentPage,
    limit: limit,
    status: statusFilter === "All" ? undefined : statusFilter,
    search: searchTerm,
  });

  const [changeUserStatus] = useChangeUserStatusMutation();
  const [deleteUser] = useDeleteUserMutation();

  // --- HANDLERS ---
  const handleToggleStatus = async (emp) => {
    const isActive = emp.user?.status === "Enable";
    const newStatus = isActive ? "Disable" : "Enable";
    const t = toast.loading(`Switching status to ${newStatus}...`);
    try {
      await changeUserStatus({ id: emp.user._id, status: newStatus }).unwrap();
      toast.success(`Personnel access ${newStatus === "Enable" ? "restored" : "revoked"}`, { id: t });
    } catch (err) {
      toast.error("Operation failed", { id: t });
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedEmp?.user?._id) return;
    const t = toast.loading("Purging records...");
    try {
      await deleteUser(selectedEmp.user._id).unwrap();
      toast.success("Personnel removed from directory", { id: t });
      setIsDeleteOpen(false);
      setSelectedEmp(null);
    } catch (err) {
      toast.error("Deletion failed", { id: t });
    }
  };

  const columns = useMemo(() => getEmployeeColumns({
    onEdit: (emp) => { setSelectedEmp(emp); setIsModalOpen(true); },
    onDelete: (emp) => { setSelectedEmp(emp); setIsDeleteOpen(true); },
    onToggle: handleToggleStatus
  }), []);

  if (isLoading) return <Loader message="Accessing Workforce Database..." />;

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Personnel Hub"
        subtitle="Manage agent credentials, performance metrics, and tactical access."
        iconText="E"
        actionLabel="Add Personnel"
        onAction={() => { setSelectedEmp(null); setIsModalOpen(true); }}
      />

      <main className="max-w-[1700px] mx-auto px-8 -mt-10">
        {/* TACTICAL FILTER BAR */}
        <div className="bg-white/90 backdrop-blur-xl border border-slate-200 p-5 rounded-[2.5rem] shadow-xl shadow-slate-200/50 mb-8 flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-4">
            
            <div className="relative flex-1 min-w-[300px] group">
              <HiOutlineMagnifyingGlass className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={20} />
              <input
                type="text"
                placeholder="Search agent name..."
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
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    statusFilter === status
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

      <EmployeeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} editData={selectedEmp} />
      <DeleteConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        employeeName={selectedEmp?.user?.name}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
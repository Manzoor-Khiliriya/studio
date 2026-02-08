import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useChangeUserStatusMutation, useDeleteUserMutation } from "../services/userApi";
import { useGetAllEmployeesQuery } from "../services/employeeApi";
import {
  HiOutlinePencilSquare, HiOutlineTrash, HiOutlineMagnifyingGlass,
  HiOutlinePlus, HiOutlineXMark,
  HiOutlineCalendarDays,
  HiOutlineShieldCheck
} from "react-icons/hi2";
import { HiOutlineIdentification } from "react-icons/hi";
import { toast } from "react-hot-toast";

import Table from "../components/Table";
import Pagination from "../components/Pagination";
import Loader from "../components/Loader";
import EmployeeModal from "../components/EmployeeModal";
import DeleteConfirmModal from "../components/DeleteConfirmModal";
import { FiEdit, FiTrash2 } from "react-icons/fi";

export default function EmployeeListPage() {
  const navigate = useNavigate();

  // --- STATE ---
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(5);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // --- API ---
  const { data, isLoading, isFetching } = useGetAllEmployeesQuery({
    page: currentPage,
    limit: limit,
    status: statusFilter,
    search: searchTerm,
  });

  const [changeUserStatus] = useChangeUserStatusMutation();
  const [deleteUser] = useDeleteUserMutation();

  const handleToggleStatus = async (emp) => {
    const isActive = emp.user?.status === "Enable";
    const newStatus = isActive ? "Disable" : "Enable";

    const t = toast.loading("Updating status...");
    try {
      await changeUserStatus({ id: emp.user._id, status: newStatus }).unwrap();
      toast.success(`Account ${newStatus === "Enable" ? "activated" : "disabled"}`, { id: t });
    } catch (err) {
      toast.error("Failed to update status", { id: t });
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedEmp?.user?._id) return;
    const loadingToast = toast.loading("Deleting account...");
    try {
      await deleteUser(selectedEmp.user._id).unwrap();
      toast.success("Employee removed successfully", { id: loadingToast });
      setIsDeleteOpen(false);
      setSelectedEmp(null);
    } catch (err) {
      toast.error(err.data?.message || "Deletion failed", { id: loadingToast });
    }
  };

  const columns = [
    {
      header: "Employee",
      render: (emp) => (
        <div className="flex items-center gap-4 py-1">
          <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 font-bold border border-orange-100">
            {emp.user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm">
              {emp.user?.name || "Unknown"}
            </p>
            <div className="flex items-center gap-1.5 opacity-60">
              <HiOutlineIdentification size={12} />
              <p className="text-[10px] font-bold uppercase tracking-wider">
                {emp.designation || "Staff"}
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      header: "Contact",
      render: (emp) => (
        <span className="text-xs font-medium text-slate-500">{emp.user.email}</span>
      )
    },
    {
      header: "Joined Date",
      render: (emp) => (
        <div className="flex items-center gap-2 text-slate-500">
          <HiOutlineCalendarDays size={16} className="opacity-40" />
          <span className="text-xs font-semibold">
            {emp.joinedDate ? new Date(emp.joinedDate).toLocaleDateString() : "N/A"}
          </span>
        </div>
      )
    },
    {
      header: "Performance",
      className: "text-center",
      cellClassName: "text-center",
      render: (emp) => (
        <span className="text-sm font-bold text-slate-800">{emp.efficiency || 100}%</span>
      )
    },
    {
      header: "Status",
      className: "text-center",
      cellClassName: "text-center",
      render: (emp) => {
        const isActive = emp.user?.status === "Enable";
        return (
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${isActive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
            }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-red-500"}`} />
            {isActive ? "Active" : "Disabled"}
          </span>
        );
      }
    },
    {
      header: "Actions",
      className: "text-left",
      cellClassName: "text-left",
      render: (emp) => (
        <div className="flex justify-between gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); handleToggleStatus(emp); }}
            className={`rounded-lg transition-colors cursor-pointer ${emp.user?.status === "Enable" ? "text-emerald-500 hover:text-red-600" : "text-red-500 hover:text-emerald-600"}`}
            title={`${emp.user?.status === "Enable" ? "Disable Access" : "Enable Access"}`}
          >
            <HiOutlineShieldCheck size={18} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setSelectedEmp(emp); setIsModalOpen(true); }}
            className="rounded-lg text-yellow-500 hover:text-yellow-600 transition-colors cursor-pointer"
            title="Update Profile"
          >
            <FiEdit size={18} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setSelectedEmp(emp); setIsDeleteOpen(true); }}
            className="rounded-lg text-red-500 hover:text-red-600 transition-colors cursor-pointer"
            title="Delete User"
          >
            <FiTrash2 size={18} />
          </button>
        </div>
      )
    }
  ];

  if (isLoading) return <Loader message="Syncing employee records..." />;

  return (
    <div className="max-w-[1600px] mx-auto pb-20 px-4 md:px-8">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 mb-10 mt-12">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-1 bg-orange-500 rounded-full" />
            <p className="text-orange-600 font-bold text-[11px] uppercase tracking-[0.2em]">Workforce Directory</p>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">Team Hub</h1>

          {/* FILTERS BAR */}
          <div className="flex flex-wrap items-center gap-4 mt-8">
            <div className="relative min-w-[320px]">
              <HiOutlineMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Search by name..."
                className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/5 transition-all outline-none text-sm"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>

            <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
              {["All", "Active", "Disabled"].map((s) => (
                <button
                  key={s}
                  onClick={() => { setStatusFilter(s); setCurrentPage(1); }}
                  className={`px-6 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all ${statusFilter === s ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
                    }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {(searchTerm || statusFilter !== "All") && (
              <button
                onClick={() => { setSearchTerm(""); setStatusFilter("All"); }}
                className="text-slate-400 hover:text-rose-500 transition-colors"
              >
                <HiOutlineXMark size={24} />
              </button>
            )}
          </div>
        </div>

        <button
          onClick={() => { setSelectedEmp(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-orange-500/20 active:scale-95 cursor-pointer"
        >
          <HiOutlinePlus strokeWidth={2.5} size={20} />
          <span>Add Employee</span>
        </button>
      </div>

      {/* TABLE SECTION */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        <div className="overflow-x-auto">
          <Table
            columns={columns}
            data={data?.employees || []}
            onRowClick={(emp) => navigate(`/employees/${emp.user?._id}`)}
            emptyMessage="No employees found matching your criteria."
          />
        </div>

        <div className="mt-auto p-6 border-t border-slate-50 bg-slate-50/50">
          <Pagination
            pagination={{
              current: data?.currentPage,
              total: data?.totalPages,
              count: data?.totalEmployees
            }}
            onPageChange={setCurrentPage}
            loading={isFetching}
            label="Employees"
          />
        </div>
      </div>

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
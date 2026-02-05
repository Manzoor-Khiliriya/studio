import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useChangeUserStatusMutation, useDeleteUserMutation } from "../services/userApi";
import { useGetAllEmployeesQuery } from "../services/employeeApi";
import {
  HiOutlinePencilSquare, HiOutlineTrash, HiOutlineMagnifyingGlass,
  HiOutlinePlus, HiOutlineXMark,
  HiOutlineCalendarDateRange,
  HiOutlineShieldCheck
} from "react-icons/hi2";
import { HiOutlineIdentification } from "react-icons/hi";
import { toast } from "react-hot-toast";

import Table from "../components/Table";
import Pagination from "../components/Pagination";
import Loader from "../components/Loader";
import EmployeeModal from "../components/EmployeeModal";
import DeleteConfirmModal from "../components/DeleteConfirmModal";

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
    status: statusFilter,
    search: searchTerm,
  });

  const [changeUserStatus] = useChangeUserStatusMutation();
  const [deleteUser] = useDeleteUserMutation();

  const handleToggleStatus = async (emp) => {
    const isActive = emp.user?.status === "Enable";
    const newStatus = isActive ? "Disable" : "Enable";

    const t = toast.loading("Updating access level...");
    try {
      await changeUserStatus({ id: emp.user._id, status: newStatus }).unwrap();
      toast.success(`User ${newStatus === "Enable" ? "activated" : "disabled"}`, { id: t });
    } catch (err) {
      toast.error("Status update failed", { id: t });
    }
  };

  // --- HANDLERS ---
  const handleConfirmDelete = async () => {
    if (!selectedEmp?.user?._id) return;

    const loadingToast = toast.loading("Executing terminal revocation...");
    try {
      // Backend deleteUser removes both User and Employee via the User ID
      await deleteUser(selectedEmp.user._id).unwrap();
      toast.success(`Access revoked for ${selectedEmp.user.name}`, { id: loadingToast });
      setIsDeleteOpen(false);
      setSelectedEmp(null);
    } catch (err) {
      toast.error(err.data?.message || "Protocol override failed", { id: loadingToast });
    }
  };

  // --- TABLE COLUMNS CONFIGURATION ---
  const columns = [
    {
      header: "Operator Profile",
      render: (emp) => (
        <div className="flex items-center gap-5 py-2">
          <div>
            <p className="font-black text-slate-900 text-base tracking-tighter uppercase leading-tight group-hover:text-orange-600 transition-colors">
              {emp.user?.name || "Unknown"}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <HiOutlineIdentification className="text-orange-500" size={12} />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {emp.designation || "Junior Developer"}
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      header: "Email",
      className: "",
      cellClassName: "",
      render: (emp) => (
        <div className="">
          <span className="text-xs font-bold text-slate-900 leading-none">{emp.user.email || ""}</span>
        </div>
      )
    },
    {
      header: "Date of Joining",
      render: (emp) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-slate-600">
            <HiOutlineCalendarDateRange size={16} className="text-slate-300" />
            <span className="text-xs font-bold">
              {emp.joinedDate ? emp.joinedDate.split("T")[0] : ""}
            </span>

          </div>
        </div>
      )
    },
    {
      header: "Efficiency",
      className: "text-center",
      cellClassName: "text-center",
      render: (emp) => (
        <div className="inline-flex flex-col items-center">
          <span className="text-lg font-black text-slate-900 leading-none">{emp.efficiency || 100}%</span>
        </div>
      )
    },
    {
      header: "Employee Status",
      className: "text-center",
      cellClassName: "text-center",
      render: (emp) => {
        const isActive = emp.user?.status === "Enable";
        return (
          <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] border-2 ${isActive ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
            }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
            {isActive ? "Active" : "Access Restricted"}
          </span>
        );
      }
    },
    {
      header: "Admin Override",
      className: "text-right pr-12",
      cellClassName: "text-right pr-12",
      render: (emp) => (
        <div className="flex justify-end gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleStatus(emp);
            }}
            className="p-3.5 rounded-2xl bg-slate-50 text-slate-400 hover:bg-rose-600 hover:text-white transition-all shadow-sm active:scale-95"
            title="Toggle Access"
          >
            <HiOutlineShieldCheck size={20} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setSelectedEmp(emp); setIsModalOpen(true); }}
            className="p-3.5 rounded-2xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm active:scale-95"
            title="Modify Profile"
          >
            <HiOutlinePencilSquare size={20} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setSelectedEmp(emp); setIsDeleteOpen(true); }}
            className="p-3.5 rounded-2xl bg-slate-50 text-slate-400 hover:bg-rose-600 hover:text-white transition-all shadow-sm active:scale-95"
            title="Revoke Access"
          >
            <HiOutlineTrash size={20} />
          </button>
        </div>
      )
    }
  ];

  if (isLoading) return <Loader message="Accessing Personnel Database..." />;

  return (
    <div className="max-w-[1700px] mx-auto pb-24 px-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col 2xl:flex-row justify-between items-start 2xl:items-end gap-10 mb-12 mt-12">
        <div className="w-full 2xl:w-auto">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-1 bg-orange-600" />
            <p className="text-orange-500 font-black text-xs uppercase tracking-[0.5em]">Sector Personnel Directory</p>
          </div>
          <h1 className="text-7xl font-black text-slate-900 tracking-tighter uppercase leading-none">Team Hub</h1>

          <div className="flex flex-wrap items-center gap-5 mt-10">
            {/* SEARCH BOX */}
            <div className="relative min-w-[380px] group">
              <HiOutlineMagnifyingGlass className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={22} />
              <input
                type="text"
                placeholder="Search operator name..."
                className="w-full pl-14 pr-6 py-5 bg-white border-2 border-slate-100 rounded-[2rem] focus:border-orange-500 focus:shadow-xl focus:shadow-orange-500/5 transition-all outline-none font-bold text-sm"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>

            {/* STATUS FILTERS */}
            <div className="flex bg-slate-100/50 p-2 rounded-[1.8rem] border border-slate-100">
              {["All", "Active", "Disabled"].map((s) => (
                <button
                  key={s}
                  onClick={() => { setStatusFilter(s); setCurrentPage(1); }}
                  className={`px-8 py-3.5 rounded-[1.3rem] text-[11px] font-black uppercase tracking-widest transition-all ${statusFilter === s
                    ? "bg-slate-900 text-white shadow-xl"
                    : "text-slate-400 hover:text-slate-900"
                    }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* LIMIT SELECTOR */}
            <div className="relative">
              <select
                value={limit}
                onChange={(e) => { setLimit(Number(e.target.value)); setCurrentPage(1); }}
                className="appearance-none pl-6 pr-12 py-5 bg-white border-2 border-slate-100 rounded-[1.8rem] focus:border-orange-500 outline-none font-black text-[11px] uppercase cursor-pointer"
              >
                {[5, 10, 20, 50].map(v => <option key={v} value={v}>{v} Per Batch</option>)}
              </select>
              <span className="absolute -top-2 left-6 bg-white px-2 text-[8px] font-black text-slate-300 uppercase tracking-widest">Page Load</span>
            </div>

            {(searchTerm || statusFilter !== "All") && (
              <button
                onClick={() => { setSearchTerm(""); setStatusFilter("All"); }}
                className="px-6 py-5 text-rose-500 font-black text-[11px] uppercase flex items-center gap-2 hover:bg-rose-50 rounded-2xl transition-all"
              >
                <HiOutlineXMark size={18} /> Reset Sector
              </button>
            )}
          </div>
        </div>

        {/* ONBOARD BUTTON */}
        <button
          onClick={() => { setSelectedEmp(null); setIsModalOpen(true); }}
          className="flex items-center gap-4 bg-orange-600 hover:bg-slate-900 text-white px-12 py-6 rounded-[2.5rem] font-black text-lg transition-all shadow-2xl shadow-orange-600/20 active:scale-95"
        >
          <HiOutlinePlus strokeWidth={3} size={24} />
          <span className="uppercase tracking-tighter">Onboard Talent</span>
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-[4rem] border-2 border-slate-50 shadow-[0_20px_50px_rgba(0,0,0,0.02)] overflow-hidden min-h-[600px] flex flex-col justify-between">
        <div className="overflow-x-auto">
          <Table
            columns={columns}
            data={data?.employees || []}
            onRowClick={(emp) => navigate(`/employees/${emp.user?._id}`)}
            emptyMessage="Zero personnel detected in this search radius."
          />
        </div>

        {/* PAGINATION */}
        <div className="p-8 border-t border-slate-50 bg-slate-50/30">
          <Pagination
            pagination={{
              current: data?.currentPage,
              total: data?.totalPages,
              count: data?.totalEmployees
            }}
            onPageChange={setCurrentPage}
            loading={isFetching}
            label="Operators"
          />
        </div>
      </div>

      {/* MODALS */}
      <EmployeeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editData={selectedEmp}
      />

      <DeleteConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        employeeName={selectedEmp?.user?.name}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
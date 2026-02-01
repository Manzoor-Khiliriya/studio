import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGetAllUsersQuery, useDeleteUserMutation } from "../services/userApi";
import { 
  HiOutlinePencilSquare, HiOutlineTrash, HiOutlineMagnifyingGlass,
  HiOutlinePlus, HiOutlineXMark 
} from "react-icons/hi2";
import { HiOutlineMail } from "react-icons/hi";
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
  const { data, isLoading, isFetching } = useGetAllUsersQuery({
    page: currentPage,
    limit: limit,
    search: searchTerm,
    status: statusFilter === "All" ? undefined : statusFilter
  });
  const [deleteEmployee] = useDeleteUserMutation();

  // --- TABLE COLUMNS CONFIGURATION ---
  const columns = [
    {
      header: "Operator",
      render: (emp) => (
        <div className="flex items-center gap-4">
          <img
            src={emp.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=f1f5f9&color=64748b`}
            className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-sm"
            alt=""
          />
          <div>
            <p className="font-black text-slate-800 text-sm uppercase group-hover:text-orange-600 transition-colors">{emp.name}</p>
            <p className="text-[10px] font-bold text-orange-500 uppercase tracking-tighter">{emp.designation || "Executive"}</p>
          </div>
        </div>
      )
    },
    {
      header: "Contact Info",
      render: (emp) => (
        <div className="flex items-center gap-2 text-slate-500">
          <HiOutlineMail size={16} className="text-slate-300" />
          <span className="text-xs font-bold lowercase">{emp.email}</span>
        </div>
      )
    },
    {
      header: "Efficiency",
      className: "text-center",
      cellClassName: "text-center",
      render: (emp) => (
        <div className="inline-block px-4 py-1.5 bg-slate-50 rounded-xl border border-slate-100 font-black text-slate-700 text-xs">
          {emp.efficiency || 100}%
        </div>
      )
    },
    {
      header: "Status",
      className: "text-center",
      cellClassName: "text-center",
      render: (emp) => (
        <span className={`inline-block px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
          emp.status === "Enable" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
        }`}>
          {emp.status === "Enable" ? "Active" : "Banned"}
        </span>
      )
    },
    {
      header: "Actions",
      className: "text-right pr-10",
      cellClassName: "text-right pr-10",
      render: (emp) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); setSelectedEmp(emp); setIsModalOpen(true); }}
            className="p-3 rounded-xl bg-slate-50 text-slate-400 hover:bg-orange-600 hover:text-white transition-all active:scale-90"
          >
            <HiOutlinePencilSquare size={18} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setSelectedEmp(emp); setIsDeleteOpen(true); }}
            className="p-3 rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-600 hover:text-white transition-all active:scale-90"
          >
            <HiOutlineTrash size={18} />
          </button>
        </div>
      )
    }
  ];

  // --- HANDLERS ---
  const handleConfirmDisable = async () => {
    try {
      await deleteEmployee(selectedEmp._id).unwrap();
      toast.success(`${selectedEmp.name} restricted`);
      setIsDeleteOpen(false);
    } catch {
      toast.error("Action failed");
    }
  };

  if (isLoading) return <Loader message="Accessing Team Directory..." />;

  return (
    <div className="max-w-[1800px] mx-auto pb-20 px-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-8 mb-8 mt-10">
        <div className="w-full xl:w-auto">
          <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase mb-6">Team Hub</h1>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative min-w-[320px] flex-1 group">
              <HiOutlineMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={20} />
              <input
                type="text"
                placeholder="Search name or role..."
                className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-slate-100 rounded-2xl focus:border-orange-500 outline-none font-bold text-xs"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>

            <div className="flex bg-slate-100/50 p-1.5 rounded-2xl border border-slate-100">
              {["All", "Active", "Disabled"].map((s) => (
                <button
                  key={s}
                  onClick={() => { setStatusFilter(s); setCurrentPage(1); }}
                  className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${statusFilter === s ? "bg-white text-orange-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="relative">
              <select
                value={limit}
                onChange={(e) => { setLimit(Number(e.target.value)); setCurrentPage(1); }}
                className="appearance-none pl-4 pr-10 py-3.5 bg-white border-2 border-slate-100 rounded-2xl focus:border-orange-500 outline-none font-bold text-[10px] uppercase cursor-pointer"
              >
                {[5, 10, 20, 50].map(v => <option key={v} value={v}>{v} Per Page</option>)}
              </select>
              <span className="absolute -top-2 left-3 bg-white px-1 text-[8px] font-black text-slate-400 uppercase">Limit</span>
            </div>

            {(searchTerm || statusFilter !== "All") && (
              <button onClick={() => {setSearchTerm(""); setStatusFilter("All");}} className="text-rose-500 font-black text-[10px] uppercase flex items-center gap-1">
                <HiOutlineXMark size={14}/> Clear
              </button>
            )}
          </div>
        </div>

        <button
          onClick={() => { setSelectedEmp(null); setIsModalOpen(true); }}
          className="flex items-center gap-3 bg-slate-900 hover:bg-orange-600 text-white px-10 py-5 rounded-[2rem] font-black text-lg transition-all"
        >
          <HiOutlinePlus strokeWidth={3} size={22} /> Add Talent
        </button>
      </div>

      {/* REUSABLE TABLE CONTAINER */}
      <div className="bg-white rounded-[3rem] border-2 border-slate-50 shadow-sm overflow-hidden min-h-[500px] flex flex-col justify-between">
        <Table 
          columns={columns} 
          data={data?.employees || []} 
          onRowClick={(emp) => navigate(`/employees/${emp._id}`)}
          emptyMessage="No operators found in sector."
        />

        {/* PAGINATION */}
        <Pagination
          pagination={{ current: data?.currentPage, total: data?.totalPages, count: data?.totalEmployees }}
          onPageChange={setCurrentPage}
          loading={isFetching}
          label="Operators"
        />
      </div>

      {/* MODALS */}
      <EmployeeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} editData={selectedEmp} />
      <DeleteConfirmModal 
        isOpen={isDeleteOpen} 
        onClose={() => setIsDeleteOpen(false)} 
        employeeName={selectedEmp?.name} 
        onConfirm={handleConfirmDisable} 
      />
    </div>
  );
}
import React, { useState, useMemo } from "react";
import { HiOutlineUserGroup, HiOutlineXMark } from "react-icons/hi2";
import { toast, Toaster } from "react-hot-toast";

// API Services
import { useGetAllLeavesQuery, useProcessLeaveMutation } from "../../services/leaveApi";

// Components
import PageHeader from "../../components/PageHeader";
import Table from "../../components/Table";
import Loader from "../../components/Loader";
import Pagination from "../../components/Pagination";

// Helpers
import { getAdminLeaveColumns } from "../../utils/adminLeaveListHelper";
import { HiOutlineSearch } from "react-icons/hi";

export default function AdminLeavePage() {
  // --- STATE MANAGEMENT ---
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // --- DATA FETCHING & MUTATIONS ---
  const { data, isLoading, isFetching } = useGetAllLeavesQuery({
    search: searchQuery,
    status: statusFilter === "All" ? "" : statusFilter,
    page,
    limit,
  });

  const [processLeave] = useProcessLeaveMutation();

  // --- HANDLERS ---
  const handleStatusUpdate = async (id, newStatus) => {
    const toastId = toast.loading(`Updating registry to ${newStatus}...`);
    try {
      await processLeave({ id, status: newStatus }).unwrap();
      toast.success(`Request successfully ${newStatus}`, { id: toastId });
    } catch (err) {
      toast.error(err.data?.message || "Registry update failed", { id: toastId });
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("All");
    setPage(1);
  };

  // --- COLUMN DEFINITION ---
  // Memoized to prevent re-renders, passing the mutation handler to the helper
  const columns = useMemo(() => getAdminLeaveColumns(handleStatusUpdate), []);

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

        {/* TACTICAL FILTER BAR */}
        <div className="bg-white/90 backdrop-blur-xl border border-slate-200 p-5 rounded-[2.5rem] shadow-xl shadow-slate-200/50 mb-8 flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-4">

            {/* Search Input */}
            <div className="relative flex-1 min-w-[300px] group">
              <HiOutlineSearch
                className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors"
                size={20}
              />
              <input
                type="text"
                placeholder="Search operator by name..."
                className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/5 outline-none font-bold text-sm transition-all"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            {/* Status Tabs */}
            <div className="flex bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/50">
              {["All", "Pending", "Approved", "Rejected"].map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setStatusFilter(status);
                    setPage(1);
                  }}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === status
                      ? "bg-white text-orange-600 shadow-md ring-1 ring-slate-200"
                      : "text-slate-500 hover:text-slate-800"
                    }`}
                >
                  {status === "Pending" ? "Review" : status === "Approved" ? "Authorized" : status === "Rejected" ? "Declined" : status}
                </button>
              ))}
            </div>

            {/* Clear Button */}
            {(searchQuery || statusFilter !== "All") && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-6 py-3 text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-2xl transition-all font-bold text-xs cursor-pointer"
              >
                <HiOutlineXMark size={18} strokeWidth={2.5} />
                <span>RESET FILTERS</span>
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
              emptyMessage="No attendance records match your current security clearance."
            />
          </div>

          {/* PAGINATION FOOTER */}
          <div className="bg-slate-50/50 p-6 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Page Limit Selector */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100 pr-3">
                  Limit
                </span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="bg-transparent text-[9px] font-black outline-none cursor-pointer text-slate-700"
                >
                  {[5, 15, 30, 50].map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              {paginationData?.totalLeaves && (
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight ml-2">
                  Total {paginationData?.totalLeaves} results
                </span>
              )}
            </div>

            {/* Pagination Component */}
            <Pagination
              pagination={{
                current: page,
                total: paginationData.totalPages,
                count: paginationData.totalLeaves,
                limit: limit,
              }}
              onPageChange={setPage}
              loading={isFetching}
              label="Records"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
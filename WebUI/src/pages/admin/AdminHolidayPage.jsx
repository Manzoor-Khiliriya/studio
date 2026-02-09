import React, { useState, useMemo } from "react";
import {
  HiOutlinePlus,
  HiOutlineMagnifyingGlass,
  HiOutlineAdjustmentsHorizontal,
  HiOutlineXMark
} from "react-icons/hi2";
import { Toaster, toast } from "react-hot-toast";

// API
import {
  useGetHolidaysQuery,
  useAddHolidayMutation,
  useDeleteHolidayMutation,
  useUpdateHolidayMutation,
} from "../../services/holidayApi";

// Components
import PageHeader from "../../components/PageHeader";
import Table from "../../components/Table";
import Loader from "../../components/Loader";
import HolidayModal from "../../components/HolidayModal";

// Helpers
import { getAdminHolidayColumns } from "../../utils/adminHolidayHelper";

export default function AdminHolidayPage() {
  const holidayInitialState = { id: null, name: "", date: "", description: "" };

  // --- STATE ---
  const [holidayModel, setHolidayModel] = useState(holidayInitialState);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [year, setYear] = useState("");
  const [search, setSearch] = useState("");

  // --- DATA FETCHING ---
  const { data: holidays = [], isLoading, isFetching } = useGetHolidaysQuery({ year, search });
  const [addHoliday, { isLoading: isSaving }] = useAddHolidayMutation();
  const [updateHoliday] = useUpdateHolidayMutation();
  const [deleteHoliday] = useDeleteHolidayMutation();

  // --- HANDLERS ---
  const openCreateModal = () => {
    setHolidayModel(holidayInitialState);
    setIsModalOpen(true);
  };

  const startEdit = (holiday) => {
    setHolidayModel({
      id: holiday._id,
      name: holiday.name,
      date: holiday.date.split("T")[0],
      description: holiday.description || "",
    });
    setIsModalOpen(true);
  };

  // Dynamic year generation
  const dynamicYears = useMemo(() => {
    const current = new Date().getFullYear();
    return [current + 1, current, current - 1, current - 2];
  }, []);

  const handleSaveHoliday = async () => {
    if (!holidayModel.name || !holidayModel.date)
      return toast.error("Title and Date required");

    const loadingToast = toast.loading("Syncing with Registry...");
    try {
      if (holidayModel.id) {
        await updateHoliday({ id: holidayModel.id, ...holidayModel }).unwrap();
        toast.success("Holiday Protocol Updated", { id: loadingToast });
      } else {
        await addHoliday(holidayModel).unwrap();
        toast.success("New Holiday Registered", { id: loadingToast });
      }
      setIsModalOpen(false);
      setHolidayModel(holidayInitialState);
    } catch (err) {
      toast.error(err?.data?.message || "Operation failed", { id: loadingToast });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Permanent Removal: Are you sure?")) return;
    const loadingToast = toast.loading("Removing Entry...");
    try {
      await deleteHoliday(id).unwrap();
      toast.success("Entry Purged", { id: loadingToast });
    } catch {
      toast.error("Purge Failed", { id: loadingToast });
    }
  };

  const clearFilters = () => {
    setSearch("");
    setYear("");
  };

  // --- COLUMN DEFINITION ---
  const columns = useMemo(() => getAdminHolidayColumns(startEdit, handleDelete), []);

  if (isLoading) return <Loader message="Accessing Holiday Archives..." />;

  return (
    <div className="min-h-screen">
      <Toaster position="bottom-right" />

      <PageHeader
        title="Calendar Control"
        subtitle="Registry management for public observances and operational downtime."
        actionLabel="Add Holiday"
        onAction={openCreateModal}
      />

      <main className="max-w-[1700px] mx-auto px-8 -mt-10">

        {/* TACTICAL FILTER BAR */}
        <div className="bg-white/90 backdrop-blur-xl border border-slate-200 p-5 rounded-[2.5rem] shadow-xl shadow-slate-200/50 mb-8 flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-4">

            {/* Search Input */}
            <div className="relative flex-1 min-w-[350px] group">
              <HiOutlineMagnifyingGlass
                className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors"
                size={20}
              />
              <input
                type="text"
                placeholder="Search by title or description..."
                className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/5 outline-none font-bold text-sm transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Cycle/Year Selector */}
            <div className="relative group">
              <select
                value={year}
                onChange={(e) => {
                  setYear(e.target.value);
                  setPage?.(1); // Reset pagination if applicable
                }}
                className="appearance-none pl-6 pr-14 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-orange-500 outline-none font-black text-[11px] uppercase cursor-pointer transition-all text-slate-700 shadow-sm"
              >
                <option value="">Cycle: All Years</option>
                {dynamicYears.map((y) => (
                  <option key={y} value={y}>
                    {y === new Date().getFullYear() ? `${y} (Current)` : `${y} Cycle`}
                  </option>
                ))}
              </select>
              <HiOutlineAdjustmentsHorizontal
                className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                size={18}
              />
            </div>

            {/* Clear Button */}
            {(search || year) && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-6 py-3 text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-2xl transition-all font-bold text-xs cursor-pointer"
              >
                <HiOutlineXMark size={18} strokeWidth={2.5} />
                <span>RESET</span>
              </button>
            )}
          </div>
        </div>

        {/* DATA TABLE CONTAINER */}
        <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col group/table">
          <div className={`${isFetching ? "opacity-50" : "opacity-100"} transition-opacity duration-200`}>
            <Table
              columns={columns}
              data={holidays}
              onRowClick={startEdit}
              emptyMessage="No holiday archives detected for this parameter."
            />
          </div>

          {/* OPTIONAL: Small footer to match design consistency */}
          <div className="bg-slate-50/50 p-6 border-t border-slate-100 flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Total Logs: {holidays.length}
            </span>
          </div>
        </div>
      </main>

      <HolidayModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        holidayModel={holidayModel}
        setHolidayModel={setHolidayModel}
        onSubmit={handleSaveHoliday}
        isSaving={isSaving}
      />
    </div>
  );
}
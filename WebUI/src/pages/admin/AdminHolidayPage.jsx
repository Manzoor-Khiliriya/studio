import React, { useState, useMemo } from "react";
import {
  HiOutlineMagnifyingGlass,
  HiOutlineAdjustmentsHorizontal,
  HiOutlineXMark
} from "react-icons/hi2";
import { toast } from "react-hot-toast";
import {
  useGetHolidaysQuery,
  useAddHolidayMutation,
  useDeleteHolidayMutation,
  useUpdateHolidayMutation,
} from "../../services/holidayApi";
import PageHeader from "../../components/PageHeader";
import Table from "../../components/Table";
import Loader from "../../components/Loader";
import HolidayModal from "../../components/HolidayModal";
import ConfirmModal from "../../components/ConfirmModal";
import { getAdminHolidayColumns } from "../../utils/adminHolidayHelper";
import { useSocketEvents } from "../../hooks/useSocketEvents";
import { set } from "date-fns";
import CustomDropdown from "../../components/CustomDropdown";

export default function AdminHolidayPage() {
  const holidayInitialState = { id: null, name: "", date: "", description: "" };
  const currentYear = new Date().getFullYear().toString();
  const [holidayModel, setHolidayModel] = useState(holidayInitialState);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [year, setYear] = useState(currentYear);
  const [search, setSearch] = useState("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [holidayToDelete, setHolidayToDelete] = useState(null);

  const { data: holidays = [], isLoading, isFetching, refetch } = useGetHolidaysQuery({ year, search });
  const [addHoliday, { isLoading: isSaving }] = useAddHolidayMutation();
  const [updateHoliday] = useUpdateHolidayMutation();
  const [deleteHoliday, { isLoading: isDeleting }] = useDeleteHolidayMutation();

  useSocketEvents({
    onHolidayChange: refetch,
  });

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

  const openDeleteConfirm = (holiday) => {
    setHolidayToDelete(holiday);
    setIsConfirmOpen(true);
  };

  const handleExecuteDelete = async () => {
    if (!holidayToDelete) return;

    try {
      await deleteHoliday(holidayToDelete._id).unwrap();
      toast.success("Holiday deleted successfully");
      setIsConfirmOpen(false);
      setHolidayToDelete(null);
    } catch (err) {
      toast.error(err?.data?.message || "Delete Failed");
    }
  };

  const clearFilters = () => {
    setSearch("");
    setYear(currentYear);
  };

  const dynamicYears = useMemo(() => {
    const current = new Date().getFullYear();
    return [current + 1, current, current - 1, current - 2];
  }, []);

  const columns = useMemo(() => getAdminHolidayColumns(startEdit, openDeleteConfirm), []);

  const handleSaveHoliday = async () => {
    if (!holidayModel.name || !holidayModel.date)
      return toast.error("Title and Date required");

    try {
      if (holidayModel.id) {
        await updateHoliday({ id: holidayModel.id, ...holidayModel }).unwrap();
        toast.success("Holiday Updated Successfully");
      } else {
        await addHoliday(holidayModel).unwrap();
        toast.success("New Holiday Created Successfully");
      }
      setIsModalOpen(false);
      setHolidayModel(holidayInitialState);
    } catch (err) {
      toast.error(err?.data?.message || "Operation failed");
    }
  };

  const hasActiveFilters = search !== "" || year !== currentYear;

  if (isLoading) return <Loader message="Accessing Holidays..." />;

  return (
    <div className="max-w-[1750px] mx-auto min-h-screen bg-slate-100">
      <PageHeader
        title="Holiday Management"
        subtitle="Manage public and private holidays."
        actionLabel="Add Holiday"
        onAction={openCreateModal}
      />

      <main className=" mx-auto px-8 pb-20 -mt-10">
        {/* TACTICAL FILTER BAR */}
        <div className="bg-white/90 backdrop-blur-xl border border-slate-200 p-5 rounded-[2.5rem] shadow-xl shadow-slate-200/50 mb-8 flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search Input */}
            <div className="relative flex-1 w-full group">
              <HiOutlineMagnifyingGlass className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={18} />
              <input
                type="text"
                placeholder="Search by title or description..."
                className="w-full pl-12 pr-6 py-3.5 bg-white border border-slate-200 rounded-2xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/5 outline-none font-bold text-xs transition-all shadow-sm group"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Cycle/Year Selector */}
            <div className="relative group">
              <CustomDropdown
                value={year}
                onChange={setYear}
                options={dynamicYears.map((y) => y.toString())}
                className="min-w-[180px]"
                buttonClass="w-full pl-4 pr-10 py-3.5 bg-white border border-slate-200 rounded-xl font-bold text-xs shadow-sm"
              />
            </div>

            {/* Clear Button */}
            {hasActiveFilters && (
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
              emptyMessage="No holidays found."
            />
          </div>
          <div className="bg-slate-50/50 p-6 border-t border-slate-100 flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
              Total Holidays: {holidays.length}
            </span>
          </div>
        </div>
      </main>

      {/* HOLIDAY CREATE/EDIT MODAL */}
      <HolidayModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        holidayModel={holidayModel}
        setHolidayModel={setHolidayModel}
        onSubmit={handleSaveHoliday}
        isSaving={isSaving}
      />

      {/* DELETE CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleExecuteDelete}
        isLoading={isDeleting}
        title="Delete Holiday"
        message={`Are you sure you want to permanently delete "${holidayToDelete?.name}" from the registry?`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
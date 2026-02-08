import React, { useState } from "react";
import { 
  HiOutlinePlus, 
  HiOutlineMagnifyingGlass, 
  HiOutlineCalendarDays,
  HiOutlineTrash,
  HiOutlinePencilSquare,
  HiOutlineAdjustmentsHorizontal 
} from "react-icons/hi2";
import { Toaster, toast } from "react-hot-toast";

import {
  useGetHolidaysQuery,
  useAddHolidayMutation,
  useDeleteHolidayMutation,
  useUpdateHolidayMutation,
} from "../services/holidayApi";

import Table from "../components/Table";
import Loader from "../components/Loader";
import HolidayModal from "../components/HolidayModal";
import { FiEdit, FiTrash2 } from "react-icons/fi";

export default function AdminHolidayPage() {
  const holidayInitialState = { id: null, name: "", date: "", description: "" };

  const [holidayModel, setHolidayModel] = useState(holidayInitialState);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [year, setYear] = useState("");
  const [search, setSearch] = useState("");

  const { data: holidays = [], isLoading } = useGetHolidaysQuery({ year, search });

  const [addHoliday, { isLoading: isSaving }] = useAddHolidayMutation();
  const [updateHoliday] = useUpdateHolidayMutation();
  const [deleteHoliday] = useDeleteHolidayMutation();

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

  const columns = [
    {
      header: "Registry Date",
      className: "text-left",
      render: (r) => {
        const d = new Date(r.date);
        return (
          <div className="flex items-center gap-4 py-1">
            <div className="flex flex-col items-center justify-center bg-slate-900 text-white w-10 h-10 rounded-lg shadow-lg">
              <span className="text-[9px] font-black leading-none uppercase opacity-60">{d.toLocaleDateString('en-US', { month: 'short' })}</span>
              <span className="text-base font-black leading-none">{d.getDate()}</span>
            </div>
            <div>
              <p className="font-black text-slate-900 text-[11px] uppercase tracking-tight">
                {d.toLocaleDateString("en-US", { weekday: "long" })}
              </p>
              <p className="text-[9px] font-bold text-slate-400 uppercase italic">
                {d.getFullYear()}
              </p>
            </div>
          </div>
        );
      },
    },
    { 
      header: "Holiday Title", 
      render: (r) => (
        <span className="font-black text-slate-900 text-sm uppercase tracking-tight group-hover:text-orange-600 transition-colors">
          {r.name}
        </span>
      ) 
    },
    { 
      header: "Protocol Notes", 
      className: "hidden md:table-cell",
      render: (r) => (
        <span className="text-xs font-bold text-slate-400 italic max-w-xs truncate block">
          {r.description || "No specific instructions provided."}
        </span>
      ) 
    },
    {
      header: "Actions",
      className: "text-right",
      cellClassName: "text-left",
      render: (r) => (
        <div className="flex justify-end gap-3">
          <button
            onClick={(e) => { e.stopPropagation(); startEdit(r); }}
            className="text-yellow-500 hover:text-yellow-600 rounded-lg transition-all active:scale-90 cursor-pointer"
            title="Update Holiday"
          >
            <FiEdit size={18} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(r._id); }}
            className="text-red-500 hover:text-red-600 rounded-lg transition-all active:scale-90 cursor-pointer"
            title="Delete Holiday"
          >
            <FiTrash2 size={18} />
          </button>
        </div>
      ),
    },
  ];

  if (isLoading) return <Loader message="Accessing Holiday Archives..." />;

  return (
    <div className="max-w-[1600px] mx-auto pb-24 px-8 pt-12 bg-[#fafbfc]">
      <Toaster position="top-center" />

      {/* --- ADMINISTRATIVE HEADER --- */}
      <div className="flex flex-col 2xl:flex-row justify-between items-start 2xl:items-end gap-10 mb-12">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-2 h-10 bg-orange-500 rounded-full shadow-[0_0_15px_rgba(249,115,22,0.3)]" />
            <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase">
              Calendar <span className="text-slate-300">Control</span>
            </h1>
          </div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <HiOutlineCalendarDays className="text-orange-500 text-lg" />
            Registry Management & Public Observances
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-3 bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-orange-500/20 active:scale-95"
        >
          <HiOutlinePlus strokeWidth={3} size={18} />
          <span>Add Holiday</span>
        </button>
      </div>

      {/* --- TACTICAL FILTERS --- */}
      <div className="flex flex-wrap items-center gap-4 mb-8">
        <div className="relative min-w-[340px] group">
          <HiOutlineMagnifyingGlass className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-500 transition-colors" size={20} />
          <input
            type="text"
            placeholder="Search by title or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-white border-2 border-slate-100 rounded-[1.5rem] focus:border-orange-500 outline-none font-bold text-sm shadow-sm transition-all"
          />
        </div>

        <div className="relative group">
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="appearance-none pl-6 pr-14 py-4 bg-white border-2 border-slate-100 rounded-[1.5rem] focus:border-orange-500 outline-none font-black text-[11px] uppercase cursor-pointer transition-all text-slate-600"
          >
            <option value="">Cycle: All Years</option>
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y} Cycle</option>)}
          </select>
          <HiOutlineAdjustmentsHorizontal className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={18} />
        </div>

        { (search || year) && (
          <button 
            onClick={() => {setSearch(""); setYear("");}}
            className="text-[10px] font-black uppercase text-rose-500 hover:text-rose-600 tracking-widest ml-2"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* --- DATA TABLE --- */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden group/table">
        <Table
          columns={columns}
          data={holidays}
          emptyMessage="No holiday archives detected for this parameter."
          onRowClick={startEdit}
        />
      </div>

      {/* --- MODAL SYSTEM --- */}
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
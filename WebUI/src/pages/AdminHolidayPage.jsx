import React, { useState } from "react";
import { HiOutlinePlus } from "react-icons/hi";
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

export default function AdminHolidayPage() {
  const holidayInitialState = { id: null, name: "", date: "", description: "" };

  const [holidayModel, setHolidayModel] = useState(holidayInitialState);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [year, setYear] = useState("");
  const [search, setSearch] = useState("");

  const { data: holidays = [], isLoading } = useGetHolidaysQuery({
    year,
    search,
  });

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

    const loadingToast = toast.loading("Saving...");

    try {
      if (holidayModel.id) {
        await updateHoliday({ id: holidayModel.id, ...holidayModel }).unwrap();
        toast.success("Holiday updated", { id: loadingToast });
      } else {
        await addHoliday(holidayModel).unwrap();
        toast.success("Holiday added", { id: loadingToast });
      }

      setIsModalOpen(false);
      setHolidayModel(holidayInitialState);
    } catch (err) {
      toast.error(err?.data?.message || "Operation failed", {
        id: loadingToast,
      });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this holiday?")) return;

    const loadingToast = toast.loading("Deleting...");
    try {
      await deleteHoliday(id).unwrap();
      toast.success("Deleted", { id: loadingToast });
    } catch {
      toast.error("Failed", { id: loadingToast });
    }
  };

  const columns = [
    { header: "Holiday", render: (r) => <b>{r.name}</b> },
    {
      header: "Date",
      render: (r) =>
        new Date(r.date).toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
    },
    { header: "Description", render: (r) => r.description || "—" },
    {
      header: "Actions",
      render: (r) => (
        <div className="flex gap-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              startEdit(r);
            }}
            className="text-blue-500 text-xs font-bold"
          >
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(r._id);
            }}
            className="text-rose-500 text-xs font-bold"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  if (isLoading) return <Loader message="Loading Holidays..." />;

  return (
    <div className="max-w-[1400px] mx-auto p-8">
      <Toaster position="bottom-right" />

      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-black">Holiday Management</h1>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-xl font-bold"
        >
          <HiOutlinePlus size={18} />
          Add Holiday
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-wrap gap-4 mb-6 items-center">

        {/* Year Filter */}
        <select
          onChange={(e) => setYear(e.target.value)}
          className="border rounded-lg px-4 py-2"
        >
          <option value="">All Years</option>
          <option value="2024">2024</option>
          <option value="2025">2025</option>
          <option value="2026">2026</option>
        </select>

        {/* Search Filter */}
        <input
          type="text"
          placeholder="Search holiday..."
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded-lg px-4 py-2"
        />

      </div>


      {/* TABLE */}
      <div className="bg-white rounded-3xl shadow-xl p-6">
        <Table
          columns={columns}
          data={holidays}
          emptyMessage="No holidays registered"
          onRowClick={startEdit}
        />
      </div>

      {/* MODAL */}
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

import React from "react";

export default function HolidayModal({
  isOpen,
  onClose,
  holidayModel,
  setHolidayModel,
  onSubmit,
  isSaving,
}) {
  if (!isOpen) return null;

  const isEditing = !!holidayModel.id;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl relative">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black">
            {isEditing ? "Edit Holiday" : "Add Holiday"}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-black text-xl font-bold"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className="space-y-5"
        >
          <input
            type="text"
            placeholder="Holiday Name"
            value={holidayModel.name}
            onChange={(e) =>
              setHolidayModel({ ...holidayModel, name: e.target.value })
            }
            className="w-full border p-4 rounded-xl"
          />

          <input
            type="date"
            value={holidayModel.date}
            onChange={(e) =>
              setHolidayModel({ ...holidayModel, date: e.target.value })
            }
            className="w-full border p-4 rounded-xl"
          />

          <textarea
            placeholder="Description"
            value={holidayModel.description}
            onChange={(e) =>
              setHolidayModel({
                ...holidayModel,
                description: e.target.value,
              })
            }
            className="w-full border p-4 rounded-xl"
          />

          <button
            type="submit"
            disabled={isSaving}
            className="w-full bg-orange-500 text-white py-4 rounded-xl font-bold"
          >
            {isEditing ? "UPDATE HOLIDAY" : "ADD HOLIDAY"}
          </button>
        </form>
      </div>
    </div>
  );
}

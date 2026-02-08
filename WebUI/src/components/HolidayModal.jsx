import React from "react";
import { 
  HiOutlineSparkles, 
  HiOutlineCalendar, 
  HiOutlineInformationCircle 
} from "react-icons/hi2";
import { CgSpinner } from "react-icons/cg";
import CommonModal, { InputGroup } from "./CommonModal";

export default function HolidayModal({
  isOpen,
  onClose,
  holidayModel,
  setHolidayModel,
  onSubmit,
  isSaving,
}) {
  const isEditing = !!holidayModel.id;

  const handleLocalSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <CommonModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Modify Holiday" : "Register Holiday"}
      subtitle="Calendar Exclusion Protocol"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleLocalSubmit} className="space-y-6">
        {/* HOLIDAY NAME */}
        <InputGroup label="Event Designation">
          <HiOutlineSparkles className="input-icon" />
          <input
            required
            type="text"
            placeholder="e.g. Independence Day"
            value={holidayModel.name}
            onChange={(e) =>
              setHolidayModel({ ...holidayModel, name: e.target.value })
            }
            className="form-input"
          />
        </InputGroup>

        {/* DATE SELECT */}
        <InputGroup label="Effective Date">
          <HiOutlineCalendar className="input-icon" />
          <input
            required
            type="date"
            value={holidayModel.date}
            onChange={(e) =>
              setHolidayModel({ ...holidayModel, date: e.target.value })
            }
            className="form-input tabular-nums"
          />
        </InputGroup>

        {/* DESCRIPTION */}
        <InputGroup label="Event Context">
          <HiOutlineInformationCircle className="input-icon !top-5 translate-y-0" />
          <textarea
            placeholder="Optional context for this calendar event..."
            value={holidayModel.description}
            onChange={(e) =>
              setHolidayModel({
                ...holidayModel,
                description: e.target.value,
              })
            }
            rows={3}
            className="form-input !py-3 min-h-[100px] resize-none leading-relaxed"
          />
        </InputGroup>

        {/* ACTION BUTTON */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full bg-slate-900 hover:bg-orange-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-70"
          >
            {isSaving ? (
              <CgSpinner className="animate-spin" size={20} />
            ) : (
              isEditing ? "Update Entry" : "Commit to Calendar"
            )}
          </button>
        </div>
      </form>

      {/* Global Form Styles (if not already in your index.css) */}
      <style jsx global>{`
        .form-input { 
          width: 100%; 
          padding: 0.85rem 1rem 0.85rem 2.75rem; 
          background-color: #f8fafc; 
          border: 2px solid transparent; 
          border-radius: 1.25rem; 
          font-size: 0.875rem; 
          font-weight: 700; 
          color: #1e293b; 
          transition: all 0.2s; 
          outline: none; 
        }
        .form-input:focus { 
          background-color: #fff; 
          border-color: #f97316; 
          box-shadow: 0 10px 15px -3px rgba(249, 115, 22, 0.1); 
        }
        .input-icon { 
          position: absolute; 
          left: 1rem; 
          top: 50%; 
          transform: translateY(-50%); 
          color: #cbd5e1; 
          z-index: 10; 
          transition: color 0.2s; 
        }
        .group:focus-within .input-icon { 
          color: #f97316; 
        }
      `}</style>
    </CommonModal>
  );
}
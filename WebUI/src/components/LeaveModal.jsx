import React, { useState, useEffect } from "react";
import { 
  HiOutlineShieldCheck, 
  HiOutlineDocumentText, 
  HiOutlineCalendarDays,
  HiOutlineChatBubbleLeftRight
} from "react-icons/hi2";
import CommonModal, { InputGroup } from "./CommonModal";

const LeaveModal = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    type: "Sick Leave",
    startDate: "",
    endDate: "",
    reason: "",
  });

  const today = new Date().toISOString().split("T")[0];

  // Sync state for editing
  useEffect(() => {
    if (initialData && isOpen) {
      setFormData({
        type: initialData.type || "Sick Leave",
        startDate: initialData.startDate ? new Date(initialData.startDate).toISOString().split("T")[0] : "",
        endDate: initialData.endDate ? new Date(initialData.endDate).toISOString().split("T")[0] : "",
        reason: initialData.reason || "",
      });
    } else if (isOpen) {
      setFormData({ type: "Sick Leave", startDate: "", endDate: "", reason: "" });
    }
  }, [initialData, isOpen]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLocalSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <CommonModal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Request" : "New Application"}
      subtitle={initialData ? `Modifying Entry ID: ${initialData._id.slice(-6)}` : "Personnel Absence Protocol"}
    >
      <form onSubmit={handleLocalSubmit} className="space-y-8">
        {/* REQUEST CATEGORY */}
        <InputGroup label="Request Category">
          <HiOutlineDocumentText className="input-icon" />
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            required
            className="form-input appearance-none cursor-pointer"
          >
            <option>Annual Leave</option>
            <option>Sick Leave</option>
            <option>Personal Leave</option>
            <option>Maternity Leave</option>
            <option>Paternity Leave</option>
            <option>Unpaid Leave</option>
          </select>
        </InputGroup>

        {/* DATE RANGE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputGroup label="Commencement">
            <HiOutlineCalendarDays className="input-icon" />
            <input
              type="date"
              name="startDate"
              min={today}
              value={formData.startDate}
              onChange={handleChange}
              required
              className="form-input tabular-nums"
            />
          </InputGroup>

          <InputGroup label="Termination">
            <HiOutlineCalendarDays className="input-icon" />
            <input
              type="date"
              name="endDate"
              min={formData.startDate || today}
              value={formData.endDate}
              onChange={handleChange}
              required
              className="form-input tabular-nums"
            />
          </InputGroup>
        </div>

        {/* REASONING */}
        <InputGroup label="Operational Justification">
          <HiOutlineChatBubbleLeftRight className="input-icon !top-5 translate-y-0" />
          <textarea
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            rows="4"
            required
            className="form-input !py-4 min-h-[120px] resize-none leading-relaxed"
            placeholder="State the reason for this absence..."
          />
        </InputGroup>

        {/* ACTION BUTTON */}
        <div className="pt-4">
          <button
            type="submit"
            className="w-full bg-slate-900 text-white py-5 rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-orange-600 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
          >
            <HiOutlineShieldCheck size={20} />
            {initialData ? "Update Registry" : "Authorize Request"}
          </button>
          
          <p className="text-center text-[8px] text-slate-400 font-black uppercase tracking-widest mt-6 italic">
            * All requests are subject to Command review
          </p>
        </div>
      </form>

      {/* Re-using your global styles */}
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
        .form-input:focus { background-color: #fff; border-color: #f97316; box-shadow: 0 10px 15px -3px rgba(249, 115, 22, 0.1); }
        .input-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #cbd5e1; z-index: 10; transition: color 0.2s; }
        .group:focus-within .input-icon { color: #f97316; }
      `}</style>
    </CommonModal>
  );
};

export default LeaveModal;
import React, { useState, useEffect } from "react";
import { HiOutlineShieldCheck, HiOutlineDocumentText, HiOutlineCalendarDays, HiOutlineChatBubbleLeftRight } from "react-icons/hi2";
import { toast } from 'react-hot-toast';
import CommonModal, { InputGroup } from "./CommonModal";

// Import mutations directly into the modal
import { useApplyLeaveMutation, useUpdateLeaveMutation } from '../services/leaveApi';

const LeaveModal = ({ isOpen, onClose, initialData }) => {
  const [formData, setFormData] = useState({
    type: "Sick Leave",
    startDate: "",
    endDate: "",
    reason: "",
  });

  const [applyLeave, { isLoading: isApplying }] = useApplyLeaveMutation();
  const [updateLeave, { isLoading: isUpdating }] = useUpdateLeaveMutation();

  const today = new Date().toISOString().split("T")[0];

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading(initialData ? "Updating registry..." : "Filing application...");
    
    try {
      if (initialData) {
        await updateLeave({ id: initialData._id, ...formData }).unwrap();
        toast.success("Registry entry updated", { id: loadingToast });
      } else {
        await applyLeave(formData).unwrap();
        toast.success("Application successfully filed", { id: loadingToast });
      }
      onClose(); // Close modal on success
    } catch (err) {
      toast.error(err?.data?.message || "Transmission error", { id: loadingToast });
    }
  };

  return (
    <CommonModal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Request" : "New Application"}
      subtitle={initialData ? `Modifying Entry ID: ${initialData._id.slice(-6)}` : "Personnel Absence Protocol"}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
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

        <InputGroup label="Operational Justification">
          <HiOutlineChatBubbleLeftRight className="input-icon !top-5 translate-y-0" />
          <textarea
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            rows="4"
            required
            className="form-input !py-4 min-h-[120px] resize-none"
            placeholder="State the reason for this absence..."
          />
        </InputGroup>

        <div className="pt-4">
          <button
            type="submit"
            disabled={isApplying || isUpdating}
            className="w-full bg-slate-900 text-white py-5 rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-orange-600 transition-all disabled:opacity-50 flex items-center justify-center gap-3 cursor-pointer"
          >
            <HiOutlineShieldCheck size={20} />
            {initialData ? "Update Registry" : "Authorize Request"}
          </button>
        </div>
      </form>
    </CommonModal>
  );
};

export default LeaveModal;
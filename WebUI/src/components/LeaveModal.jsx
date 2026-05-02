import React, { useState, useEffect } from "react";
import { HiOutlineShieldCheck, HiOutlineDocumentText, HiOutlineCalendarDays, HiOutlineChatBubbleLeftRight } from "react-icons/hi2";
import { toast } from 'react-hot-toast';
import CommonModal, { InputGroup } from "./CommonModal";

// Import mutations directly into the modal
import { useApplyLeaveMutation, useUpdateLeaveMutation } from '../services/leaveApi';
import CustomDropdown from "./CustomDropdown";

const LeaveModal = ({ isOpen, onClose, initialData }) => {
  const [formData, setFormData] = useState({
    type: "Sick Leave",
    startDate: "",
    endDate: "",
    reason: "",
  });

  const [applyLeave, { isLoading: isApplying }] = useApplyLeaveMutation();
  const [updateLeave, { isLoading: isUpdating }] = useUpdateLeaveMutation();

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

  const handleSubmit = async () => {
    if (!formData.reason) {
      toast.error("Leave reason is required");
      return;
    }

    const loadingToast = toast.loading(initialData ? "Updating registry..." : "Filing application...");

    try {
      if (initialData) {
        await updateLeave({ id: initialData._id, ...formData }).unwrap();
        toast.success("Leave request updated", { id: loadingToast });
      } else {
        await applyLeave(formData).unwrap();
        toast.success("Application successfully filed", { id: loadingToast });
      }
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || "Transmission error", { id: loadingToast });
    }
  };

  return (
    <CommonModal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Update Request" : "Create New Request"}
      maxWidth="max-w-md"
      onSubmit={handleSubmit}
      isLoading={isApplying || isUpdating}
      submitText={initialData ? "Update" : "Create"}
    >
      <form
        onSubmit={(e) => e.preventDefault()}
        className="space-y-4"
      >
        <InputGroup label="Request Category *">
          <HiOutlineDocumentText className="input-icon" />
          <CustomDropdown
            value={formData.type}
            onChange={(val) =>
              setFormData({ ...formData, type: val })
            }
            options={[
              "Annual Leave",
              "Sick Leave",
              "Casual Leave",
              "Maternity Leave",
              "Bereavement Leave",
              "Paternity Leave",
              "LOP"
            ]}
            className="w-full"
            buttonClass="form-input text-xs font-bold pl-10"
          />
        </InputGroup>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputGroup label="Start Date *">
            <HiOutlineCalendarDays className="input-icon" />
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              required
              className="form-input tabular-nums"
            />
          </InputGroup>

          <InputGroup label="End Date *">
            <HiOutlineCalendarDays className="input-icon" />
            <input
              type="date"
              name="endDate"
              min={formData.startDate}
              value={formData.endDate}
              onChange={handleChange}
              required
              className="form-input tabular-nums"
            />
          </InputGroup>
        </div>

        <InputGroup label="Leave Reason *">
          <HiOutlineChatBubbleLeftRight className="input-icon !top-6.5 translate-y-0" />
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
      </form>
    </CommonModal>
  );
};

export default LeaveModal;
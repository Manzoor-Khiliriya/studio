import React, { useState, useEffect } from "react";
import CommonModal, { InputGroup } from "./CommonModal";
import { HiOutlineSquares2X2, HiOutlineArrowPath } from "react-icons/hi2";
// UPDATED: Using the specific status update mutation
import { useUpdateTaskStatusMutation } from "../services/taskApi";
import { toast } from "react-hot-toast";

export default function StatusUpdateModal({ isOpen, onClose, task }) {
  // Use the new status-specific mutation
  const [updateStatus, { isLoading }] = useUpdateTaskStatusMutation();
  const [status, setStatus] = useState("");
  const [activeStatus, setActiveStatus] = useState("");

  useEffect(() => {
    if (task) {
      setStatus(task.status);
      setActiveStatus(task.activeStatus || "Draft-1");
    }
  }, [task]);

  const handleUpdate = async () => {
    try {
      await updateStatus({
        id: task._id,
        status,
        activeStatus
      }).unwrap();

      toast.success("Task status updated!");
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to update status");
    }
  };

  return (
    <CommonModal
      isOpen={isOpen}
      onClose={onClose}
      title="Task Progress"
      maxWidth="max-w-md"
      onSubmit={handleUpdate}
      isLoading={isLoading}
      submitText="Update"
      cancelText="Cancel"
    >
      <div className="space-y-4">
        <InputGroup label="Active Version">
          <HiOutlineSquares2X2 className="input-icon" />
          <select
            className="form-input font-black uppercase text-xs"
            value={activeStatus}
            onChange={(e) => setActiveStatus(e.target.value)}
          >
            {["Draft-1", "Draft-2", "Draft-3", "Draft-4", "Draft-5", "Pre-Final", "Final"].map(v => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </InputGroup>

        <InputGroup label="Operational Status">
          <HiOutlineArrowPath className="input-icon" />
          <select
            className="form-input font-bold text-xs"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {[
              "On hold",
              "Modeling",
              "Lighting and Texturing",
              "Feedback pending",
              "Final rendering",
              "Postproduction",
              "Completed",
            ].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </InputGroup>
      </div>
    </CommonModal>
  );
}
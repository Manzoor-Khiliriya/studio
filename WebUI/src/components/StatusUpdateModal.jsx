import React, { useState, useEffect } from "react";
import CommonModal, { InputGroup } from "./CommonModal";
import { HiOutlineSquares2X2, HiOutlineArrowPath } from "react-icons/hi2";
// UPDATED: Using the specific status update mutation
import { useUpdateTaskStatusMutation } from "../services/taskApi";
import { toast } from "react-hot-toast";
import CustomDropdown from "./CustomDropdown";

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
          <CustomDropdown
            value={activeStatus}
            onChange={(val) => setActiveStatus(val)}
            options={[
              "Draft-1",
              "Draft-2",
              "Draft-3",
              "Draft-4",
              "Draft-5",
              "Pre-Final",
              "Final"
            ]}
            className="w-full"
            buttonClass="form-input text-xs font-bold pl-10"
          />
        </InputGroup>

        <InputGroup label="Operational Status">
          <HiOutlineArrowPath className="input-icon" />
          <CustomDropdown
            value={status}
            onChange={(val) => setStatus(val)}
            options={[
              "On hold",
              "Modeling",
              "Lighting and Texturing",
              "Feedback pending",
              "Final rendering",
              "Postproduction",
              "Completed"
            ]}
            className="w-full"
            buttonClass="form-input text-xs font-bold pl-10"
          />
        </InputGroup>
      </div>
    </CommonModal>
  );
}
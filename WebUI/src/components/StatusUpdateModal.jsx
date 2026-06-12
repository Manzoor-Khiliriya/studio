import React, { useState, useEffect } from "react";
import CommonModal, { InputGroup } from "./CommonModal";
import { HiOutlineSquares2X2, HiOutlineArrowPath } from "react-icons/hi2";
// UPDATED: Using the specific status update mutation
import { useGetTaskStatusesQuery, useUpdateTaskStatusMutation } from "../services/taskApi";
import { toast } from "react-hot-toast";
import CustomDropdown from "./CustomDropdown";

export default function StatusUpdateModal({ isOpen, onClose, task }) {
  // Use the new status-specific mutation
  const [status, setStatus] = useState("");
  const [activeStatus, setActiveStatus] = useState("");

  const { data: statuses = [] } =
    useGetTaskStatusesQuery("status", {
      skip: !isOpen,
      refetchOnMountOrArgChange:
        true,
    });

  const { data: activeStatuses = [] } =
    useGetTaskStatusesQuery("activeStatus", {
      skip: !isOpen,
      refetchOnMountOrArgChange:
        true,
    });

  const [updateStatus, { isLoading }] = useUpdateTaskStatusMutation();


  useEffect(() => {
    if (task) {
      setStatus(task?.status?._id || "");
      setActiveStatus(task?.activeStatus?._id || "");
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
      <div className="space-y-5">
        <InputGroup label="Initiative Status">
          <HiOutlineArrowPath className="input-icon" />
          <CustomDropdown
            value={status}
            onChange={setStatus}
            options={statuses
              .filter(item => item.status === "Enable")
              .map(item => ({
                label: item.name,
                value: item._id,
              }))}
            className="w-full"
            placeholder="Select Initiative Status"
            buttonClass="form-input text-xs font-bold pl-10"
          />
        </InputGroup>

        <InputGroup label="Active Status">
          <HiOutlineSquares2X2 className="input-icon" />
          <CustomDropdown
            value={activeStatus}
            onChange={setActiveStatus}
            options={activeStatuses
              .filter(item => item.status === "Enable")
              .map(item => ({
                label: item.name,
                value: item._id,
              }))}
            className="w-full"
            buttonClass="form-input text-xs font-bold pl-10"
            placeholder="Select Active Status"
          />
        </InputGroup>
      </div>
    </CommonModal>
  );
}
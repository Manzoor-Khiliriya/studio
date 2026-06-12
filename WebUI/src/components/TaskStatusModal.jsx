import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import CommonModal, { InputGroup } from "./CommonModal";
import { HiOutlineSquares2X2 } from "react-icons/hi2";
import CustomDropdown from "./CustomDropdown";
import {
  useCreateTaskStatusMutation,
useUpdateTaskStatusMasterMutation} from "../services/taskApi";

export default function TaskStatusModal({
  isOpen,
  onClose,
  editData = null,
  type = "status", // status | activeStatus
}) {
  const isEditing = !!editData;

  const [formData, setFormData] = useState({
    name: "",
    status: "Enable",
  });

  const [createTaskStatus, { isLoading: isCreating }] =
    useCreateTaskStatusMutation();

  const [updateTaskStatusMaster, { isLoading: isUpdating }] =
    useUpdateTaskStatusMasterMutation();

  useEffect(() => {
    if (editData) {
      setFormData({
        name: editData.name || "",
        status: editData.status || "Enable",
      });
    } else {
      setFormData({
        name: "",
        status: "Enable",
      });
    }
  }, [editData, isOpen]);

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      return toast.error("Status name required");
    }

    const loadingToast = toast.loading(
      isEditing
        ? "Updating status..."
        : "Creating status..."
    );

    try {
      const payload = {
        ...formData,
        type,
      };

      if (isEditing) {
        await updateTaskStatusMaster({
          id: editData._id,
          ...payload,
        }).unwrap();
      } else {
        await createTaskStatus(payload).unwrap();
      }

      toast.success(
        isEditing
          ? "Status updated successfully"
          : "Status created successfully",
        { id: loadingToast }
      );

      onClose();
    } catch (err) {
      toast.error(
        err?.data?.message || "Operation failed",
        { id: loadingToast }
      );
    }
  };

  return (
    <CommonModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isEditing
          ? `Update ${
              type === "status"
                ? "Initiative Status"
                : "Active Status"
            }`
          : `Create ${
              type === "status"
                ? "Initiative Status"
                : "Active Status"
            }`
      }
      submitText={isEditing ? "Update" : "Create"}
      onSubmit={handleSubmit}
      isLoading={isCreating || isUpdating}
      maxWidth="max-w-lg"
    >
      <div className="space-y-4">
        <InputGroup label="Status Name *">
          <HiOutlineSquares2X2 className="input-icon" />
          <input
            value={formData.name}
            onChange={(e) =>
              setFormData({
                ...formData,
                name: e.target.value,
              })
            }
            className="form-input"
            placeholder="Enter status name"
          />
        </InputGroup>

        <InputGroup label="Status *">
          <HiOutlineSquares2X2 className="input-icon" />

          <CustomDropdown
            value={formData.status}
            onChange={(val) =>
              setFormData({
                ...formData,
                status: val,
              })
            }
            options={[
              {
                label: "Enable",
                value: "Enable",
              },
              {
                label: "Disable",
                value: "Disable",
              },
            ]}
            className="w-full"
            buttonClass="form-input text-xs font-bold pl-10"
          />
        </InputGroup>
      </div>
    </CommonModal>
  );
}
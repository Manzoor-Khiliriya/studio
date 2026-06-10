import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import CommonModal, { InputGroup } from "./CommonModal";
import {
    useCreateDepartmentMutation,
    useUpdateDepartmentMutation,
} from "../services/settingsApi";
import { HiOutlineBriefcase } from "react-icons/hi2";
import CustomDropdown from "./CustomDropdown";

export default function DepartmentModal({
    isOpen,
    onClose,
    editData = null,
}) {
    const isEditing = !!editData;

    const [formData, setFormData] = useState({
        name: "",
        status: "Enable",
    });

    const [createDepartment, { isLoading: isCreating }] =
        useCreateDepartmentMutation();

    const [updateDepartment, { isLoading: isUpdating }] =
        useUpdateDepartmentMutation();

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
        const loadingToast = toast.loading(
            isEditing
                ? "Updating department..."
                : "Creating department..."
        );

        try {
            if (isEditing) {
                await updateDepartment({
                    id: editData._id,
                    ...formData,
                }).unwrap();
            } else {
                await createDepartment(formData).unwrap();
            }

            toast.success(
                isEditing
                    ? "Department updated"
                    : "Department created",
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
                    ? "Update Department"
                    : "Create Department"
            }
            submitText={
                isEditing ? "Update" : "Create"
            }
            onSubmit={handleSubmit}
            isLoading={isCreating || isUpdating}
            maxWidth="max-w-lg"
        >
            <div className="space-y-4">
                <InputGroup label="Department Name *">
                    <HiOutlineBriefcase className="input-icon" />
                    <input
                        value={formData.name}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                name: e.target.value,
                            })
                        }
                        className="form-input"
                        placeholder="Enter department name"
                    />
                </InputGroup>

                <InputGroup label="Status *">
                    <HiOutlineBriefcase className="input-icon" />

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
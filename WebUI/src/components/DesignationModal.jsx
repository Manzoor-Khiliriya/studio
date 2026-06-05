import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import CommonModal, { InputGroup } from "./CommonModal";
import {
    useCreateDesignationMutation,
    useUpdateDesignationMutation,
} from "../services/settingsApi";
import { HiOutlineBriefcase } from "react-icons/hi2";
import CustomDropdown from "./CustomDropdown";

export default function DesignationModal({
    isOpen,
    onClose,
    editData = null,
}) {
    const isEditing = !!editData;

    const [formData, setFormData] = useState({
        name: "",
        status: "Enable",
    });

    const [createDesignation, { isLoading: isCreating }] =
        useCreateDesignationMutation();

    const [updateDesignation, { isLoading: isUpdating }] =
        useUpdateDesignationMutation();

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
                ? "Updating designation..."
                : "Creating designation..."
        );

        try {
            if (isEditing) {
                await updateDesignation({
                    id: editData._id,
                    ...formData,
                }).unwrap();
            } else {
                await createDesignation(formData).unwrap();
            }

            toast.success(
                isEditing
                    ? "Designation updated"
                    : "Designation created",
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
                    ? "Update Designation"
                    : "Create Designation"
            }
            submitText={
                isEditing ? "Update" : "Create"
            }
            onSubmit={handleSubmit}
            isLoading={isCreating || isUpdating}
            maxWidth="max-w-lg"
        >
            <div className="space-y-4">
                <InputGroup label="Designation Name *">
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
                        placeholder="Enter designation name"
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
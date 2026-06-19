import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
    HiOutlineDocumentText,
    HiOutlineCalendarDays,
    HiOutlineCurrencyRupee,
    HiOutlineChatBubbleLeftRight,
} from "react-icons/hi2";

import CommonModal, { InputGroup } from "./CommonModal";
import CustomDropdown from "./CustomDropdown";
import { useUpdateProjectPaymentMutation } from "../services/projectApi";

export default function ProjectPaymentModal({
    isOpen,
    onClose,
    project,
}) {
    const [updateProjectPayment, { isLoading }] =
        useUpdateProjectPaymentMutation();

    const [formData, setFormData] = useState({
        invoiceNumber: "",
        invoiceDate: "",
        paymentStatus: "Due",
        paymentRemark: "",
        paymentDate: "",
    });

    useEffect(() => {
        if (project && isOpen) {
            setFormData({
                invoiceNumber: project.invoiceNumber || "",
                invoiceDate: project.invoiceDate
                    ? new Date(project.invoiceDate).toISOString().split("T")[0]
                    : "",
                paymentStatus: project.paymentStatus || "Due",
                paymentRemark: project.paymentRemark || "",
                paymentDate: project.paymentDate
                    ? new Date(project.paymentDate).toISOString().split("T")[0]
                    : "",
            });
        } else {
            setFormData({
                invoiceNumber: "",
                invoiceDate: "",
                paymentStatus: "Due",
                paymentRemark: "",
                paymentDate: "",
            });
        }
    }, [project, isOpen]);

    const handleSubmit = async () => {
        const loadingToast = toast.loading(
            "Updating Project Information..."
        );

        try {
            await updateProjectPayment({
                id: project._id,
                ...formData,
            }).unwrap();

            toast.success(
                "Project Information Updated Successfully",
                {
                    id: loadingToast,
                }
            );

            onClose();
        } catch (err) {
            toast.error(
                err?.data?.message || "Failed to update project details",
                {
                    id: loadingToast,
                }
            );
        }
    };

    return (
        <CommonModal
            isOpen={isOpen}
            onClose={onClose}
            title={`Update Invoice & Payment Details`}
            maxWidth="max-w-xl"
            onSubmit={handleSubmit}
            isLoading={isLoading}
            submitText="Update"
        >
            <form
                onSubmit={(e) => e.preventDefault()}
                className="space-y-5"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    <InputGroup label="Invoice Number">
                        <HiOutlineDocumentText className="input-icon" />
                        <input
                            className="form-input text-xs font-bold"
                            placeholder="Enter Invoice Number"
                            value={formData.invoiceNumber}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    invoiceNumber: e.target.value,
                                })
                            }
                        />
                    </InputGroup>

                    <InputGroup label="Invoice Date">
                        <HiOutlineCalendarDays className="input-icon" />
                        <input
                            type="date"
                            className="form-input text-[11px] font-bold"
                            value={formData.invoiceDate}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    invoiceDate: e.target.value,
                                })
                            }
                        />
                    </InputGroup>

                    <InputGroup label="Payment Status">
                        <HiOutlineCurrencyRupee className="input-icon" />

                        <CustomDropdown
                            value={formData.paymentStatus}
                            onChange={(val) =>
                                setFormData({
                                    ...formData,
                                    paymentStatus: val,
                                    paymentDate:
                                        val === "Due"
                                            ? ""
                                            : formData.paymentDate,
                                })
                            }
                            options={[
                                {
                                    label: "Due",
                                    value: "Due",
                                },
                                {
                                    label: "Advance",
                                    value: "Advance",
                                },
                                {
                                    label: "Paid",
                                    value: "Paid",
                                },
                            ]}
                            className="w-full"
                            buttonClass="form-input text-xs font-bold pl-10"
                        />
                    </InputGroup>

                    <InputGroup label="Payment Date">
                        <HiOutlineCalendarDays className="input-icon" />
                        <input
                            type="date"
                            className="form-input text-[11px] font-bold"
                            value={formData.paymentDate}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    paymentDate: e.target.value,
                                })
                            }
                        />
                    </InputGroup>
                </div>

                <InputGroup label="Payment Remark">
                    <HiOutlineChatBubbleLeftRight className="input-icon top-4" />

                    <textarea
                        rows={4}
                        className="form-input min-h-[120px] pt-3 text-xs font-bold resize-none"
                        placeholder="Enter payment remarks..."
                        value={formData.paymentRemark}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                paymentRemark: e.target.value,
                            })
                        }
                    />
                </InputGroup>
            </form>
        </CommonModal>
    );
}
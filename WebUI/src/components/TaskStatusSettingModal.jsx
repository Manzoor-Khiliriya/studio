import React, { useState } from "react";
import {
    HiOutlineCog6Tooth,
    HiOutlinePlusCircle,
} from "react-icons/hi2";
import {
    useGetTaskStatusesQuery, useDeleteTaskStatusMasterMutation
} from "../services/taskApi";

import CommonModal from "./CommonModal";
import TaskStatusModal from "./TaskStatusModal";
import ConfirmModal from "./ConfirmModal";
import GroupedTaskTable from "./GroupTable";
import { getTaskStatusColumns } from "../utils/adminTaskStatusHelper";
import toast from "react-hot-toast";
import Table from "./Table";

export default function TaskStatusSettingsModal({
    isOpen,
    onClose,
}) {
    const [activeTab, setActiveTab] =
        useState("status");

    const [editingStatus, setEditingStatus] =
        useState(null);

    const [showStatusModal, setShowStatusModal] =
        useState(false);

    const [deleteItem, setDeleteItem] =
        useState(null);

    const {
        data: statuses = [],
        isLoading,
    } = useGetTaskStatusesQuery(activeTab, {
        skip: !isOpen,
    });

    const [
        deleteTaskStatusMaster,
        { isLoading: isDeleting },
    ] = useDeleteTaskStatusMasterMutation();

    const handleDelete = async () => {
        try {
            await deleteTaskStatusMaster(
                deleteItem._id
            ).unwrap();

            toast.success(
                "Status deleted successfully"
            );

            setDeleteItem(null);
        } catch (err) {
            toast.error(
                err?.data?.message ||
                "Delete failed"
            );
        }
    };

    const columns =
        getTaskStatusColumns({
            onEdit: (row) => {
                setEditingStatus(row);
                setShowStatusModal(true);
            },
            onDelete: setDeleteItem,
        });

    return (
        <>
            <CommonModal
                isOpen={isOpen}
                onClose={onClose}
                title="Task Status Settings"
                maxWidth="max-w-5xl"
                hideFooter
            >
                <div className="space-y-5">

                    <div className="flex items-center justify-between">
                        <div className="flex bg-slate-100 rounded-2xl p-1">
                            <button
                                onClick={() =>
                                    setActiveTab("status")
                                }
                                className={`px-5 py-2 rounded-xl text-xs font-black uppercase transition-all cursor-pointer ${activeTab === "status"
                                    ? "bg-white shadow text-orange-600"
                                    : "text-slate-500"
                                    }`}
                            >
                                Initiative Status
                            </button>

                            <button
                                onClick={() =>
                                    setActiveTab(
                                        "activeStatus"
                                    )
                                }
                                className={`px-5 py-2 rounded-xl text-xs font-black uppercase transition-all cursor-pointer ${activeTab ===
                                    "activeStatus"
                                    ? "bg-white shadow text-orange-600"
                                    : "text-slate-500"
                                    }`}
                            >
                                Active Status
                            </button>
                        </div>

                        <button
                            onClick={() => {
                                setEditingStatus(null);
                                setShowStatusModal(true);
                            }}
                            className="flex items-center gap-2 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
                        >
                            <HiOutlinePlusCircle
                                size={18}
                            />
                            Add Status
                        </button>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">

                        <Table
                            columns={columns}
                            data={statuses}
                            emptyMessage="No Status found."
                        />
                    </div>
                </div>
            </CommonModal>

            <TaskStatusModal
                isOpen={showStatusModal}
                onClose={() => {
                    setShowStatusModal(false);
                    setEditingStatus(null);
                }}
                editData={editingStatus}
                type={activeTab}
            />

            <ConfirmModal
                isOpen={!!deleteItem}
                onClose={() =>
                    setDeleteItem(null)
                }
                onConfirm={handleDelete}
                isLoading={isDeleting}
                title="Delete Status"
                message={`Delete "${deleteItem?.name}" ?`}
                variant="danger"
            />
        </>
    );
}
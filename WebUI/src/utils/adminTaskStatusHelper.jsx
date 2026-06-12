import { FiEdit, FiTrash2 } from "react-icons/fi";

export const getTaskStatusColumns = ({
    onEdit,
    onDelete,
}) => [
        {
            header: "Status Name",
            render: (item) => (
                <div className="font-bold text-[12px] text-slate-700">
                    {item.name}
                </div>
            ),
        },
        {
            header: "Status",
            render: (item) => (
                <span
                    className={`text-[9px] font-black uppercase tracking-wide ${item.status === "Enable"
                        ? "text-emerald-700"
                        : "text-rose-700"
                        }`}
                >
                    {item.status === "Enable"
                        ? "Active"
                        : "Inactive"}
                </span>
            ),
        },
        {
            header: "Actions",
            render: (item) => (
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onEdit(item)}
                        className="text-yellow-500 hover:text-yellow-600 cursor-pointer"
                        title="Update"
                    >
                        <FiEdit size={18} />
                    </button>

                    <button
                        onClick={() => onDelete(item)}
                        className="text-rose-500 hover:text-rose-600 cursor-pointer"
                        title="Delete"
                    >
                        <FiTrash2 size={18} />
                    </button>
                </div>
            ),
        },
    ];
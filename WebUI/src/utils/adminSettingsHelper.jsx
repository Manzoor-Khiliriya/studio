import { FiEdit, FiTrash2 } from "react-icons/fi";

export const getDepartmentColumns = ({
    onEdit,
    onDelete,
}) => [
        {
            header: "Department Name",
            render: (dept) => (
                <div className="font-bold text-[12px] text-slate-700">
                    {dept.name}
                </div>
            ),
        },
        {
            header: "Status",
            render: (dept) => (
                <span
                    className={`text-[9px] font-black uppercase tracking-wide ${dept.status === "Enable"
                            ? "text-emerald-700"
                            : "text-rose-700"
                        }`}
                >
                    {dept.status === "Enable" ? "Active" : "Inactive"}
                </span>

            ),
        },
        {
            header: "Actions",
            render: (dept) => (
                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(dept);
                        }}
                        className="text-yellow-500 hover:text-yellow-600 cursor-pointer"
                        title="Update Department"
                    >
                        <FiEdit size={18} />
                    </button>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(dept);
                        }}
                        className="text-rose-500 hover:text-rose-600 cursor-pointer"
                        title="Delete Department"
                    >
                        <FiTrash2 size={18} />
                    </button>
                </div>
            ),
        },
    ];

export const getDesignationColumns = ({
    onEdit,
    onDelete,
}) => [
        {
            header: "Designation Name",
            render: (designation) => (
                <div className="font-bold text-[12px] text-slate-700">
                    {designation.name}
                </div>
            ),
        },
        {
            header: "Status",
            render: (designation) => (
                <span
                    className={`text-[9px] font-black uppercase tracking-wide ${designation.status === "Enable"
                            ? "text-emerald-700"
                            : "text-rose-700"
                        }`}
                >
                    {designation.status === "Enable" ? "Active" : "Inactive"}
                </span>
            ),
        },
        {
            header: "Actions",
            render: (designation) => (
                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(designation);
                        }}
                        className="text-yellow-500 hover:text-yellow-600 cursor-pointer"
                        title="Update Designation"
                    >
                        <FiEdit size={18} />
                    </button>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(designation);
                        }}
                        className="text-rose-500 hover:text-rose-700 cursor-pointer"
                        title="Delete Designation"
                    >
                        <FiTrash2 size={18} />
                    </button>
                </div>
            ),
        },
    ];
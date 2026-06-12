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
        className={`text-[9px] font-black uppercase tracking-wide ${
          item.status === "Enable"
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
        >
          Edit
        </button>

        <button
          onClick={() => onDelete(item)}
        >
          Delete
        </button>
      </div>
    ),
  },
];
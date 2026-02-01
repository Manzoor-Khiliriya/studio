const columns = [
    {
      header: "Operator",
      render: (emp) => (
        <div className="flex items-center gap-4">
          <img
            src={emp.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=f1f5f9&color=64748b`}
            className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-sm"
            alt=""
          />
          <div>
            <p className="font-black text-slate-800 text-sm uppercase group-hover:text-orange-600 transition-colors">{emp.name}</p>
            <p className="text-[10px] font-bold text-orange-500 uppercase tracking-tighter">{emp.designation || "Executive"}</p>
          </div>
        </div>
      )
    },
    {
      header: "Contact Info",
      render: (emp) => (
        <div className="flex items-center gap-2 text-slate-500">
          <HiOutlineMail size={16} className="text-slate-300" />
          <span className="text-xs font-bold lowercase">{emp.email}</span>
        </div>
      )
    },
    {
      header: "Efficiency",
      className: "text-center",
      cellClassName: "text-center",
      render: (emp) => (
        <div className="inline-block px-4 py-1.5 bg-slate-50 rounded-xl border border-slate-100 font-black text-slate-700 text-xs">
          {emp.efficiency || 100}%
        </div>
      )
    },
    {
      header: "Status",
      className: "text-center",
      cellClassName: "text-center",
      render: (emp) => (
        <span className={`inline-block px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
          emp.status === "Enable" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
        }`}>
          {emp.status === "Enable" ? "Active" : "Banned"}
        </span>
      )
    },
    {
      header: "Actions",
      className: "text-right pr-10",
      cellClassName: "text-right pr-10",
      render: (emp) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); setSelectedEmp(emp); setIsModalOpen(true); }}
            className="p-3 rounded-xl bg-slate-50 text-slate-400 hover:bg-orange-600 hover:text-white transition-all active:scale-90"
          >
            <HiOutlinePencilSquare size={18} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setSelectedEmp(emp); setIsDeleteOpen(true); }}
            className="p-3 rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-600 hover:text-white transition-all active:scale-90"
          >
            <HiOutlineTrash size={18} />
          </button>
        </div>
      )
    }
  ];

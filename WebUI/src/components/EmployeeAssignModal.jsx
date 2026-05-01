import React, { useState, useEffect } from "react";
import {
  HiOutlineMagnifyingGlass,
  HiCheckCircle,
  HiOutlineUserGroup,
  HiOutlineXMark,
  HiOutlineUsers
} from "react-icons/hi2";
import { CgSpinner } from "react-icons/cg";
import { toast } from "react-hot-toast";
import CommonModal from "./CommonModal";

// Import your API hooks directly
import { useUpdateTaskMutation } from "../services/taskApi";
import { useGetActiveEmployeesQuery } from "../services/employeeApi";

export default function EmployeeAssignModal({ isOpen, onClose, task }) {
  // --- INTERNAL STATE ---
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);

  // --- API HOOKS ---
  const { data: activeEmployees, isLoading: isFetchingEmployees } = useGetActiveEmployeesQuery(undefined, {
    skip: !isOpen, // Only fetch when modal is open
  });
  const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation();

  // --- SYNC STATE ---
  useEffect(() => {
    if (task?.assignedTo && isOpen) {
      // Map objects to IDs in case the API returns populated data
      const ids = task.assignedTo.map((emp) => emp._id || emp);
      setSelectedIds(ids);
    } else {
      setSelectedIds([]);
    }
    setSearchTerm(""); // Reset search on open
  }, [task, isOpen]);

  // --- LOGIC ---
  const filteredEmployees = activeEmployees?.filter((emp) =>
    emp.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employeeCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.designation?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const toggleMember = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // --- SELECT ALL LOGIC ---
  const isAllFilteredSelected =
    filteredEmployees.length > 0 &&
    filteredEmployees.every(emp => selectedIds.includes(emp._id));

  const handleToggleSelectAll = () => {
    if (isAllFilteredSelected) {
      // Deselect only those currently shown in the filtered list
      const filteredIds = filteredEmployees.map(emp => emp._id);
      setSelectedIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      // Select all currently filtered employees (merge with existing selections)
      const filteredIds = filteredEmployees.map(emp => emp._id);
      setSelectedIds(prev => [...new Set([...prev, ...filteredIds])]);
    }
  };

  const handleSave = async () => {
    if (!task?._id) return;

    try {
      await updateTask({
        id: task._id,
        assignedTo: selectedIds,
      }).unwrap();

      toast.success("Team allocation synchronized successfully.");
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to update team members.");
    }
  };

  return (
    <CommonModal
      isOpen={isOpen}
      onClose={onClose}
      title="Team Assignment"
      maxWidth="max-w-xl"
      onSubmit={handleSave}
      isLoading={isUpdating}
      submitText="Confirm"
      cancelText="Cancel"
    >
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative group">
          <HiOutlineMagnifyingGlass
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors"
            size={18}
          />
          <input
            type="text"
            placeholder="Search by name, code or role..."
            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-orange-500 focus:bg-white font-bold text-[11px] uppercase tracking-tight transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Bulk Selection Header */}
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-2">
            <HiOutlineUsers size={14} className="text-slate-400" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
              {selectedIds.length} Assigned
            </span>
          </div>

          {filteredEmployees.length > 0 && (
            <button
              onClick={handleToggleSelectAll}
              className={`text-[10px] font-black uppercase tracking-widest transition-all px-3 py-1 rounded-lg border cursor-pointer
                ${isAllFilteredSelected
                  ? "text-rose-500 border-rose-100 bg-rose-50 hover:bg-rose-100"
                  : "text-orange-500 border-orange-100 bg-orange-50 hover:bg-orange-100"}`}
            >
              {isAllFilteredSelected ? "Deselect All" : "Select All"}
            </button>
          )}
        </div>

        {/* Selection List */}
        <div className="max-h-[350px] overflow-y-auto custom-scrollbar grid grid-cols-1 md:grid-cols-2 gap-4">
          {isFetchingEmployees ? (
            <div className="py-10 col-span-2 flex flex-col items-center gap-3 text-slate-400">
              <CgSpinner className="animate-spin" size={24} />
              <span className="text-[10px] font-black uppercase tracking-widest text-center">Fetching Team Data...</span>
            </div>
          ) : filteredEmployees.length > 0 ? (
            filteredEmployees.map((emp) => {
              const isSelected = selectedIds.includes(emp._id);
              return (
                <div
                  key={emp._id}
                  onClick={() => toggleMember(emp._id)}
                  className={`flex items-center justify-between p-3.5 rounded-2xl cursor-pointer transition-all border 
                  ${isSelected ? "bg-orange-50 border-orange-200 shadow-sm" : "bg-white border-slate-100 hover:border-slate-300"}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[11px] font-black
                      ${isSelected ? "bg-slate-900 text-orange-500" : "bg-slate-100 text-slate-400"}`}>
                      {emp.user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="leading-tight">
                      <p className="text-[11px] font-black text-slate-900 uppercase tracking-tighter">
                        {emp.user?.name}{" "}
                        {emp?.employeeCode ? `(${emp.employeeCode})` : ""}
                      </p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        <span className="mr-1">•</span> {emp.designation}
                      </p>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all 
                    ${isSelected ? "text-orange-500 scale-110" : "text-slate-100"}`}>
                    <HiCheckCircle size={24} />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 col-span-2 text-center bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">No matching members found.</p>
            </div>
          )}
        </div>
      </div>
    </CommonModal>
  );
}
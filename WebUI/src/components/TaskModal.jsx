import { useState, useEffect } from "react";
import {
  HiOutlineDocumentText, HiOutlineUserGroup,
  HiOutlineClock, HiOutlineCalendarDays,
  HiOutlineHashtag, HiOutlineInformationCircle
} from "react-icons/hi2";
import { CgSpinner } from "react-icons/cg";
import { toast } from "react-hot-toast";
import CommonModal, { InputGroup } from "./CommonModal";
import { useCreateTaskMutation, useUpdateTaskMutation } from "../services/taskApi";
import { useGetActiveEmployeesQuery } from "../services/employeeApi";

export default function TaskModal({ isOpen, onClose, editTask = null }) {
  const isEditing = !!editTask;
  const [createTask, { isLoading: isCreating }] = useCreateTaskMutation();
  const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation();
  const { data: activeEmployees } = useGetActiveEmployeesQuery();

  const [formData, setFormData] = useState({
    title: "",
    projectNumber: "",
    assignedTo: [], // Changed to Array
    allocatedTime: "8",
    startDate: "",
    endDate: "",
    projectDetails: "",
  });

  useEffect(() => {
    if (editTask && isOpen) {
      // Extract IDs from the array of assigned employees
      const assigneeIds = editTask.assignedTo?.map(emp => emp._id || emp) || [];

      setFormData({
        title: editTask.title || "",
        projectNumber: editTask.projectNumber || "",
        assignedTo: assigneeIds, 
        allocatedTime: String(editTask.allocatedTime || 8),
        startDate: editTask.startDate ? editTask.startDate.split('T')[0] : "",
        endDate: editTask.endDate ? editTask.endDate.split('T')[0] : "",
        projectDetails: editTask.projectDetails || "",
      });
    } else if (isOpen) {
      setFormData({
        title: "", projectNumber: "", assignedTo: [],
        allocatedTime: "8", startDate: "", endDate: "", projectDetails: ""
      });
    }
  }, [editTask, isOpen]);

  // Handle Multi-Select Change
  const handleMemberChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, (option) => option.value);
    setFormData({ ...formData, assignedTo: selectedOptions });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.assignedTo.length === 0) return toast.error("Assign at least one operator");

    const loadingToast = toast.loading(isEditing ? "Updating mission..." : "Deploying task...");

    try {
      const payload = {
        ...formData,
        allocatedTime: Number(formData.allocatedTime),
        projectDetails: formData.projectDetails,
      };

      if (isEditing) {
        await updateTask({ id: editTask._id, ...payload }).unwrap();
      } else {
        await createTask(payload).unwrap();
      }

      toast.success(isEditing ? "Mission protocols updated" : "Task deployed successfully", { id: loadingToast });
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || "Operation failed", { id: loadingToast });
    }
  };

  const loading = isCreating || isUpdating;

  return (
    <CommonModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Update Mission Specs" : "Assign Multi-Operator Mission"}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* MISSION IDENTIFICATION */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <InputGroup label="Mission Objective">
              <HiOutlineDocumentText className="input-icon" />
              <input
                required
                className="form-input"
                placeholder="Operation: Phoenix..."
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </InputGroup>
          </div>
          <InputGroup label="Ref ID">
            <HiOutlineHashtag className="input-icon" />
            <input
              required
              className="form-input uppercase"
              placeholder="PRJ-99"
              value={formData.projectNumber}
              onChange={(e) => setFormData({ ...formData, projectNumber: e.target.value })}
            />
          </InputGroup>
        </div>

        {/* MULTI-OPERATOR SELECTION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputGroup label="Active Operators (Cmd + Click to multi-select)">
            <HiOutlineUserGroup className="input-icon !top-6" />
            <select
              multiple
              required
              className="form-input !h-32 !py-4 scrollbar-hide"
              value={formData.assignedTo}
              onChange={handleMemberChange}
            >
              {activeEmployees?.map(emp => (
                <option key={emp._id} value={emp._id} className="py-2 px-1 font-bold">
                  {emp.user.name} — {emp.designation}
                </option>
              ))}
            </select>
            {formData.assignedTo.length > 0 && (
              <p className="text-[10px] font-black text-orange-500 mt-2 uppercase tracking-widest">
                {formData.assignedTo.length} Operators Selected
              </p>
            )}
          </InputGroup>

          <InputGroup label="Authorized Hours">
            <HiOutlineClock className="input-icon" />
            <input
              required
              type="number"
              className="form-input"
              value={formData.allocatedTime}
              onChange={(e) => setFormData({ ...formData, allocatedTime: e.target.value })}
            />
          </InputGroup>
        </div>

        {/* TIMELINE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-50 pt-6">
          <InputGroup label="Start Date">
            <HiOutlineCalendarDays className="input-icon" />
            <input
              required
              type="date"
              className="form-input"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />
          </InputGroup>
          <InputGroup label="Deadline">
            <HiOutlineCalendarDays className="input-icon" />
            <input
              required
              type="date"
              className="form-input"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            />
          </InputGroup>
        </div>

        <InputGroup label="Mission Briefing">
          <HiOutlineInformationCircle className="input-icon !top-5 translate-y-0" />
          <textarea
            rows={3}
            className="form-input !py-3 min-h-[100px] resize-none"
            placeholder="Tactical details..."
            value={formData.projectDetails}
            onChange={(e) => setFormData({ ...formData, projectDetails: e.target.value })}
          />
        </InputGroup>

        <button
          disabled={loading}
          type="submit"
          className="w-full bg-slate-900 hover:bg-orange-600 text-white py-5 rounded-[1.5rem] font-black text-lg transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50"
        >
          {loading ? <CgSpinner className="animate-spin" size={24} /> : (isEditing ? "Sync Protocols" : "Launch Mission")}
        </button>
      </form>

      <style jsx global>{`
        .form-input { 
          width: 100%; 
          padding: 0.85rem 1rem 0.85rem 2.75rem; 
          background-color: #f8fafc; 
          border: 2px solid transparent; 
          border-radius: 1.25rem; 
          font-size: 0.875rem; 
          font-weight: 700; 
          color: #1e293b; 
          transition: all 0.2s; 
          outline: none; 
        }
        .form-input:focus { background-color: #fff; border-color: #f97316; }
        .input-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #cbd5e1; z-index: 10; }
        option:checked {
          background-color: #f97316 !important;
          color: white !important;
        }
      `}</style>
    </CommonModal>
  );
}
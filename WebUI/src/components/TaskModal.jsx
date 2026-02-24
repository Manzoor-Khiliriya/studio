import { useState, useEffect } from "react";
import {
  HiOutlineDocumentText,
  HiOutlineClock,
  HiOutlineCalendarDays,
  HiOutlineInformationCircle,
  HiCheckCircle,
  HiOutlineMagnifyingGlass,
  HiOutlineFlag,
  HiOutlineBriefcase
} from "react-icons/hi2";
import { CgSpinner } from "react-icons/cg";
import { toast } from "react-hot-toast";
import CommonModal, { InputGroup } from "./CommonModal";
import { useCreateTaskMutation, useUpdateTaskMutation } from "../services/taskApi";
import { useGetActiveEmployeesQuery } from "../services/employeeApi";
import { useGetProjectsQuery } from "../services/projectApi";

export default function TaskModal({ isOpen, onClose, editTask = null }) {
  const isEditing = !!editTask;
  const [searchTerm, setSearchTerm] = useState("");

  const [createTask, { isLoading: isCreating }] = useCreateTaskMutation();
  const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation();
  const { data: activeEmployees } = useGetActiveEmployeesQuery();
  const { data: projects } = useGetProjectsQuery();

  const [formData, setFormData] = useState({
    title: "",
    projectId: "", 
    assignedTo: [],
    allocatedTime: "8",
    startDate: "",
    endDate: "",
    projectDetails: "",
    status: "To be started",
    activeStatus: "Draft-1",
    priority: "Medium"
  });

  useEffect(() => {
    if (editTask && isOpen) {
      const assigneeIds = editTask.assignedTo?.map(emp => emp._id || emp) || [];
      setFormData({
        title: editTask.title || "",
        // Look for project._id if populated, otherwise use project as string ID
        projectId: editTask.project?._id || editTask.project || "",
        assignedTo: assigneeIds,
        allocatedTime: String(editTask.allocatedTime || 8),
        startDate: editTask.startDate ? editTask.startDate.split('T')[0] : "",
        endDate: editTask.endDate ? editTask.endDate.split('T')[0] : "",
        projectDetails: editTask.projectDetails || "",
        status: editTask.status || "To be started",
        activeStatus: editTask.activeStatus || "Draft-1",
        priority: editTask.priority || "Medium",
      });
    } else if (isOpen) {
      setFormData({
        title: "", projectId: "", assignedTo: [],
        allocatedTime: "8", startDate: "", endDate: "", projectDetails: "",
        status: "To be started", activeStatus: "Draft-1", priority: "Medium"
      });
    }
  }, [editTask, isOpen]);

  const filteredEmployees = activeEmployees?.filter(emp =>
    emp.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.designation.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const toggleMember = (id) => {
    setFormData(prev => ({
      ...prev,
      assignedTo: prev.assignedTo.includes(id)
        ? prev.assignedTo.filter(i => i !== id)
        : [...prev.assignedTo, id]
    }));
  };

  const handleSelectAll = () => {
    const filteredIds = filteredEmployees.map(e => e._id);
    const areAllVisibleSelected = filteredIds.every(id => formData.assignedTo.includes(id));
    setFormData(prev => ({
      ...prev,
      assignedTo: areAllVisibleSelected
        ? prev.assignedTo.filter(id => !filteredIds.includes(id))
        : [...new Set([...prev.assignedTo, ...filteredIds])]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.projectId) return toast.error("Please select a Project");
    if (isEditing && formData.assignedTo.length === 0) return toast.error("Please assign at least one person");

    const loadingToast = toast.loading("Saving task...");
    try {
      // --- FIX: Map projectId to project for Backend Schema ---
      const payload = { 
        ...formData, 
        project: formData.projectId, // Use the key 'project' as required by Schema
        allocatedTime: Number(formData.allocatedTime) 
      };
      
      // Clean up the temporary UI key
      delete payload.projectId;

      if (isEditing) {
        await updateTask({ id: editTask._id, ...payload }).unwrap();
      } else {
        await createTask(payload).unwrap();
      }
      
      toast.success("Saved successfully!", { id: loadingToast });
      onClose();
    } catch (err) {
      toast.error(err.data?.message || "Something went wrong", { id: loadingToast });
    }
  };

  return (
    <CommonModal
      isOpen={isOpen} onClose={onClose}
      title={isEditing ? "Edit Task" : "Create New Task"}
      subtitle={isEditing ? "Update specific task details" : "Assign a task to an existing project"}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 md:col-span-6">
            <InputGroup label="Select Project">
              <HiOutlineBriefcase className="input-icon" />
              <select
                required
                className="form-input font-bold text-slate-700"
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
              >
                <option value="">Select Project...</option>
                {projects?.map(p => (
                  <option key={p._id} value={p._id}>
                    {p.projectNumber} - {p.title}
                  </option>
                ))}
              </select>
            </InputGroup>
          </div>

          <div className="col-span-12 md:col-span-6">
            <InputGroup label="Task Title (e.g., Drafting)">
              <HiOutlineDocumentText className="input-icon" />
              <input
                required
                className="form-input"
                placeholder="What is the work?"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </InputGroup>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 md:col-span-4">
            <InputGroup label="Priority">
              <HiOutlineFlag className={`input-icon ${formData.priority === 'High' ? 'text-rose-500' : 'text-slate-400'}`} />
              <select
                className="form-input font-bold text-[11px]"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </InputGroup>
          </div>

          <div className="col-span-12 md:col-span-4">
            <InputGroup label="Start Date">
              <HiOutlineCalendarDays className="input-icon" />
              <input required type="date" className="form-input text-[11px]" value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
            </InputGroup>
          </div>

          <div className="col-span-12 md:col-span-4">
            <InputGroup label="End Date">
              <HiOutlineCalendarDays className="input-icon" />
              <input required type="date" className="form-input text-[11px]" value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} />
            </InputGroup>
          </div>
        </div>

        {isEditing && (
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Assign Team ({formData.assignedTo.length})
                </label>
                <button
                  type="button" onClick={handleSelectAll}
                  className="text-[9px] bg-white border border-slate-200 px-2 py-1 rounded-lg uppercase font-bold hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                >
                  Select All
                </button>
              </div>
              <div className="relative w-full sm:w-1/2">
                <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type="text" placeholder="Filter team..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 outline-none focus:border-orange-500 bg-white"
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[140px] overflow-y-auto custom-scrollbar pr-1">
              {filteredEmployees.map(emp => (
                <div
                  key={emp._id} onClick={() => toggleMember(emp._id)}
                  className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all border 
                  ${formData.assignedTo.includes(emp._id) ? "bg-white border-orange-500 shadow-sm" : "bg-white/50 border-transparent hover:border-slate-200"}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black
                    ${formData.assignedTo.includes(emp._id) ? "bg-orange-500 text-white" : "bg-slate-200 text-slate-500"}`}>
                      {emp.user.name.charAt(0)}
                    </div>
                    <div className="leading-tight">
                      <p className="text-[11px] font-bold text-slate-800">{emp.user.name}</p>
                      <p className="text-[9px] text-slate-400 uppercase font-medium">{emp.designation}</p>
                    </div>
                  </div>
                  {formData.assignedTo.includes(emp._id) && <HiCheckCircle className="text-orange-500" size={16} />}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 md:col-span-4">
            <InputGroup label="Allocated (Hrs)">
              <HiOutlineClock className="input-icon" />
              <input required type="number" className="form-input" value={formData.allocatedTime}
                onChange={(e) => setFormData({ ...formData, allocatedTime: e.target.value })} />
            </InputGroup>
          </div>
          <div className="col-span-12 md:col-span-8">
            <InputGroup label="Task Details">
              <HiOutlineInformationCircle className="input-icon" />
              <textarea
                rows={1}
                className="form-input resize-none"
                placeholder="e.g., Use the new design system..."
                value={formData.projectDetails}
                onChange={(e) => setFormData({ ...formData, projectDetails: e.target.value })}
              />
            </InputGroup>
          </div>
        </div>

        <button
          disabled={isCreating || isUpdating}
          type="submit"
          className="w-full bg-slate-900 hover:bg-orange-600 text-white py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-3 active:scale-[0.98] shadow-lg mt-2 disabled:opacity-70 cursor-pointer"
        >
          {(isCreating || isUpdating) ? (
            <CgSpinner className="animate-spin" size={20} />
          ) : (
            isEditing ? "Update Task" : "Create Task"
          )}
        </button>
      </form>
    </CommonModal>
  );
}
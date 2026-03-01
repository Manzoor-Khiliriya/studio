import { useState, useEffect } from "react";
import {
  HiOutlineDocumentText,
  HiOutlineClock,
  HiOutlineCalendarDays,
  HiOutlineInformationCircle,
  HiCheckCircle,
  HiOutlineMagnifyingGlass,
  HiOutlineFlag,
  HiOutlineBriefcase,
  HiOutlineBolt,
  HiOutlineQueueList
} from "react-icons/hi2";
import { CgSpinner } from "react-icons/cg";
import { toast } from "react-hot-toast";
import CommonModal, { InputGroup } from "./CommonModal";
import { useCreateTaskMutation, useUpdateTaskMutation } from "../services/taskApi";
import { useGetActiveEmployeesQuery } from "../services/employeeApi";
import { useGetProjectEstimateQuery } from "../services/projectApi";

export default function TaskModal({ isOpen, onClose, editTask = null, projects }) {
  const isEditing = !!editTask;
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    projectId: "",
    assignedTo: [],
    estimatedTime: "",
    allocatedTime: "",
    status: "On hold",
    activeStatus: "Draft-1",
    priority: "Medium",
    description: ""
  });

  const [createTask, { isLoading: isCreating }] = useCreateTaskMutation();
  const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation();
  const { data: activeEmployees } = useGetActiveEmployeesQuery();
  const { data: estimateData, isFetching: isCalculating } = useGetProjectEstimateQuery(
    formData.projectId,
    { skip: !formData.projectId || !!editTask }
  );

  useEffect(() => {
    if (estimateData?.hours && !editTask) {
      setFormData((prev) => ({
        ...prev,
        estimatedTime: String(estimateData.hours),
        allocatedTime: String(estimateData.hours),
      }));
    }
  }, [estimateData, editTask]);

  useEffect(() => {
    if (editTask && isOpen) {
      const assigneeIds = editTask.assignedTo?.map(emp => emp._id || emp) || [];
      setFormData({
        title: editTask.title || "",
        projectId: editTask.project?._id || editTask.project || "",
        assignedTo: assigneeIds,
        estimatedTime: String(editTask.estimatedTime || 8),
        allocatedTime: String(editTask.allocatedTime || 8),
        status: editTask.status || "On hold",
        activeStatus: editTask.activeStatus || "Draft-1",
        priority: editTask.priority || "Medium",
        description: editTask.description || ""
      });
    } else if (isOpen) {
      setFormData({
        title: "", projectId: "", assignedTo: [],
        estimatedTime: "8", allocatedTime: "8",
        status: "On hold", liveStatus: "To be started",
        activeStatus: "Draft-1", priority: "Medium", description: ""
      });
    }
  }, [editTask, isOpen]);

  const filteredEmployees = activeEmployees?.filter(emp =>
    emp.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.designation?.toLowerCase().includes(searchTerm.toLowerCase())
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
    const allFilteredSelected = filteredEmployees.every(emp =>
      formData.assignedTo.includes(emp._id)
    );

    if (allFilteredSelected) {
      const filteredIds = filteredEmployees.map(emp => emp._id);
      setFormData(prev => ({
        ...prev,
        assignedTo: prev.assignedTo.filter(id => !filteredIds.includes(id))
      }));
    } else {
      const newIds = filteredEmployees
        .map(emp => emp._id)
        .filter(id => !formData.assignedTo.includes(id));

      setFormData(prev => ({
        ...prev,
        assignedTo: [...prev.assignedTo, ...newIds]
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.projectId) return toast.error("Please select a Project");
    if (formData.assignedTo.length === 0) return toast.error("Please assign at least one operator");

    const loadingToast = toast.loading(isEditing ? "Updating task..." : "Creating task...");
    try {
      const payload = {
        ...formData,
        project: formData.projectId,
        allocatedTime: Number(formData.allocatedTime),
        estimatedTime: Number(formData.estimatedTime)
      };

      delete payload.projectId;

      if (isEditing) {
        await updateTask({ id: editTask._id, ...payload }).unwrap();
      } else {
        await createTask(payload).unwrap();
      }

      toast.success(isEditing ? "Task updated!" : "Task created!", { id: loadingToast });
      onClose();
    } catch (err) {
      toast.error(err.data?.message || "Operation failed", { id: loadingToast });
    }
  };

  return (
    <CommonModal
      isOpen={isOpen} onClose={onClose}
      title={isEditing ? "Edit Task" : "New Task Objective"}
      subtitle={isEditing ? "Modify existing task parameters" : "Initialize a new task for an active project"}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Project & Title */}
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 md:col-span-6">
            <InputGroup label="Target Project">
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
                    [{p.project_code || 'PROJ'}] {p.title}
                  </option>
                ))}
              </select>
            </InputGroup>
          </div>
          <div className="col-span-12 md:col-span-6">
            <InputGroup label="Task Title">
              <HiOutlineDocumentText className="input-icon" />
              <input
                required
                className="form-input"
                placeholder="Title (e.g. 3D Modeling)"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </InputGroup>
          </div>
        </div>

        {/* Statuses & Priority */}
        <div className="grid grid-cols-12 gap-4">
          {/* Estimated Time - Calculated by Backend */}
          <div className="col-span-12 md:col-span-3">
            <InputGroup label="Estimate (H)">
              {isCalculating ? (
                <CgSpinner className="input-icon animate-spin text-orange-500" />
              ) : (
                <HiOutlineClock className="input-icon text-slate-400" />
              )}
              <input
                readOnly
                type="number"
                className="form-input bg-slate-50 cursor-not-allowed opacity-75 font-mono"
                placeholder="Auto"
                value={formData.estimatedTime}
                disabled
              />
            </InputGroup>
          </div>

          {/* Allocated Time - Suggested by Estimate but Editable */}
          <div className="col-span-12 md:col-span-3">
            <InputGroup label="Allocated (H)">
              <HiOutlineClock className={`input-icon ${formData.allocatedTime !== formData.estimatedTime ? 'text-orange-500' : 'text-slate-400'}`} />
              <input
                required
                type="number"
                className="form-input border-orange-100 focus:border-orange-500 font-bold"
                value={formData.allocatedTime}
                onChange={(e) => setFormData({ ...formData, allocatedTime: e.target.value })}
              />
            </InputGroup>
          </div>

          <div className="col-span-12 md:col-span-6">
            <InputGroup label="Priority">
              <HiOutlineFlag className={`input-icon ${formData.priority === 'High' ? 'text-rose-500' : ''}`} />
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
        </div>

        {/* Team Assignment */}
        {isEditing && (
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
              <div className="flex items-center gap-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Assign Employees ({formData.assignedTo.length})
                </label>
                {/* Select All Toggle */}
                {filteredEmployees.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 hover:border-orange-500 hover:text-orange-600 transition-colors"
                  >
                    {filteredEmployees.every(emp => formData.assignedTo.includes(emp._id))
                      ? "Deselect All"
                      : "Select All Employees"}
                  </button>
                )}
              </div>

              <div className="relative w-full sm:w-1/2">
                <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type="text"
                  placeholder="Search team members..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 outline-none focus:border-orange-500 bg-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black
                  ${formData.assignedTo.includes(emp._id) ? "bg-slate-900 text-orange-500" : "bg-slate-200 text-slate-500"}`}>
                      {emp.user?.name?.charAt(0)}
                    </div>
                    <div className="leading-tight">
                      <p className="text-[11px] font-bold text-slate-800 uppercase tracking-tighter">{emp.user?.name}</p>
                      <p className="text-[9px] text-slate-400 uppercase font-medium">{emp.designation}</p>
                    </div>
                  </div>
                  {formData.assignedTo.includes(emp._id) && <HiCheckCircle className="text-orange-500" size={16} />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Time & Description */}
        <div className="grid grid-cols-12 gap-4">

          <div className="col-span-12 md:col-span-6">
            <InputGroup label="Initiative Status">
              <HiOutlineQueueList className="input-icon" />
              <select
                className="form-input font-bold text-[11px]"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                {["On hold", "Feedback pending", "Final rendering", "Postproduction", "Completed"].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </InputGroup>
          </div>
          <div className="col-span-12 md:col-span-6">

            <InputGroup label="Active Status">
              <HiOutlineQueueList className="input-icon" />
              <select
                className="form-input font-bold text-[11px]"
                value={formData.activeStatus}
                onChange={(e) => setFormData({ ...formData, activeStatus: e.target.value })}
              >
                {["Draft-1", "Draft-2", "Draft-3", "Draft-4", "Draft-5", "Pre-Final", "Final"].map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </InputGroup>
          </div>
        </div>

        <InputGroup label="Task Details">
          <textarea
            rows={2}
            className="form-input resize-none"
            placeholder="Enter task details or references..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </InputGroup>

        <button
          disabled={isCreating || isUpdating}
          type="submit"
          className="w-full bg-slate-900 hover:bg-orange-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 active:scale-[0.98] shadow-xl mt-2 disabled:opacity-70 cursor-pointer"
        >
          {(isCreating || isUpdating) ? (
            <CgSpinner className="animate-spin" size={20} />
          ) : (
            isEditing ? "Synchronize Updates" : "Initialize Task"
          )}
        </button>
      </form>
    </CommonModal>
  );
}
import { useState, useEffect } from "react";
import {
  HiOutlineDocumentText,
  HiOutlineClock,
  HiOutlineFlag,
  HiOutlineBriefcase,
} from "react-icons/hi2";
import { CgSpinner } from "react-icons/cg";
import { toast } from "react-hot-toast";
import CommonModal, { InputGroup } from "./CommonModal";
import { useCreateTaskMutation, useUpdateTaskMutation } from "../services/taskApi";
import { useGetProjectEstimateQuery } from "../services/projectApi";

export default function TaskModal({
  isOpen,
  onClose,
  editTask = null,
  singleProject = null
}) {
  const isEditing = !!editTask;

  const [formData, setFormData] = useState({
    title: "",
    projectId: "",
    estimatedTime: "",
    allocatedTime: "",
    priority: "Medium",
    description: ""
  });

  const [createTask, { isLoading: isCreating }] = useCreateTaskMutation();
  const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation();

  const { data: estimateData, isFetching: isCalculating } = useGetProjectEstimateQuery(
    formData.projectId,
    { skip: !formData.projectId || isEditing || !isOpen }
  );

  useEffect(() => {
    if (!isEditing && estimateData) {
      setFormData((prev) => ({
        ...prev,
        estimatedTime: String(estimateData || 0),
        allocatedTime: String(estimateData || 0),
      }));
    }
  }, [estimateData, isEditing]);

  useEffect(() => {
    if (isOpen) {
      if (editTask) {
        setFormData({
          title: editTask.title || "",
          projectId: singleProject?._id || editTask.project?._id || editTask.project || "",
          estimatedTime: String(editTask.estimatedTime || 8),
          allocatedTime: String(editTask.allocatedTime || 8),
          priority: editTask.priority || "Medium",
          description: editTask.description || ""
        });
      } else if (singleProject) {
        setFormData({
          title: "",
          projectId: singleProject._id,
          estimatedTime: "",
          allocatedTime: "",
          priority: "Medium",
          description: ""
        });
      }
    }
  }, [editTask, isOpen, singleProject]);

  useEffect(() => {
    if (!formData.projectId) return;

    setFormData((prev) => ({
      ...prev,
      estimatedTime: "",
      allocatedTime: ""
    }));
  }, [formData.projectId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.projectId) {
      return toast.error("Missing Project Context. Please try again.");
    }

    const loadingToast = toast.loading(isEditing ? "Synchronizing updates..." : "Initializing task...");

    try {
      const payload = {
        ...formData,
        project: formData.projectId,
        allocatedTime: Number(formData.allocatedTime),
        estimatedTime: Number(formData.estimatedTime)
      };

      // Remove local helper key before sending to API
      delete payload.projectId;

      if (isEditing) {
        await updateTask({ id: editTask._id, ...payload }).unwrap();
      } else {
        await createTask(payload).unwrap();
      }

      toast.success(isEditing ? "Task updated successfully!" : "Task created successfully!", { id: loadingToast });
      onClose();
    } catch (err) {
      toast.error(err.data?.message || "Operation failed", { id: loadingToast });
    }
  };

  return (
    <CommonModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Task" : "New Task Objective"}
      subtitle={isEditing ? "Modify existing task parameters" : "Initialize a new task for this project"}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Project Context Display (Read Only) */}
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 md:col-span-6">
            <InputGroup label="Target Project">
              <HiOutlineBriefcase className="input-icon" />
              <div className="form-input bg-slate-50 border-slate-100 overflow-hidden">
                <span className="font-bold text-slate-900 truncate text-sm">
                  {singleProject?.title || "Active Project"} {singleProject?.projectCode ? (`(${singleProject.projectCode})`) : ""}
                </span>
              </div>
            </InputGroup>
          </div>

          <div className="col-span-12 md:col-span-6">
            <InputGroup label="Task Title">
              <HiOutlineDocumentText className="input-icon" />
              <input
                required
                className="form-input"
                placeholder="Enter task title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </InputGroup>
          </div>
        </div>

        {/* Resource Allocation & Priority */}
        <div className="grid grid-cols-12 gap-4">
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
                placeholder="Calculating..."
                value={formData.estimatedTime}
                disabled
              />
            </InputGroup>
          </div>

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

        {/* Description / Metadata */}
        <InputGroup label="Task Description">
          <textarea
            rows={2}
            className="form-input resize-none"
            placeholder="Enter specific instructions or task scope..."
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
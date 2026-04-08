import { useState, useEffect } from "react";
import {
  HiOutlineBriefcase,
  HiOutlineHashtag,
  HiOutlineUser,
  HiOutlineCalendarDays,
  HiOutlineFlag,
} from "react-icons/hi2";
import { CgSpinner } from "react-icons/cg";
import { toast } from "react-hot-toast";
import CommonModal, { InputGroup } from "./CommonModal";
import {
  useCreateProjectMutation,
  useUpdateProjectMutation
} from "../services/projectApi";

export default function ProjectModal({ isOpen, onClose, editProject = null, activeTab }) {
  const isEditing = !!editProject;

  const [createProject, { isLoading: isCreating }] = useCreateProjectMutation();
  const [updateProject, { isLoading: isUpdating }] = useUpdateProjectMutation();

  const [formData, setFormData] = useState({
    projectCode: "",
    projectType: "Standard",
    title: "",
    clientName: "",
    startDate: "",
    endDate: "",
    invoiceNumber: "",
    invoiceDate: "",
    status: "Active",
  });

  useEffect(() => {
    if (editProject && isOpen) {
      setFormData({
        projectCode: editProject.projectCode || "",
        projectType: editProject.projectType || "Standard",
        title: editProject.title || "",
        clientName: editProject.clientName || "",
        startDate: editProject.startDate ? new Date(editProject.startDate).toISOString().split('T')[0] : "",
        endDate: editProject.endDate ? new Date(editProject.endDate).toISOString().split('T')[0] : "",
        invoiceNumber: editProject.invoiceNumber || "",
        invoiceDate: editProject.invoiceDate ? new Date(editProject.invoiceDate).toISOString().split('T')[0] : "",
        status: editProject.status || "Active",
      });
    } else if (isOpen) {
      setFormData({
        projectCode: "",
        projectType: "Standard",
        title: "",
        clientName: "",
        startDate: "",
        endDate: "",
        invoiceNumber: "",
        invoiceDate: "",
        status: "Active",
      });
    }
  }, [editProject, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.projectCode || !formData.title || !formData.startDate || !formData.endDate) {
      return toast.error("Required fields missing");
    }

    const loadingToast = toast.loading(isEditing ? "Synchronizing Project..." : "Initializing Project...");

    try {
      if (isEditing) {
        await updateProject({
          id: editProject._id,
          ...formData
        }).unwrap();
      } else {
        await createProject(formData).unwrap();
      }

      toast.success(isEditing ? "Project Updated" : "Project Initialized", { id: loadingToast });
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || "Protocol Failure", { id: loadingToast });
    }
  };

  const loading = isCreating || isUpdating;

  return (
    <CommonModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Update Master Project" : "Create Master Project"}
      subtitle={isEditing ? "Modifying high-level project parameters" : "Defining new top-level project objective"}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Project Identity Row */}
        <div className="grid grid-cols-1 gap-4">
          <InputGroup label="Project ID / Code">
            <HiOutlineHashtag className="input-icon" />
            <input
              required
              className="form-input uppercase font-black text-orange-600 disabled:bg-slate-50 disabled:text-slate-400"
              placeholder="E.G. PRJ-2024-001"
              value={formData.projectCode}
              onChange={(e) => setFormData({ ...formData, projectCode: e.target.value })}
            />
          </InputGroup>

          <InputGroup label="Official Project Title">
            <HiOutlineBriefcase className="input-icon" />
            <input
              required
              className="form-input font-bold"
              placeholder="E.G. Cinematic Branding"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </InputGroup>

          <div className="">
            <InputGroup label="Project Type">
              <HiOutlineFlag className={`input-icon`} />
              <select
                className="form-input font-bold text-[11px]"
                value={formData.projectType}
                onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                required
              >
                <option value="Low">Standard</option>
                <option value="Medium">Revision</option>
              </select>
            </InputGroup>
          </div>
        </div>

        {/* Client & Status Row */}
        <InputGroup label="Client Entity">
          <HiOutlineUser className="input-icon" />
          <input
            className="form-input text-xs font-bold uppercase"
            placeholder="Acme Corp"
            value={formData.clientName}
            onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
          />
        </InputGroup>

        {/* Timeline Row */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 grid grid-cols-2 gap-4">
          <InputGroup label="Start Protocol">
            <HiOutlineCalendarDays className="input-icon" />
            <input
              type="date"
              required
              className="form-input text-[11px] font-bold"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />
          </InputGroup>

          <InputGroup label="Deadline">
            <HiOutlineCalendarDays className="input-icon" />
            <input
              type="date"
              required
              className="form-input text-[11px] font-bold"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            />
          </InputGroup>
        </div>

        {isEditing && activeTab === "all" && (
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 grid grid-cols-2 gap-4">
            <InputGroup label="Invoice Number">
              <HiOutlineUser className="input-icon" />
              <input
                className="form-input text-xs font-bold uppercase"
                placeholder="Enter Invoice Number"
                value={formData.invoiceNumber}
                onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
              />
            </InputGroup>

            <InputGroup label="Inoice Date">
              <HiOutlineCalendarDays className="input-icon" />
              <input
                type="date"
                className="form-input text-[11px] font-bold"
                value={formData.invoiceDate}
                onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
              />
            </InputGroup>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          <InputGroup label="Project Type">
            <HiOutlineFlag className={`input-icon`} />
            <select
              className="form-input font-bold text-[11px]"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}

            >
              <option value="Active">Active</option>
              <option value="On hold">On Hold</option>
              <option value="Submitted">Submitted</option>
              <option value="Inactive">Inactive</option>
            </select>
          </InputGroup>
        </div>

        {/* Action Button */}
        <button
          disabled={loading}
          type="submit"
          className="w-full bg-slate-900 hover:bg-orange-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 active:scale-[0.98] shadow-xl mt-2 disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <CgSpinner className="animate-spin" size={20} />
          ) : (
            isEditing ? "Synchronize Project" : "Initialize Project"
          )}
        </button>
      </form>
    </CommonModal>
  );
}
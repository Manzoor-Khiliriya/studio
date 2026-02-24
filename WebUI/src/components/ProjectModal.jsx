import { useState, useEffect } from "react";
import { 
  HiOutlineBriefcase, 
  HiOutlineHashtag, 
  HiOutlineUser, 
  HiOutlineInformationCircle 
} from "react-icons/hi2";
import { CgSpinner } from "react-icons/cg";
import { toast } from "react-hot-toast";
import CommonModal, { InputGroup } from "./CommonModal";
import { useCreateProjectMutation, useUpdateProjectMutation } from "../services/projectApi";

export default function ProjectModal({ isOpen, onClose, editProject = null }) {
  const isEditing = !!editProject;
  const [createProject, { isLoading: isCreating }] = useCreateProjectMutation();
  const [updateProject, { isLoading: isUpdating }] = useUpdateProjectMutation();

  const [formData, setFormData] = useState({
    projectNumber: "",
    title: "",
    clientName: "",
    description: "",
    status: "In Progress"
  });

  useEffect(() => {
    if (editProject && isOpen) {
      setFormData({
        projectNumber: editProject.projectNumber || "",
        title: editProject.title || "",
        clientName: editProject.clientName || "",
        description: editProject.description || "",
        status: editProject.status || "In Progress"
      });
    } else {
      setFormData({ projectNumber: "", title: "", clientName: "", description: "", status: "In Progress" });
    }
  }, [editProject, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading(isEditing ? "Updating Project..." : "Creating Project...");
    try {
      if (isEditing) {
        await updateProject({ id: editProject._id, ...formData }).unwrap();
      } else {
        await createProject(formData).unwrap();
      }
      toast.success("Project saved successfully!", { id: loadingToast });
      onClose();
    } catch (err) {
      toast.error(err.data?.message || "Failed to save project", { id: loadingToast });
    }
  };

  return (
    <CommonModal
      isOpen={isOpen} onClose={onClose}
      title={isEditing ? "Edit Project" : "Create Master Project"}
      subtitle="Define the top-level project details here"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <InputGroup label="Project ID / Code">
          <HiOutlineHashtag className="input-icon" />
          <input 
            required 
            className="form-input uppercase" 
            placeholder="e.g. PRJ-001"
            value={formData.projectNumber}
            onChange={(e) => setFormData({ ...formData, projectNumber: e.target.value })}
          />
        </InputGroup>

        <InputGroup label="Project Title">
          <HiOutlineBriefcase className="input-icon" />
          <input 
            required 
            className="form-input" 
            placeholder="e.g. Website Redesign"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
        </InputGroup>

        <InputGroup label="Client Name">
          <HiOutlineUser className="input-icon" />
          <input 
            className="form-input" 
            placeholder="e.g. Acme Corp"
            value={formData.clientName}
            onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
          />
        </InputGroup>

        <InputGroup label="Brief Description">
          <HiOutlineInformationCircle className="input-icon" />
          <textarea 
            rows={2}
            className="form-input resize-none" 
            placeholder="What is this project about?"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </InputGroup>

        <button
          disabled={isCreating || isUpdating}
          type="submit"
          className="w-full bg-slate-900 hover:bg-orange-600 text-white py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
        >
          {isCreating || isUpdating ? <CgSpinner className="animate-spin" /> : (isEditing ? "Update Project" : "Create Project")}
        </button>
      </form>
    </CommonModal>
  );
}
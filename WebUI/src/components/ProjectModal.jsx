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
    statusChangedAt: ""
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
        statusChangedAt: editProject.statusChangedAt ? new Date(editProject.statusChangedAt).toISOString().split('T')[0] : "",
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
        statusChangedAt: ""
      });
    }
  }, [editProject, isOpen]);

  const handleSubmit = async () => {
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
      maxWidth="max-w-xl"
      onSubmit={handleSubmit}
      isLoading={loading}
      submitText={isEditing ? "Update" : "Create"}
    >
      <form
        onSubmit={(e) => e.preventDefault()}
        className="space-y-4"
      >

        {/* Project Identity Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputGroup label="Project ID / Code *">
            <HiOutlineHashtag className="input-icon" />
            <input
              required
              className="form-input uppercase placeholder:capitalize font-black text-orange-600 disabled:bg-slate-50 disabled:text-slate-400"
              placeholder="Enter project id/code"
              value={formData.projectCode}
              onChange={(e) => setFormData({ ...formData, projectCode: e.target.value })}
            />
          </InputGroup>

          <InputGroup label="Project Title *">
            <HiOutlineBriefcase className="input-icon" />
            <input
              required
              className="form-input font-bold"
              placeholder="Enter Project Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </InputGroup>

          <InputGroup label="Project Type *">
            <HiOutlineFlag className={`input-icon`} />
            <select
              className="form-input font-bold text-[11px]"
              value={formData.projectType}
              onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
              required
            >
              <option value="Standard">Standard</option>
              <option value="Revision">Revision</option>
            </select>
          </InputGroup>

          <InputGroup label="Client Name">
            <HiOutlineUser className="input-icon" />
            <input
              className="form-input text-xs font-bold"
              placeholder="Enter Client Name"
              value={formData.clientName}
              onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
            />
          </InputGroup>

          <InputGroup label="Start Date *">
            <HiOutlineCalendarDays className="input-icon" />
            <input
              type="date"
              required
              className="form-input text-[11px] font-bold"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />
          </InputGroup>

          <InputGroup label="End Date *">
            <HiOutlineCalendarDays className="input-icon" />
            <input
              type="date"
              required
              className="form-input text-[11px] font-bold"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            />
          </InputGroup>
          {isEditing && (
            <>
              <InputGroup label="Status">
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


              <InputGroup label="Status Date">
                <HiOutlineCalendarDays className="input-icon" />
                <input
                  type="date"
                  className="form-input text-[11px] font-bold"
                  value={formData.statusChangedAt}
                  onChange={(e) => setFormData({ ...formData, statusChangedAt: e.target.value })}
                />
              </InputGroup>

              {activeTab === "all" && (
                <>
                  <InputGroup label="Invoice Number">
                    <HiOutlineUser className="input-icon" />
                    <input
                      className="form-input text-xs font-bold"
                      placeholder="Enter Invoice Number"
                      value={formData.invoiceNumber}
                      onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                    />
                  </InputGroup>

                  <InputGroup label="Invoice Date">
                    <HiOutlineCalendarDays className="input-icon" />
                    <input
                      type="date"
                      className="form-input text-[11px] font-bold"
                      value={formData.invoiceDate}
                      onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                    />
                  </InputGroup></>
              )}
            </>
          )}
        </div>
      </form>
    </CommonModal>
  );
}
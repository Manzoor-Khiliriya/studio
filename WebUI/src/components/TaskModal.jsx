import { useState, useEffect } from "react";
import { 
  HiOutlineDocumentText, HiOutlineUserGroup, 
  HiOutlineClock, HiOutlineCalendarDays, 
  HiOutlineHashtag, HiOutlineInformationCircle,
  HiCheckCircle, HiOutlineMagnifyingGlass,
  HiOutlineSquares2X2 // Added for Status icon
} from "react-icons/hi2";
import { CgSpinner } from "react-icons/cg";
import { toast } from "react-hot-toast";
import CommonModal, { InputGroup } from "./CommonModal";
import { useCreateTaskMutation, useUpdateTaskMutation } from "../services/taskApi";
import { useGetActiveEmployeesQuery } from "../services/employeeApi";

export default function TaskModal({ isOpen, onClose, editTask = null }) {
  const isEditing = !!editTask;
  const [searchTerm, setSearchTerm] = useState("");
  const [createTask, { isLoading: isCreating }] = useCreateTaskMutation();
  const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation();
  const { data: activeEmployees } = useGetActiveEmployeesQuery();

  const [formData, setFormData] = useState({
    title: "", projectNumber: "", assignedTo: [],
    allocatedTime: "8", startDate: "", endDate: "", projectDetails: "",
    status: "Pending" // Added default status
  });

  useEffect(() => {
    if (editTask && isOpen) {
      const assigneeIds = editTask.assignedTo?.map(emp => emp._id || emp) || [];
      setFormData({
        title: editTask.title || "",
        projectNumber: editTask.projectNumber || "",
        assignedTo: assigneeIds, 
        allocatedTime: String(editTask.allocatedTime || 8),
        startDate: editTask.startDate ? editTask.startDate.split('T')[0] : "",
        endDate: editTask.endDate ? editTask.endDate.split('T')[0] : "",
        projectDetails: editTask.projectDetails || "",
        status: editTask.status || "Pending", // Load status on edit
      });
    } else if (isOpen) {
      setFormData({
        title: "", projectNumber: "", assignedTo: [],
        allocatedTime: "8", startDate: "", endDate: "", projectDetails: "",
        status: "Pending"
      });
    }
  }, [editTask, isOpen]);

  // Filter Logic
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

    if (areAllVisibleSelected) {
      setFormData(prev => ({
        ...prev,
        assignedTo: prev.assignedTo.filter(id => !filteredIds.includes(id))
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        assignedTo: [...new Set([...prev.assignedTo, ...filteredIds])]
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.assignedTo.length === 0) return toast.error("Please assign at least one person");
    const loadingToast = toast.loading("Saving...");
    try {
      const payload = { ...formData, allocatedTime: Number(formData.allocatedTime) };
      isEditing ? await updateTask({ id: editTask._id, ...payload }).unwrap() : await createTask(payload).unwrap();
      toast.success("Saved successfully!", { id: loadingToast });
      onClose();
    } catch (err) {
      toast.error("Something went wrong", { id: loadingToast });
    }
  };

  return (
    <CommonModal
      isOpen={isOpen} onClose={onClose}
      title={isEditing ? "Edit Task" : "Create New Task"}
      subtitle={isEditing ? "Update details" : "Assign work to team"}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* ROW 1: NAME, ID & STATUS (If Editing) */}
        <div className={`grid grid-cols-1 ${isEditing ? 'md:grid-cols-6' : 'md:grid-cols-4'} gap-4`}>
          <div className={isEditing ? "md:col-span-3" : "md:col-span-3"}>
            <InputGroup label="Project Name">
              <HiOutlineDocumentText className="input-icon" />
              <input required className="form-input" placeholder="Enter name..."
                value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
            </InputGroup>
          </div>
          
          <div className={isEditing ? "md:col-span-1" : "md:col-span-1"}>
            <InputGroup label="ID">
              <HiOutlineHashtag className="input-icon" />
              <input required className="form-input uppercase" placeholder="ID"
                value={formData.projectNumber} onChange={(e) => setFormData({...formData, projectNumber: e.target.value})} />
            </InputGroup>
          </div>

          {/* STATUS SELECT FIELD - Only shown when editing */}
          {isEditing && (
            <div className="md:col-span-2">
              <InputGroup label="Status">
                <HiOutlineSquares2X2 className="input-icon" />
                <select 
                  className="form-input !pr-2"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </InputGroup>
            </div>
          )}
        </div>

        {/* TEAM SELECTION */}
        <div className="space-y-3 bg-slate-50 p-4 rounded-[1.5rem] border border-slate-100">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Team ({formData.assignedTo.length})
                </label>
                <button 
                  type="button"
                  onClick={handleSelectAll}
                  className="text-[9px] bg-white border border-slate-200 px-2 py-0.5 rounded uppercase font-bold hover:bg-orange-500 hover:text-white transition-colors"
                >
                  Select All
                </button>
            </div>
            <div className="relative w-1/2">
              <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text" placeholder="Search team..." 
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-full border border-slate-200 outline-none focus:border-orange-500 bg-white"
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
            {filteredEmployees?.map(emp => (
              <div 
                key={emp._id} onClick={() => toggleMember(emp._id)}
                className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all border-2 
                  ${formData.assignedTo.includes(emp._id) ? "bg-white border-orange-500 shadow-sm" : "bg-white/50 border-transparent hover:border-slate-200"}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-black
                    ${formData.assignedTo.includes(emp._id) ? "bg-orange-500 text-white" : "bg-slate-200 text-slate-500"}`}>
                    {emp.user.name.charAt(0)}
                  </div>
                  <div className="leading-tight">
                    <p className="text-xs font-bold text-slate-800">{emp.user.name}</p>
                    <p className="text-[9px] text-slate-400 uppercase">{emp.designation}</p>
                  </div>
                </div>
                {formData.assignedTo.includes(emp._id) && <HiCheckCircle className="text-orange-500" size={16} />}
              </div>
            ))}
          </div>
        </div>

        {/* TIME & DATES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InputGroup label="Work Hours">
            <HiOutlineClock className="input-icon" />
            <input required type="number" className="form-input" value={formData.allocatedTime}
              onChange={(e) => setFormData({...formData, allocatedTime: e.target.value})} />
          </InputGroup>
          <InputGroup label="Start Date">
            <HiOutlineCalendarDays className="input-icon" />
            <input required type="date" className="form-input" value={formData.startDate}
              onChange={(e) => setFormData({...formData, startDate: e.target.value})} />
          </InputGroup>
          <InputGroup label="End Date">
            <HiOutlineCalendarDays className="input-icon" />
            <input required type="date" className="form-input" value={formData.endDate}
              onChange={(e) => setFormData({...formData, endDate: e.target.value})} />
          </InputGroup>
        </div>

        {/* PROJECT DETAILS FIELD */}
        <InputGroup label="Project Details">
          <HiOutlineInformationCircle className="input-icon !top-5 translate-y-0" />
          <textarea
            rows={3}
            className="form-input !py-3 min-h-[90px] resize-none"
            placeholder="Add some notes about this task..."
            value={formData.projectDetails}
            onChange={(e) => setFormData({ ...formData, projectDetails: e.target.value })}
          />
        </InputGroup>

        <button
          disabled={isCreating || isUpdating}
          type="submit"
          className="w-full bg-slate-900 hover:bg-orange-600 text-white py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-3 active:scale-95 shadow-md cursor-pointer"
        >
          { (isCreating || isUpdating) ? <CgSpinner className="animate-spin" size={20} /> : (isEditing ? "Update Task" : "Create Task") }
        </button>
      </form>
    </CommonModal>
  );
}
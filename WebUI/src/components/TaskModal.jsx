import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  FiX, FiCheckCircle, FiHash, FiFileText,
  FiClock, FiCalendar, FiUsers, FiZap, FiTarget
} from "react-icons/fi";

// RTK Query Hooks
import { useGetAllEmployeesQuery } from "../services/employeeApi";
import { useCreateTaskMutation, useUpdateTaskMutation } from "../services/taskApi";

export default function TaskModal({ isOpen, onClose, editTask }) {
  const isEditMode = !!editTask;

  // --- API INTERFACE ---
  const { data: userData, isLoading: isLoadingEmployees } = useGetAllEmployeesQuery(undefined, { skip: !isOpen });
  const [createTask, { isLoading: isCreating }] = useCreateTaskMutation();
  const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation();

  const employees = userData?.employees || [];

  // --- FORM STATE ---
  const [form, setForm] = useState({
    title: "",
    projectNumber: "",
    projectDetails: "",
    assignedTo: [],
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    priority: "Medium",
    status: "Pending"
  });

  // --- SYNC PROTOCOL ---
  useEffect(() => {
    if (editTask && isOpen) {
      setForm({
        title: editTask.title || "",
        projectNumber: editTask.projectNumber || "",
        projectDetails: editTask.projectDetails || "",
        // Convert minutes from DB to Hours for UI
        allocatedTime: editTask.allocatedTime ? (editTask.allocatedTime / 60).toFixed(1) : "",
        assignedTo: editTask?.assignedTo?.map(w => w.employee?._id || w.employee) || [],
        startDate: editTask?.startDate?.split("T")[0] || "",
        endDate: editTask?.endDate?.split("T")[0] || "",
        priority: editTask?.priority || "Medium",
        status: editTask?.status || "Pending"
      });
    } else if (isOpen) {
      setForm({
        title: "",
        projectNumber: "",
        projectDetails: "",
        assignedTo: [],
        startDate: new Date().toISOString().split("T")[0],
        endDate: "",
        priority: "Medium",
      });
    }
  }, [editTask, isOpen]);

  const toggleEmployee = (id) => {
    setForm(prev => ({
      ...prev,
      assignedTo: prev.assignedTo.includes(id)
        ? prev.assignedTo.filter(e => e !== id)
        : [...prev.assignedTo, id]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.startDate || !form.endDate) {
      return toast.error("Start and End dates are required");
    }

    if (new Date(form.startDate) > new Date(form.endDate)) {
      return toast.error("End date must be after start date");
    }

    if (form.assignedTo.length === 0) return toast.error("Deployment requires at least one operator");

    const loadingToast = toast.loading(isEditMode ? "Modifying Parameters..." : "Initializing Deployment...");

    // Final conversion: Hours to Minutes for DB storage
    const submissionData = {
      title: form.title,
      projectNumber: form.projectNumber,
      projectDetails: form.projectDetails,
      assignedTo: form.assignedTo,
      startDate: form.startDate,
      endDate: form.endDate,
      priority: form.priority,
      ...(isEditMode && form.allocatedTime && {
        allocatedTime: parseFloat(form.allocatedTime) * 60
      })
    };

    try {
      if (isEditMode) {
        await updateTask({ id: editTask._id, ...submissionData }).unwrap();
        toast.success("Mission Intel Updated", { id: loadingToast });
      } else {
        await createTask(submissionData).unwrap();
        toast.success("Mission Successfully Deployed", { id: loadingToast });
      }
      onClose();
    } catch (err) {
      toast.error(err.data?.message || "Protocol Failure", { id: loadingToast });
    }
  };

  const isSubmitting = isCreating || isUpdating;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal Terminal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-3xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border border-slate-200"
          >
            {/* TERMINAL HEADER */}
            <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-5">
                <div className="bg-slate-900 p-3 rounded-2xl text-orange-500 shadow-xl shadow-slate-900/20">
                  <FiTarget size={24} />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-1">
                    {isEditMode ? "Update Mission" : "Assign Mission"}
                  </h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Operational Authorization Terminal</p>
                </div>
              </div>
              <button onClick={onClose} className="p-3 hover:bg-white rounded-xl transition-all text-slate-300 hover:text-rose-500">
                <FiX size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-10 overflow-y-auto max-h-[75vh] space-y-10 scrollbar-hide">

              {/* PRIMARY IDENTIFIERS */}
              <div className="grid md:grid-cols-12 gap-6">
                <div className="md:col-span-4 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Project Ref #</label>
                  <div className="relative group">
                    <FiHash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-500 transition-colors" />
                    <input
                      required value={form.projectNumber}
                      onChange={(e) => setForm({ ...form, projectNumber: e.target.value })}
                      placeholder="e.g. PJ-102"
                      className="w-full bg-slate-50 border-2 border-transparent focus:border-orange-500/20 focus:bg-white rounded-2xl pl-12 pr-4 py-4 font-black transition-all outline-none text-sm uppercase"
                    />
                  </div>
                </div>
                <div className="md:col-span-8 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mission Nomenclature</label>
                  <input
                    required value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Enter objective title..."
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-orange-500/20 focus:bg-white rounded-2xl px-6 py-4 font-bold transition-all outline-none text-sm"
                  />
                </div>
              </div>

              {/* RESOURCE BUDGETING */}
              <div className="grid md:grid-cols-3 gap-6 p-8 bg-orange-50/30 rounded-[2.5rem] border border-orange-100/50">
                {isEditMode && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-orange-600 uppercase tracking-widest ml-1">Allocated Budget (Hrs)</label>
                    <div className="relative">
                      <FiClock className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400" />
                      <input
                        type="number" step="0.5" required
                        value={form.allocatedTime}
                        onChange={(e) => setForm({ ...form, allocatedTime: e.target.value })}
                        className="w-full bg-white border-2 border-transparent focus:border-orange-500/20 rounded-2xl pl-12 pr-4 py-4 font-black outline-none text-sm text-orange-900"
                        placeholder="0.0"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Priority Level</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full bg-white border-2 border-transparent focus:border-orange-500/20 rounded-2xl px-6 py-4 font-black outline-none text-sm appearance-none cursor-pointer"
                  >
                    {["Low", "Medium", "High", "Critical"].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                {isEditMode && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Initial Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className="w-full bg-white border-2 border-transparent focus:border-orange-500/20 rounded-2xl px-6 py-4 font-black outline-none text-sm appearance-none cursor-pointer"
                    >
                      {["Pending", "In Progress", "Completed"].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {/* TIMELINE */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kickoff Date</label>
                  <div className="relative">
                    <FiCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="date" required value={form.startDate}
                      onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                      className="w-full bg-slate-50 border-2 border-transparent focus:border-orange-500/20 focus:bg-white rounded-2xl pl-12 pr-4 py-4 font-bold outline-none text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hard Deadline</label>
                  <div className="relative">
                    <FiCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="date" required value={form.endDate}
                      onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                      className="w-full bg-slate-50 border-2 border-transparent focus:border-orange-500/20 focus:bg-white rounded-2xl pl-12 pr-4 py-4 font-bold outline-none text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* MISSION BRIEF */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Operational Briefing</label>
                <div className="relative group">
                  <FiFileText className="absolute left-5 top-5 text-slate-300 group-focus-within:text-orange-500 transition-colors" />
                  <textarea
                    rows={3} value={form.projectDetails}
                    onChange={(e) => setForm({ ...form, projectDetails: e.target.value })}
                    placeholder="Input detailed constraints and mission parameters..."
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-orange-500/20 focus:bg-white rounded-[2rem] pl-14 pr-8 py-5 font-medium transition-all outline-none resize-none text-sm leading-relaxed"
                  />
                </div>
              </div>

              {/* OPERATOR ASSIGNMENT */}
              <div className="space-y-4">
                <div className="flex justify-between items-end px-1">
                  <label className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                    <FiUsers className="text-orange-500" /> Authorized Operators
                  </label>
                  <span className="text-[9px] font-black text-orange-600 bg-orange-100 px-3 py-1 rounded-full uppercase">
                    {form.assignedTo.length} Personnel Selected
                  </span>
                </div>
                <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 flex flex-wrap gap-2">
                  {isLoadingEmployees ? (
                    <div className="w-full text-center py-4 text-slate-400 font-black text-[10px] uppercase animate-pulse">Synchronizing Personnel Hub...</div>
                  ) : (
                    employees.map(emp => (
                      <button
                        type="button" key={emp._id}
                        onClick={() => toggleEmployee(emp._id)}
                        className={`px-6 py-3 rounded-2xl text-[11px] font-black transition-all flex items-center gap-3 border-2 ${form.assignedTo.includes(emp._id)
                          ? "bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-900/20"
                          : "bg-white border-slate-100 text-slate-500 hover:border-orange-200 hover:text-slate-800"
                          }`}
                      >
                        {form.assignedTo.includes(emp._id) && <FiCheckCircle size={14} className="text-orange-400" />}
                        {emp.user.name}
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* AUTHORIZATION FOOTER */}
              <div className="pt-6 border-t border-slate-50">
                <button
                  disabled={isSubmitting}
                  className="group w-full py-6 rounded-[2.5rem] font-black bg-slate-900 text-white hover:bg-orange-600 transition-all shadow-2xl shadow-slate-900/10 disabled:opacity-50 uppercase tracking-[0.4em] text-xs flex items-center justify-center gap-4"
                >
                  {isSubmitting ? (
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  ) : (
                    <>
                      <FiZap className="group-hover:scale-125 transition-transform" size={18} />
                      {isEditMode ? "Commit Intelligence Changes" : "Authorize Project Deployment"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
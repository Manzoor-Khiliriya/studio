import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import API from "../services/apiSlice";
// import { apiSlice } from "../services/apiSlices";
import { toast } from "react-hot-toast";
import { FiX, FiCheckCircle, FiCalendar, FiHash, FiFileText, FiClock } from "react-icons/fi";

export default function TaskModal({ isOpen, onClose, onTaskCreated, editTask }) {
  const isEditMode = !!editTask;

  const [form, setForm] = useState({
    title: "",
    projectNumber: "",
    projectDetails: "",
    allocatedTime: "", // New State
    assignedTo: [],
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    priority: "Medium"
  });

  const [employees, setEmployees] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editTask) {
      setForm({
        title: editTask.title,
        projectNumber: editTask.projectNumber || "",
        projectDetails: editTask.projectDetails || "",
        allocatedTime: editTask.allocatedTime ? editTask.allocatedTime / 60 : "",
        assignedTo: editTask?.assignedTo?.map(w => w.employee?._id || w.employee) || [],
        startDate: editTask?.startDate?.split("T")[0] || "",
        endDate: editTask?.endDate?.split("T")[0] || "",
        priority: editTask?.priority || "Medium"
      });
    } else {
      setForm({
        title: "",
        projectNumber: "",
        projectDetails: "",
        allocatedTime: "",
        assignedTo: [],
        startDate: new Date().toISOString().split("T")[0],
        endDate: "",
        priority: "Medium"
      });
    }
  }, [editTask, isOpen]);

  useEffect(() => {
    if (isOpen) fetchEmployees();
  }, [isOpen]);

  const fetchEmployees = async () => {
    try {
      const res = await API.get("/users");

      // Access the employees property from the response object
      const employeeList = res.data.employees || [];

      // Set the state
      setEmployees(employeeList);

      // Note: You don't need .filter(u => u.role === "Employee") anymore
      // because your backend controller already does: let query = { role: "Employee" };
    } catch (err) {
      console.error("Employee Fetch Error:", err);
      toast.error("Employee list sync failed");
    }
  };

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
    if (form.assignedTo.length === 0) return toast.error("Assign at least one employee");

    // Date Logic Validation
    const start = new Date(form.startDate).getTime();
    const end = new Date(form.endDate).getTime();
    if (end < start) return toast.error("End date cannot be before start date");

    setIsSubmitting(true);
    try {
      if (isEditMode) {
        await API.put(`/tasks/${editTask._id}`, form);
        toast.success("Task updated successfully");
      } else {
        await API.post("/tasks", form);
        toast.success("Project deployed successfully");
      }
      onTaskCreated();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100]" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 m-auto w-full max-w-2xl h-fit max-h-[95vh] bg-white rounded-[3rem] shadow-2xl z-[101] overflow-hidden flex flex-col border border-orange-100"
          >
            {/* HEADER */}
            <div className="px-10 py-6 bg-orange-50/50 border-b border-orange-100 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-slate-900">{isEditMode ? "Modify Task" : "Deploy Task"}</h2>
                <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mt-1">Resource Allocation Mode</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-orange-100 rounded-full text-slate-400"><FiX size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-10 overflow-y-auto space-y-6 custom-scrollbar">

              {/* PROJECT INFO */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Project #</label>
                  <div className="relative">
                    <FiHash className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500" />
                    <input required value={form.projectNumber} onChange={(e) => setForm({ ...form, projectNumber: e.target.value })} placeholder="PJ-101" className="w-full bg-slate-50 border-2 border-slate-50 focus:border-orange-500 focus:bg-white rounded-xl pl-10 pr-4 py-3.5 font-bold transition-all outline-none" />
                  </div>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Mission Title</label>
                  <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Database Migration" className="w-full bg-slate-50 border-2 border-slate-50 focus:border-orange-500 focus:bg-white rounded-xl px-5 py-3.5 font-bold transition-all outline-none" />
                </div>
              </div>

              {/* SCOPE */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Project Scope</label>
                <div className="relative">
                  <FiFileText className="absolute left-4 top-4 text-slate-400" />
                  <textarea rows={2} value={form.projectDetails} onChange={(e) => setForm({ ...form, projectDetails: e.target.value })} placeholder="Mission objectives..." className="w-full bg-slate-50 border-2 border-slate-50 focus:border-orange-500 focus:bg-white rounded-2xl pl-10 pr-5 py-3.5 font-bold transition-all outline-none resize-none" />
                </div>
              </div>

              {/* DATES & ALLOCATED TIME */}
              <div className={`grid ${isEditMode ? "md:grid-cols-3" : "md:grid-cols-2"} gap-4`}>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Start Date</label>
                  <input type="date" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full bg-slate-50 border-2 border-slate-50 focus:border-orange-500 focus:bg-white rounded-xl px-4 py-3.5 font-bold outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">End Date</label>
                  <input type="date" required value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="w-full bg-slate-50 border-2 border-slate-50 focus:border-orange-500 focus:bg-white rounded-xl px-4 py-3.5 font-bold outline-none" />
                </div>
                {/* In TaskModal.jsx */}
                {isEditMode && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-orange-600 uppercase ml-1 tracking-widest">
                      Final Allocated Hours
                    </label>
                    <div className="relative">
                      <FiClock className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500" />
                      <input
                        type="number"
                        value={form.allocatedTime}
                        onChange={(e) => setForm({ ...form, allocatedTime: e.target.value })}
                        className="w-full bg-orange-50 border-2 border-orange-100 rounded-xl pl-10 pr-4 py-3.5 font-bold"
                      />
                    </div>
                    <p className="text-[9px] text-slate-400 mt-1 italic">
                      System Suggestion: {editTask.estimatedTime / 60}h (Business days only)
                    </p>
                  </div>
                )}
              </div>

              {/* PERSONNEL */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Personnel Allocation</label>
                <div className="bg-slate-50 p-4 rounded-[2rem] border border-slate-100 flex flex-wrap gap-2">
                  {employees.map(emp => (
                    <button
                      type="button" key={emp._id} onClick={() => toggleEmployee(emp._id)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 border-2 ${form.assignedTo.includes(emp._id) ? "bg-orange-600 border-orange-600 text-white shadow-md" : "bg-white border-transparent text-slate-500 hover:border-orange-200"
                        }`}
                    >
                      {form.assignedTo.includes(emp._id) && <FiCheckCircle />} {emp.name}
                    </button>
                  ))}
                </div>
              </div>

              <button disabled={isSubmitting} className="w-full py-5 rounded-[2rem] font-black bg-slate-900 text-white hover:bg-orange-600 transition-all shadow-xl disabled:opacity-50 uppercase tracking-[0.2em] text-xs">
                {isSubmitting ? "Syncing..." : isEditMode ? "Update Operation" : "Authorize Deployment"}
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
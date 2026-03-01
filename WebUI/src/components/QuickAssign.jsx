import { useState, useMemo } from "react";
import { 
  HiOutlineUserPlus, 
  HiOutlineXMark, 
  HiOutlineMagnifyingGlass,
  HiCheckCircle 
} from "react-icons/hi2";
import { CgSpinner } from "react-icons/cg";
import { useUpdateTaskMutation } from "../services/taskApi";
import { useGetActiveEmployeesQuery } from "../services/employeeApi";
import { toast } from "react-hot-toast";

export default function QuickAssign({ task }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: employees, isLoading: loadingEmps } = useGetActiveEmployeesQuery();
  const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation();

  // 1. Filter Logic
  const filteredEmployees = useMemo(() => {
    if (!employees) return [];
    return employees.filter(emp => 
      emp.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.designation?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [employees, searchTerm]);

  // 2. Toggle Assignment Logic
  const toggleAssignment = async (employeeId) => {
    // Standardize IDs (handles both populated objects and raw strings)
    const currentIds = task.assignedTo?.map(a => a._id || a) || [];
    const isAssigned = currentIds.includes(employeeId);

    const newIds = isAssigned
      ? currentIds.filter(id => id !== employeeId)
      : [...currentIds, employeeId];

    try {
      await updateTask({
        id: task._id,
        assignedTo: newIds
      }).unwrap();
      
      toast.success(isAssigned ? "Removed from team" : "Added to team");
    } catch (err) {
      toast.error(err.data?.message || "Update failed");
    }
  };

  return (
    <div className="relative inline-block">
      {/* Trigger Button */}
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`p-1.5 rounded-full border-2 transition-all flex items-center justify-center
          ${isOpen ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-dashed border-slate-300 text-slate-400 hover:border-orange-400 hover:text-orange-500'}`}
      >
        <HiOutlineUserPlus size={18} />
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <>
          {/* Backdrop to close on click outside */}
          <div className="fixed inset-0 z-40" onClick={() => {setIsOpen(false); setSearchTerm("");}} />
          
          <div className="absolute top-full left-0 mt-3 w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden ring-4 ring-black/5 animate-in fade-in zoom-in duration-150">
            
            {/* Header & Search */}
            <div className="p-3 bg-slate-50 border-b border-slate-100">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Manage Team</span>
                {isUpdating && <CgSpinner className="animate-spin text-orange-500" size={14} />}
              </div>
              
              <div className="relative">
                <HiOutlineMagnifyingGlass className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input 
                  autoFocus
                  type="text"
                  placeholder="Filter by name..."
                  className="w-full pl-8 pr-3 py-1.5 text-[11px] rounded-lg border border-slate-200 focus:border-orange-500 outline-none transition-all shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Employee List */}
            <div className="max-h-60 overflow-y-auto p-1 custom-scrollbar">
              {loadingEmps ? (
                <div className="p-4 text-center"><CgSpinner className="animate-spin mx-auto text-slate-300" /></div>
              ) : filteredEmployees.length === 0 ? (
                <div className="p-4 text-center text-[10px] text-slate-400 uppercase font-bold">No members found</div>
              ) : (
                filteredEmployees.map(emp => {
                  const isAssigned = task.assignedTo?.some(a => (a._id || a) === emp._id);
                  return (
                    <div 
                      key={emp._id}
                      onClick={() => toggleAssignment(emp._id)}
                      className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all mb-1 group
                        ${isAssigned ? "bg-orange-50 border border-orange-100" : "hover:bg-slate-50 border border-transparent"}`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black transition-colors
                          ${isAssigned ? "bg-orange-500 text-white" : "bg-slate-200 text-slate-500 group-hover:bg-slate-300"}`}>
                          {emp.user?.name?.charAt(0)}
                        </div>
                        <div className="leading-tight">
                          <p className={`text-[11px] font-bold uppercase tracking-tighter ${isAssigned ? 'text-orange-900' : 'text-slate-700'}`}>
                            {emp.user?.name}
                          </p>
                          <p className="text-[9px] text-slate-400 font-medium">{emp.designation}</p>
                        </div>
                      </div>

                      {/* Status Icon */}
                      {isAssigned ? (
                        <div className="bg-white p-1 rounded-md shadow-sm border border-orange-200">
                           <HiOutlineXMark className="text-orange-600" size={12} />
                        </div>
                      ) : (
                        <HiOutlineUserPlus className="text-slate-300 group-hover:text-orange-400 transition-colors" size={14} />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
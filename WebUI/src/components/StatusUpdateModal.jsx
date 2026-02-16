import React, { useState, useEffect } from "react";
import CommonModal, { InputGroup } from "./CommonModal";
import { HiOutlineSquares2X2, HiOutlineArrowPath } from "react-icons/hi2";
// UPDATED: Using the specific status update mutation
import { useUpdateTaskStatusMutation } from "../services/taskApi"; 
import { toast } from "react-hot-toast";

export default function StatusUpdateModal({ isOpen, onClose, task }) {
  // Use the new status-specific mutation
  const [updateStatus, { isLoading }] = useUpdateTaskStatusMutation();
  const [status, setStatus] = useState("");
  const [activeStatus, setActiveStatus] = useState("");

  useEffect(() => {
    if (task) {
      setStatus(task.status);
      setActiveStatus(task.activeStatus || "Draft-1");
    }
  }, [task]);

  const handleUpdate = async () => {
    try {
      await updateStatus({ 
        id: task._id, 
        status, 
        activeStatus 
      }).unwrap();
      
      toast.success("Mission status updated!");
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to update status");
    }
  };

  return (
    <CommonModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Mission Progress" 
      subtitle={`Update status for ${task?.projectNumber}`}
      maxWidth="max-w-md"
    >
      <div className="space-y-6 pt-2">
        <InputGroup label="Active Version">
          <HiOutlineSquares2X2 className="input-icon" />
          <select 
            className="form-input font-black uppercase text-xs"
            value={activeStatus}
            onChange={(e) => setActiveStatus(e.target.value)}
          >
            {["Draft-1", "Draft-2", "Draft-3", "Draft-4", "Draft-5", "Pre-Final", "Final"].map(v => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </InputGroup>

        <InputGroup label="Operational Status">
          <HiOutlineArrowPath className="input-icon" />
          <select 
            className="form-input font-bold text-xs"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {[
              "To be started", 
              "In progress", 
              "On hold", 
              "Feedback pending", 
              "Final rendering", 
              "Postproduction", 
              "Completed", 
            ].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </InputGroup>

        <button
          onClick={handleUpdate}
          disabled={isLoading}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-orange-200 disabled:opacity-50"
        >
          {isLoading ? "Synchronizing..." : "Synchronize Status"}
        </button>
      </div>
    </CommonModal>
  );
}
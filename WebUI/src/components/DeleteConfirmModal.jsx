import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineExclamationTriangle, HiOutlineXMark, HiOutlineShieldExclamation } from "react-icons/hi2";
import toast from "react-hot-toast";

export default function DeleteConfirmModal({ isOpen, onClose, employeeName, onConfirm }) {
  const [typedName, setTypedName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Reset input when modal closes or opens for a different employee
  useEffect(() => {
    if (!isOpen) setTypedName("");
  }, [isOpen, employeeName]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      // Success toast is usually handled in the parent's onConfirm, 
      // but keeping it here as a fallback is fine.
      onClose();
    } catch (err) {
      toast.error("Failed to deactivate user.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl overflow-hidden p-10 sm:p-14"
          >
            {/* Top Warning Stripe */}
            <div className="absolute top-0 left-0 w-full h-2 bg-rose-500" />

            <div className="flex flex-col items-center text-center">
              {/* Warning Icon */}
              <div className="w-24 h-24 bg-rose-50 rounded-[2.5rem] flex items-center justify-center text-rose-500 mb-8">
                <HiOutlineExclamationTriangle size={48} />
              </div>

              <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-3">Restrict Access?</h2>
              <p className="text-slate-500 font-medium leading-relaxed mb-10">
                You are deactivating <span className="text-slate-900 font-black underline decoration-rose-200 uppercase tracking-tight">{employeeName}</span>. 
                They will lose all dashboard privileges immediately.
              </p>

              {/* Security Verification Input */}
              <div className="w-full space-y-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-rose-500 ml-1">
                    Type name to confirm
                  </label>
                  <input 
                    type="text"
                    placeholder={employeeName}
                    value={typedName}
                    onChange={(e) => setTypedName(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-transparent rounded-[1.5rem] px-6 py-5 text-sm font-bold focus:bg-white focus:border-rose-500 focus:ring-4 focus:ring-rose-500/5 outline-none transition-all text-center placeholder:opacity-30"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full">
                  <button 
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-5 rounded-[1.5rem] font-black text-slate-400 hover:bg-slate-100 transition-all active:scale-95"
                  >
                    Keep Active
                  </button>
                  <button 
                    disabled={typedName !== employeeName || isDeleting}
                    onClick={handleDelete}
                    className="flex-[1.5] flex items-center justify-center gap-2 py-5 rounded-[1.5rem] font-black bg-rose-600 text-white hover:bg-rose-700 transition-all shadow-xl shadow-rose-200 disabled:bg-slate-100 disabled:text-slate-300 disabled:shadow-none active:scale-95"
                  >
                    {isDeleting ? (
                      <span className="animate-pulse">Processing...</span>
                    ) : (
                      <>
                        <HiOutlineShieldExclamation size={20} /> 
                        <span>Deactivate Team Member</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Close Icon Button */}
            <button 
              onClick={onClose}
              className="absolute top-8 right-8 p-2 text-slate-300 hover:text-rose-500 transition-colors"
            >
              <HiOutlineXMark size={24} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
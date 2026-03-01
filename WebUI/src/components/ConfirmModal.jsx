import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { 
  HiOutlineExclamationTriangle, 
  HiOutlineXMark, 
  HiOutlineShieldExclamation, 
  HiOutlineInformationCircle,
  HiOutlineCheckCircle
} from "react-icons/hi2";

export default function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "Confirm", 
  variant = "danger", 
  isLoading = false,
  requireVerification = false,
  verificationName = ""
}) {
  const [userInput, setUserInput] = useState("");

  // Reset input when modal opens/closes
  useEffect(() => { if (!isOpen) setUserInput(""); }, [isOpen]);

  // 1. Initialize Variant Configuration
  const variantConfig = {
    danger: {
      icon: <HiOutlineShieldExclamation size={32} />,
      bg: "bg-rose-50 text-rose-600",
      btn: "bg-rose-600 hover:bg-rose-700 shadow-rose-100 border-rose-800"
    },
    warning: {
      icon: <HiOutlineExclamationTriangle size={32} />,
      bg: "bg-amber-50 text-amber-600",
      btn: "bg-amber-500 hover:bg-amber-600 shadow-amber-100 border-amber-700"
    },
    info: {
      icon: <HiOutlineInformationCircle size={32} />,
      bg: "bg-blue-50 text-blue-600",
      btn: "bg-blue-600 hover:bg-blue-700 shadow-blue-100 border-blue-800"
    },
    success: {
      icon: <HiOutlineCheckCircle size={32} />,
      bg: "bg-emerald-50 text-emerald-600",
      btn: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100 border-emerald-800"
    }
  };

  const active = variantConfig[variant] || variantConfig.danger;
  const isVerified = !requireVerification || userInput.toLowerCase() === verificationName?.toLowerCase();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
          
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden p-8 border border-slate-100">
            <div className="flex flex-col items-center text-center">
              
              {/* Dynamic Icon Container */}
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${active.bg}`}>
                {active.icon}
              </div>

              <h2 className="text-xl font-black text-slate-800 tracking-tight mb-2 uppercase italic">{title}</h2>
              <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest leading-relaxed mb-6 px-2">{message}</p>

              {requireVerification && (
                <div className="w-full mb-6 space-y-3">
                  <p className="text-[9px] font-black text-slate-400 uppercase">Type <span className="text-rose-600 underline">{verificationName}</span> to verify</p>
                  <input
                    autoFocus
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none focus:border-rose-500 transition-all font-bold text-sm text-center"
                    placeholder="Enter name..."
                  />
                </div>
              )}

              <div className="flex gap-3 w-full">
                <button 
                  disabled={isLoading || !isVerified} 
                  onClick={onConfirm} 
                  className={`flex-1 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border-b-4 text-white ${active.btn} ${(!isVerified || isLoading) ? 'opacity-50 grayscale cursor-not-allowed' : 'active:scale-95 cursor-pointer'}`}
                >
                  {isLoading ? "Processing..." : confirmText}
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-4 rounded-xl font-black text-white text-[10px] uppercase tracking-widest bg-slate-400 hover:bg-slate-500 transition-all active:scale-95 border-b-4 shadow-slate-100 border-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>

            <button onClick={onClose} className="absolute top-5 right-5 p-2 text-slate-300 hover:text-slate-900 hover:rotate-90 transition-all duration-300 cursor-pointer">
              <HiOutlineXMark size={20} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
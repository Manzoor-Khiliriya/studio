import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  HiOutlineExclamationTriangle, 
  HiOutlineXMark, 
  HiOutlineShieldExclamation,
  HiOutlineLockClosed
} from "react-icons/hi2";
import toast from "react-hot-toast";

export default function DeleteConfirmModal({ isOpen, onClose, employeeName, onConfirm }) {
  const [typedName, setTypedName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasAttempted, setHasAttempted] = useState(false);

  // Sync state with visibility
  useEffect(() => {
    if (isOpen) {
      setTypedName("");
      setHasAttempted(false);
    }
  }, [isOpen]);

  const isMatch = typedName.trim().toLowerCase() === employeeName?.trim().toLowerCase();

  const handleDelete = async () => {
    if (!isMatch) {
      setHasAttempted(true);
      return;
    }

    setIsDeleting(true);
    const loadingToast = toast.loading(`Revoking access for ${employeeName}...`);
    
    try {
      await onConfirm();
      toast.success("Personnel record deactivated.", { id: loadingToast });
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || "Deactivation protocol failed.", { id: loadingToast });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
          {/* CRITICAL BACKDROP */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          />

          {/* WARNING TERMINAL */}
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 30 }}
            className="relative bg-white w-full max-w-xl rounded-[4rem] shadow-[0_35px_60px_-15px_rgba(225,29,72,0.3)] overflow-hidden p-12 lg:p-16 border border-rose-100"
          >
            {/* ALERT STRIPE */}
            <div className="absolute top-0 left-0 w-full h-3 bg-rose-600 animate-pulse" />

            <div className="flex flex-col items-center text-center">
              {/* WARNING ICON */}
              <div className="w-28 h-28 bg-rose-50 rounded-[3rem] flex items-center justify-center text-rose-600 mb-10 shadow-inner">
                <HiOutlineExclamationTriangle size={56} className="animate-bounce-slow" />
              </div>

              <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-4 uppercase italic">
                Revoke Privileges?
              </h2>
              <p className="text-slate-500 font-bold leading-relaxed mb-12 text-sm uppercase tracking-wide">
                You are about to deactivate <span className="text-rose-600 font-black px-2 py-1 bg-rose-50 rounded-lg">{employeeName}</span>. 
                This will terminate their operational access and freeze their time-ledger immediately.
              </p>

              {/* SECURITY INPUT */}
              <div className="w-full space-y-8">
                <div className="space-y-3">
                  <div className="flex justify-between items-end px-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-500 flex items-center gap-2">
                       Verification Required
                    </label>
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Type Full Name</span>
                  </div>
                  
                  <input 
                    type="text"
                    placeholder={employeeName}
                    value={typedName}
                    onChange={(e) => setTypedName(e.target.value)}
                    className={`w-full bg-slate-50 border-2 rounded-[2rem] px-8 py-6 text-sm font-black text-center transition-all outline-none placeholder:opacity-20 tabular-nums ${
                      hasAttempted && !isMatch 
                      ? 'border-rose-500 bg-rose-50/50 animate-shake' 
                      : isMatch 
                      ? 'border-emerald-500 bg-emerald-50/30' 
                      : 'border-transparent focus:border-slate-900'
                    }`}
                  />
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex flex-col sm:flex-row gap-5 w-full pt-4">
                  <button 
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-6 rounded-3xl font-black text-slate-400 text-[10px] uppercase tracking-[0.3em] hover:bg-slate-50 transition-all active:scale-95"
                  >
                    Abort Protocol
                  </button>
                  
                  <button 
                    disabled={isDeleting}
                    onClick={handleDelete}
                    className={`flex-[1.5] flex items-center justify-center gap-3 py-6 rounded-3xl font-black text-[10px] uppercase tracking-[0.3em] transition-all shadow-2xl active:scale-95 border-b-4 ${
                      isMatch 
                      ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-rose-200 border-rose-900' 
                      : 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed shadow-none'
                    }`}
                  >
                    {isDeleting ? (
                      <span className="animate-pulse">Processing...</span>
                    ) : (
                      <>
                        <HiOutlineShieldExclamation size={20} /> 
                        <span>Confirm Deactivation</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* EXIT ESCAPE */}
            <button 
              onClick={onClose}
              className="absolute top-10 right-10 p-3 text-slate-300 hover:text-slate-900 transition-colors bg-slate-50 rounded-2xl"
            >
              <HiOutlineXMark size={24} />
            </button>
            
            {/* DECORATIVE LOCK */}
            <HiOutlineLockClosed className="absolute -bottom-10 -left-10 text-slate-100 opacity-20 pointer-events-none" size={200} />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
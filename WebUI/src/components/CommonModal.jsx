import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineXMark } from "react-icons/hi2";

export default function CommonModal({ isOpen, onClose, title, subtitle, children, maxWidth = "max-w-xl" }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 py-5 flex items-center justify-center z-50 p-4">
          {/* BACKDROP */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* MODAL CONTAINER */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className={`relative bg-white w-full ${maxWidth} rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[70vh]`}
          >
            {/* HEADER */}
            <div className="px-8 py-6 flex justify-between items-center border-b border-slate-50">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
                {subtitle && (
                  <p className="text-[11px] font-bold text-orange-500 uppercase tracking-widest mt-0.5">
                    {subtitle}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl transition-all text-slate-500 hover:text-slate-900 hover:rotate-90 cursor-pointer"
              >
                <HiOutlineXMark size={20} />
              </button>
            </div>

            {/* CONTENT AREA */}
            <div className="p-8 overflow-y-auto custom-scrollbar">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// Keep your Helper Component here or in a separate UI file
export function InputGroup({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5 relative group">
      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">
        {label}
      </label>
      <div className="relative">
        {children}
      </div>
    </div>
  );
}
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineXMark } from "react-icons/hi2";

export default function CommonModal({ isOpen, onClose, title, subtitle, children, maxWidth = "max-w-xl", onSubmit,
  submitText = "Submit", cancelText = "Cancel", isLoading = false }) {
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
            className={`relative bg-white w-full ${maxWidth} rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh]`}
          >
            {/* HEADER */}
            <div className="p-5 flex justify-between items-center border-b border-slate-300">
              <div>
                <h2 className="text-3xl font-bold text-slate-900">{title}</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl transition-all text-slate-500 hover:text-slate-900 hover:rotate-90 cursor-pointer"
              >
                <HiOutlineXMark size={20} />
              </button>
            </div>

            {/* CONTENT AREA */}
            <div className="p-5 overflow-y-auto custom-scrollbar">
              {children}
            </div>

            {/* FOOTER */}
            <div className="p-5 py-5 border-t border-slate-300 flex items-center justify-between w-full gap-3">
              <button
                onClick={onSubmit}
                disabled={isLoading}
                className="block w-full cursor-pointer py-3 rounded-xl text-white uppercase bg-green-500 hover:bg-green-600 font-black text-[12px] tracking-widest active:scale-95 border-b-4  border-green-700  transition-all shadow-lg shadow-orange-200"
              >
                {isLoading ? "Processing..." : submitText}
              </button>

              <button
                onClick={onClose}
                className="block my-auto w-full py-3 rounded-xl font-black text-white text-[12px] uppercase tracking-widest bg-slate-500 hover:bg-slate-600 transition-all active:scale-95 border-b-4 shadow-slate-200 border-slate-700 cursor-pointer"
              >
                {cancelText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function InputGroup({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5 relative group">
      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-0.5">
        {label}
      </label>
      <div className="relative">
        {children}
      </div>
    </div>
  );
}
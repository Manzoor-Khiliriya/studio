import { BiLoaderAlt } from 'react-icons/bi';
import { motion } from 'framer-motion';

export default function Loader({ message = "Synchronizing Systems..." }) {
  return (
    <div className="h-[70vh] w-full flex flex-col items-center justify-center gap-8 relative overflow-hidden">
      
      {/* DECORATIVE BACKGROUND RADIAL */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-orange-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* CORE SPINNER */}
      <div className="relative">
        {/* Outer Ring */}
        <div className="absolute inset-0 scale-150 opacity-10">
          <BiLoaderAlt className="animate-spin-slow text-orange-600" size={48} />
        </div>
        
        {/* Main Spinner */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="text-orange-500 relative z-10"
        >
          <BiLoaderAlt size={56} />
        </motion.div>
      </div>

      {/* PROTOCOL MESSAGE */}
      <div className="flex flex-col items-center gap-2">
        <motion.p 
          initial={{ opacity: 0.5 }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="font-black uppercase tracking-[0.5em] text-[11px] text-slate-900 italic"
        >
          {message}
        </motion.p>
        
        {/* PROGRESS BAR SIMULATION */}
        <div className="w-32 h-1 bg-slate-100 rounded-full overflow-hidden relative">
          <motion.div 
            initial={{ left: "-100%" }}
            animate={{ left: "100%" }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            className="absolute top-0 bottom-0 w-1/2 bg-orange-500 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.5)]"
          />
        </div>
      </div>

      {/* SYSTEM META */}
      <p className="absolute bottom-10 text-[8px] font-black text-slate-300 uppercase tracking-widest">
        Secure Terminal Connection Active
      </p>
    </div>
  );
}
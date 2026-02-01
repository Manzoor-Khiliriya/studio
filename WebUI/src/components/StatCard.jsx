import { motion } from 'framer-motion';

export default function StatCard({ icon, label, value, delay = 0, variant = "default" }) {
  const themes = {
    active: "border-orange-200 bg-white shadow-orange-600/5 shadow-xl",
    warning: "border-rose-100 bg-white shadow-rose-600/5 shadow-xl",
    default: "border-slate-50 bg-white shadow-sm hover:border-orange-100"
  };

  const iconThemes = {
    active: "bg-orange-600 text-white shadow-orange-600/30",
    warning: "bg-rose-500 text-white shadow-rose-500/30",
    default: "bg-slate-50 text-slate-400"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={`p-6 rounded-[2.5rem] border-2 flex items-center gap-5 transition-all duration-500 ${themes[variant]}`}
    >
      <div className={`p-4 rounded-2xl flex items-center justify-center ${iconThemes[variant]}`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{label}</p>
        <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{value}</h3>
      </div>
    </motion.div>
  );
}
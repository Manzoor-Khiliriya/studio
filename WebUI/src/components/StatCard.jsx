import { motion } from 'framer-motion';

export default function StatCard({
  icon,
  label,
  onClick,
  value,
  delay = 0,
  variant = "default",
}) {
  const themes = {
    active: "border-orange-200 bg-white shadow-orange-600/5 shadow-xl",
    warning: "border-rose-100 bg-white shadow-rose-600/5 shadow-xl",
    default: "border-slate-50 bg-white shadow-sm hover:border-orange-100",
  };

  const iconThemes = {
    active: "bg-orange-600 text-white shadow-orange-600/30",
    warning: "bg-rose-500 text-white shadow-rose-500/30",
    default: "bg-slate-50 text-slate-400",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      onClick={onClick}
      className={`
        p-4 sm:p-5 lg:p-6
        rounded-2xl sm:rounded-[2rem]
        cursor-pointer
        border-2
        flex items-center
        gap-3 sm:gap-4 lg:gap-5
        transition-all duration-500
        min-w-0
        ${themes[variant]}
      `}
    >
      <div
        className={`
          p-3 sm:p-3.5 lg:p-4
          rounded-xl sm:rounded-2xl
          flex items-center justify-center
          shrink-0
          ${iconThemes[variant]}
        `}
      >
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 truncate">
          {label}
        </p>

        <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter truncate">
          {value}
        </h3>
      </div>
    </motion.div>
  );
}
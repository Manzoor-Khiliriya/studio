import { motion } from "framer-motion";

export default function FloatingTimer({ seconds, isRunning, isBreak }) {
  if (!isRunning && !isBreak) return null; // ❌ hide when no task

  const formatTime = (sec) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <motion.div
      drag
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      className={`fixed bottom-6 right-6 z-50 px-5 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border cursor-move
        ${isBreak
          ? "bg-slate-900 text-orange-400 border-slate-700"
          : "bg-black text-emerald-400 border-emerald-500/20"}
      `}
    >
      <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">
        {isBreak ? "On Break" : "Today's Work"}
      </p>

      <h3 className="text-2xl font-black tabular-nums">
        {formatTime(seconds)}
      </h3>
    </motion.div>
  );
}
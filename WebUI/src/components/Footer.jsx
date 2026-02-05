import { FiLifeBuoy, FiBookOpen, FiShield } from "react-icons/fi";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto py-8 px-6 border-t border-orange-100 bg-white/50 backdrop-blur-sm relative z-10">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        
        {/* LEFT: BRANDING & SYSTEM INFO */}
        <div className="flex flex-col items-center md:items-start gap-1">
          <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
            © {currentYear} <span className="text-orange-600 font-black">WorkFlow</span> v2.4.0
          </p>
          <div className="flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
              Enterprise Node: <span className="text-slate-500">v2.4.0-Stable</span>
            </p>
          </div>
        </div>

        {/* CENTER: QUICK LINKS (Using your imported icons) */}
        <div className="flex items-center gap-6">
          <a href="#" className="flex items-center gap-2 text-slate-400 hover:text-orange-600 transition-colors group">
            <FiLifeBuoy className="text-sm group-hover:rotate-12 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest">Support</span>
          </a>
          <a href="#" className="flex items-center gap-2 text-slate-400 hover:text-orange-600 transition-colors group">
            <FiBookOpen className="text-sm group-hover:rotate-12 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest">Docs</span>
          </a>
          <a href="#" className="flex items-center gap-2 text-slate-400 hover:text-orange-600 transition-colors group">
            <FiShield className="text-sm group-hover:rotate-12 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest">Security</span>
          </a>
        </div>

        {/* RIGHT: LIVE STATUS INDICATOR */}
        <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-full border border-orange-100 shadow-sm shadow-orange-500/5">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </div>
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.1em]">
            Cloud Services <span className="text-emerald-600">Active</span>
          </span>
        </div>

      </div>
    </footer>
  );
}
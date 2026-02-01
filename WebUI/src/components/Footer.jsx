import { FiLifeBuoy, FiBookOpen, FiShield } from "react-icons/fi";

export default function Footer() {
  return (
    <footer className="mt-auto py-8 px-6 border-t border-orange-100 bg-white/50 backdrop-blur-sm">
      <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        
        {/* Left: Branding & Copyright */}
        <div className="flex flex-col items-center md:items-start gap-1">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
            © {new Date().getFullYear()} <span className="text-orange-600">WorkFlow</span> Platform
          </p>
          <p className="text-[10px] text-slate-400 font-medium">
            System Node: <span className="font-bold">v2.4.0-Stable</span>
          </p>
        </div>

        {/* Right: Server Status Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 rounded-full border border-orange-100/50">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
          </div>
          <span className="text-[10px] font-black text-orange-700 uppercase tracking-tighter">
            Cloud Systems Active
          </span>
        </div>

      </div>
    </footer>
  );
}

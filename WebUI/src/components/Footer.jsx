import { FiLifeBuoy, FiBookOpen, FiShield } from "react-icons/fi";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto py-8 px-6 border-t border-orange-100 bg-white/50 backdrop-blur-sm relative z-10">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        
        {/* LEFT: BRANDING & SYSTEM INFO */}
        <div className="flex flex-col items-center md:items-start gap-1">
          <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
            © {currentYear} <span className="text-orange-600 font-black">Sandd Studio</span> v2.4.0
          </p>
        </div>

        {/* CENTER: QUICK LINKS (Using your imported icons) */}
        

      </div>
    </footer>
  );
}
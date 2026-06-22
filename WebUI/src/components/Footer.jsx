import { FiLifeBuoy, FiBookOpen, FiShield } from "react-icons/fi";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="p-9 my-auto mx-auto flex items-center border-t border-orange-100 bg-white/50 backdrop-blur-sm">
      <p className="text-[12px] font-bold text-slate-600 uppercase tracking-widest">
        © {currentYear} <span className="text-orange-600 font-black">Sandd Studio</span> v2.4.0
      </p>
    </footer>
  );
}
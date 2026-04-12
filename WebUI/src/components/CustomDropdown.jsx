import { useState, useRef, useEffect } from "react";
import { HiChevronDown } from "react-icons/hi2";

export default function CustomDropdown({
  value,
  onChange,
  options = [],
  placeholder = "Select",
  className = ""
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <div
        onClick={() => setOpen(!open)}
        className="pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-100 rounded-md text-[10px] font-bold text-slate-700 cursor-pointer flex items-center justify-between"
      >
        <span>{value || placeholder}</span>
        <HiChevronDown className={`transition ${open ? "rotate-180" : ""}`} />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg overflow-hidden">
          {options.map((opt) => (
            <div
              key={opt}
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              className="px-2 py-2 z-25 text-[10px] font-semibold text-slate-700 hover:bg-orange-100 cursor-pointer"
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
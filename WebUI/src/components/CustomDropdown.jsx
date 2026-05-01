import { useState, useRef, useEffect } from "react";
import { HiChevronDown } from "react-icons/hi2";

export default function CustomDropdown({
  value,
  onChange,
  options = [],
  placeholder = "Select",
  className = "",
  buttonClass
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
        className={`flex items-center justify-between cursor-pointer ${buttonClass ||
          "pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold text-slate-700"
          }`}
      >
        <span>
          {
            options.find((opt) =>
              typeof opt === "object" ? opt.value === value : opt === value
            )?.label || value || placeholder
          }
        </span>
        <HiChevronDown className={`transition ${open ? "rotate-180" : ""}`} />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-[9999] mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg overflow-hidden">
          {options.map((opt) => {
            const label = typeof opt === "object" ? opt.label : opt;
            const val = typeof opt === "object" ? opt.value : opt;

            return (
              <div
                key={val}
                onClick={() => {
                  onChange(val);
                  setOpen(false);
                }}
                className={`px-2 py-2 text-[10px] font-semibold cursor-pointer ${value === val
                    ? "bg-orange-500 text-white"
                    : "text-slate-700 hover:bg-orange-100"
                  }`}
              >
                {label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
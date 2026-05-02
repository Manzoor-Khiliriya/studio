import { useState, useRef, useEffect } from "react";
import { HiChevronDown } from "react-icons/hi2";

export default function CustomDropdown({
  value,
  onChange,
  options = [],
  placeholder = "Select",
  className = "",
  buttonClass,
  disabled = false,
  searchable = false // 👈 NEW
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
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

  const selectedLabel =
    options.find((opt) =>
      typeof opt === "object" ? opt.value === value : opt === value
    )?.label || value || placeholder;

  const filteredOptions = options.filter((opt) => {
    const label = typeof opt === "object" ? opt.label : opt;
    return label.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* BUTTON */}
      <div
        tabIndex={0}
        onClick={() => !disabled && setOpen(!open)}
        className={`flex items-center justify-between cursor-pointer ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        } ${buttonClass || "form-input pl-10"}`}
      >
        <span className="truncate">{selectedLabel}</span>
        <HiChevronDown className={`transition ${open ? "rotate-180" : ""}`} />
      </div>

      {/* DROPDOWN */}
      {open && (
        <div className="absolute z-[99999] mt-1 w-full bg-slate-900 border border-white/10 rounded-md shadow-lg overflow-hidden">
          
          {/* 🔍 SEARCH INPUT */}
          {searchable && (
            <div className="p-2 border-b border-white/10">
              <input
                autoFocus
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-800 text-white outline-none rounded-md"
              />
            </div>
          )}

          {/* OPTIONS */}
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 && (
              <div className="px-3 py-2 text-xs text-slate-400">
                No results found
              </div>
            )}

            {filteredOptions.map((opt) => {
              const label = typeof opt === "object" ? opt.label : opt;
              const val = typeof opt === "object" ? opt.value : opt;

              return (
                <div
                  key={val}
                  onClick={() => {
                    if (disabled) return;
                    onChange(val);
                    setOpen(false);
                    setSearch(""); // reset search
                  }}
                  className={`px-3 py-2 text-xs font-semibold cursor-pointer truncate ${
                    value === val
                      ? "bg-orange-500 text-white"
                      : "text-white hover:bg-orange-600/20"
                  }`}
                >
                  {label}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
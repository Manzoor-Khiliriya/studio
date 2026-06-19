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
  searchable = false,
  multiSelect = false,
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

  const selectedLabel = multiSelect
    ? value?.length
      ? `${value.length} selected`
      : placeholder
    : options.find((opt) =>
      typeof opt === "object"
        ? opt.value === value
        : opt === value
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
        className={`flex items-center justify-between ${disabled ? "opacity-75 cursor-not-allowed" : "cursor-pointer"
          } ${buttonClass  ||
          "pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold text-slate-700 shadow-sm"
          }`}
      >
        <span
          className="truncate text-left"
          title={
            typeof selectedLabel === "object"
              ? selectedLabel?.name
              : selectedLabel
          }
        >
          {typeof selectedLabel === "object"
            ? selectedLabel?.name
            : selectedLabel}
        </span>
        {!disabled && (<HiChevronDown className={`transition ${open ? "rotate-180" : ""}`} />)}
      </div>

      {/* DROPDOWN */}
      {open && (
        <div className="absolute z-[9999] mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg overflow-hidden">

          {/* 🔍 SEARCH INPUT */}
          {searchable && (
            <div className=" border-b border-white/10">
              <input
                autoFocus
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-800 text-white outline-none"
              />
            </div>
          )}

          {/* OPTIONS */}
          <div className="max-h-70 overflow-y-auto custom-scrollbar">
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
                    if (multiSelect) {
                      const exists = value.includes(val);

                      if (exists) {
                        onChange(value.filter((v) => v !== val));
                      } else {
                        onChange([...value, val]);
                      }
                    } else {
                      onChange(val);
                      setOpen(false);
                    }

                    setSearch("");
                  }}
                  className={`px-2 py-2 text-[10px] font-semibold cursor-pointer flex items-center justify-between ${multiSelect
                    ? value?.includes(val)
                      ? "bg-orange-500 text-white"
                      : "text-slate-700 hover:bg-orange-100"
                    : value === val
                      ? "bg-orange-500 text-white"
                      : "text-slate-700 hover:bg-orange-100"
                    }`}
                >
                  <>
                    <span>{label}</span>

                    {multiSelect && value?.includes(val) && (
                      <span className="font-black">✓</span>
                    )}
                  </>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
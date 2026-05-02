import { useState, useEffect, useRef } from "react";

export default function TruncateText({
  text,
  className = "",
  maxWidth = "max-w-[120px]"
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

  useEffect(() => {
    function handleCloseAll() {
      setOpen(false);
    }
    window.addEventListener("truncate-close-all", handleCloseAll);
    return () => window.removeEventListener("truncate-close-all", handleCloseAll);
  }, []);

  const handleClick = (e) => {
    e.stopPropagation();
    window.dispatchEvent(new Event("truncate-close-all"));
    setOpen((prev) => !prev);
  };

  return (
    <div ref={ref} className={`relative ${maxWidth}`}>
      <span
        onClick={handleClick}
        className={`block truncate cursor-pointer ${className}`}
        title={text || "-"}
      >
        {text || "-"}
      </span>

      {open && (
        <div className="absolute z-40 mt-2 bg-white border border-slate-200 shadow-xl rounded-lg p-3 text-xs font-medium text-slate-700 w-max">
          {text || "-"}
        </div>
      )}
    </div>
  );
}
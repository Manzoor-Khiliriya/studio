import React from 'react';
import { HiOutlineClock, HiOutlineXMark } from 'react-icons/hi2';
import { toast } from 'react-hot-toast';

const BreakReminderNotification = ({ t, minutes, onResume }) => (
  <div
    className={`${
      t.visible ? 'animate-enter' : 'animate-leave'
    } max-w-sm w-full bg-white shadow-2xl rounded-[1.75rem] pointer-events-auto flex border border-amber-100 overflow-hidden`}
  >
    <div className="flex-1 p-4 flex items-start gap-3">
      <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
        <HiOutlineClock className="text-amber-600" size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-black text-slate-900 uppercase tracking-wide">
          Still On Break
        </p>
        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
          You've been on break for <span className="font-bold text-amber-700">{minutes} minutes</span>. Resume work when you're ready.
        </p>
        {onResume && (
          <button
            onClick={() => {
              onResume();
              toast.dismiss(t.id);
            }}
            className="mt-2 text-[10px] font-black uppercase tracking-widest text-orange-600 hover:text-orange-700"
          >
            Resume Work →
          </button>
        )}
      </div>
    </div>
    <button
      onClick={() => toast.dismiss(t.id)}
      className="shrink-0 px-3 flex items-center justify-center text-slate-300 hover:text-slate-500 border-l border-slate-100"
    >
      <HiOutlineXMark size={16} />
    </button>
  </div>
);

export default BreakReminderNotification;
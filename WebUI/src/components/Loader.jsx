import { BiLoaderAlt } from 'react-icons/bi';

export default function Loader({ message = "Syncing System..." }) {
  return (
    <div className="h-[60vh] flex flex-col items-center justify-center text-orange-600 gap-4">
      <BiLoaderAlt className="animate-spin" size={48} />
      <p className="font-black uppercase tracking-[0.3em] text-[10px] text-slate-400">
        {message}
      </p>
    </div>
  );
}
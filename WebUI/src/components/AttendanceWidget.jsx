import { 
  useGetTodayStatusQuery, 
  useClockInMutation, 
  useClockOutMutation 
} from "../../services/attendanceApiSlice";
import { toast } from "react-hot-toast";

export default function AttendanceWidget() {
  const { data: status, isLoading } = useGetTodayStatusQuery();
  const [clockIn, { isLoading: isInLoading }] = useClockInMutation();
  const [clockOut, { isLoading: isOutLoading }] = useClockOutMutation();

  const handleClockAction = async () => {
    const isClockedIn = status?.clockIn && !status?.clockOut;
    const t = toast.loading(isClockedIn ? "Ending shift..." : "Starting shift...");
    
    try {
      if (isClockedIn) {
        await clockOut().unwrap();
        toast.success("Shift ended. Great work!", { id: t });
      } else {
        await clockIn().unwrap();
        toast.success("Shift started. Good luck!", { id: t });
      }
    } catch (err) {
      toast.error(err?.data?.message || "Action failed", { id: t });
    }
  };

  if (isLoading) return <div className="h-24 animate-pulse bg-slate-100 rounded-3xl" />;

  const isActive = status?.clockIn && !status?.clockOut;
  const isFinished = !!status?.clockOut;

  return (
    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Attendance</span>
          <h3 className="text-lg font-black text-slate-900 leading-none mt-1">
            {isActive ? "ACTIVE SHIFT" : isFinished ? "SHIFT COMPLETED" : "READY TO START"}
          </h3>
        </div>

        {!isFinished && (
          <button
            disabled={isInLoading || isOutLoading}
            onClick={handleClockAction}
            className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
              isActive 
                ? "bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white" 
                : "bg-slate-900 text-white hover:bg-orange-600 shadow-lg shadow-orange-200"
            }`}
          >
            {isActive ? "Clock Out" : "Clock In"}
          </button>
        )}
      </div>
    </div>
  );
}
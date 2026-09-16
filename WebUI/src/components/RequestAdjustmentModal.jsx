import React, { useState } from 'react';
import { HiOutlineXMark, HiOutlineClock } from 'react-icons/hi2';
import { toast } from 'react-hot-toast';
import {
  useGetEligibleLogsQuery,
  useRequestAdjustmentMutation,
} from '../services/timeLogAdjustmentApi';

const formatDuration = (seconds = 0) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
};

const RequestAdjustmentModal = ({ isOpen, onClose }) => {
  const { data: eligibleLogs = [], isLoading } = useGetEligibleLogsQuery(undefined, {
    skip: !isOpen,
  });
  const [requestAdjustment, { isLoading: isSubmitting }] = useRequestAdjustmentMutation();

  const [selectedLogId, setSelectedLogId] = useState(null);
  const [requestedEndTime, setRequestedEndTime] = useState('');
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const selectedLog = eligibleLogs.find((l) => l._id === selectedLogId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLogId || !requestedEndTime || !reason.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      await requestAdjustment({
        timeLogId: selectedLogId,
        requestedEndTime: new Date(requestedEndTime).toISOString(),
        reason: reason.trim(),
      }).unwrap();

      toast.success('Correction request submitted for admin review');
      setSelectedLogId(null);
      setRequestedEndTime('');
      setReason('');
      onClose();
    } catch (err) {
      toast.error(err?.data?.error || 'Failed to submit request');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-[2rem] w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0">
          <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest">
            Request Time Correction
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500 cursor-pointer">
            <HiOutlineXMark size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <p className="text-[11px] text-slate-400 font-bold uppercase text-center py-8">
              Loading eligible sessions...
            </p>
          ) : eligibleLogs.length === 0 ? (
            <p className="text-[11px] text-slate-400 font-bold uppercase text-center py-8">
              No auto-stopped sessions found in the last few days
            </p>
          ) : (
            <div className="space-y-3">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Select the session to correct
              </p>
              {eligibleLogs.map((log) => (
                <button
                  key={log._id}
                  type="button"
                  onClick={() => setSelectedLogId(log._id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                    selectedLogId === log._id
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-slate-900 uppercase truncate">
                      {log.task?.title || 'Untitled Task'}
                    </span>
                    <span className="text-[9px] font-bold text-amber-600 uppercase bg-amber-100 px-2 py-0.5 rounded-full shrink-0 ml-2">
                      {log.stopReason === 'midnight' ? 'Auto stopped at midnight' : 'Auto stopped (inactive)'}
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-500 font-bold uppercase mt-1 flex items-center gap-1.5">
                    <HiOutlineClock size={11} />
                    {new Date(log.startTime).toLocaleString()} — {new Date(log.endTime).toLocaleTimeString()}
                    <span className="text-slate-400">({formatDuration(log.rawDurationSeconds)} recorded)</span>
                  </p>
                </button>
              ))}
            </div>
          )}

          {selectedLog && (
            <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t border-slate-100">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Actual end time
                </label>
                <input
                  type="datetime-local"
                  value={requestedEndTime}
                  onChange={(e) => setRequestedEndTime(e.target.value)}
                  min={new Date(selectedLog.endTime).toISOString().slice(0, 16)}
                  className="w-full mt-1.5 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-orange-500"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Reason
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  placeholder="E.g. Browser crashed but I was still working on the task..."
                  className="w-full mt-1.5 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-orange-500 resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[11px] font-black uppercase tracking-widest transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit for Admin Approval'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestAdjustmentModal;
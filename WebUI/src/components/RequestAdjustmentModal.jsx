import React, { useState } from 'react';
import { HiOutlineXMark, HiOutlineClock, HiOutlineCalendarDays, HiOutlineChatBubbleBottomCenterText } from 'react-icons/hi2';
import { toast } from 'react-hot-toast';
import CommonModal, { InputGroup } from './CommonModal';
import {
  useDismissEligibleLogMutation,
  useGetEligibleLogsQuery,
  useRequestAdjustmentMutation,
} from '../services/timeLogAdjustmentApi';
import { useSocketEvents } from '../hooks/useSocketEvents';

const TIMEZONE = 'Asia/Kolkata';

const formatDuration = (seconds = 0) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
};

const formatIST = (date) =>
  new Date(date).toLocaleString('en-IN', {
    timeZone: TIMEZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

const formatISTTimeOnly = (date) =>
  new Date(date).toLocaleTimeString('en-IN', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

const getISTParts = (date) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date(date));

  const map = {};
  parts.forEach(({ type, value }) => (map[type] = value));
  return map;
};

const toISTInputValue = (date) => {
  const { year, month, day, hour, minute } = getISTParts(date);
  return `${year}-${month}-${day}T${hour}:${minute}`;
};

const istInputToUTCISOString = (naiveISTString) => {
  const [datePart, timePart] = naiveISTString.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);
  const utcMillis = Date.UTC(year, month - 1, day, hour, minute) - (5.5 * 60 * 60 * 1000);
  return new Date(utcMillis).toISOString();
};

export default function RequestAdjustmentModal({ isOpen, onClose }) {
  const { data: eligibleLogs = [], isLoading, refetch } = useGetEligibleLogsQuery(undefined, {
    skip: !isOpen,
  });

  useSocketEvents({
    onTimeAdjustmentChange: refetch,
  });
  const [requestAdjustment, { isLoading: isSubmitting }] = useRequestAdjustmentMutation();
  const [dismissLog, { isLoading: isDismissing }] = useDismissEligibleLogMutation();

  const [selectedLogId, setSelectedLogId] = useState(null);
  const [requestedEndTime, setRequestedEndTime] = useState('');
  const [reason, setReason] = useState('');

  const selectedLog = eligibleLogs.find((l) => l._id === selectedLogId);

  const resetForm = () => {
    setSelectedLogId(null);
    setRequestedEndTime('');
    setReason('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!selectedLogId) {
      toast.error('Select a session to correct first');
      return;
    }
    if (!requestedEndTime || !reason.trim()) {
      toast.error('Please set the actual end time and enter a reason');
      return;
    }

    try {
      const requestedISO = istInputToUTCISOString(requestedEndTime);

      await requestAdjustment({
        timeLogId: selectedLogId,
        requestedEndTime: requestedISO,
        reason: reason.trim(),
      }).unwrap();

      toast.success('Correction request submitted for admin review');
      resetForm();
      onClose();
    } catch (err) {
      toast.error(err?.data?.error || 'Failed to submit request');
    }
  };

  const handleDismiss = async (e, logId) => {
    e.stopPropagation();
    try {
      await dismissLog(logId).unwrap();
      if (selectedLogId === logId) setSelectedLogId(null);
      toast.success('Timelog request dismissed');
    } catch (err) {
      toast.error(err?.data?.error || 'Failed to dismiss');
    }
  };

  return (
    <CommonModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Request Time Correction"
      maxWidth="max-w-lg"
      onSubmit={handleSubmit}
      isLoading={isSubmitting}
      submitText="Submit for Approval"
    >
      <div className="space-y-4">
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
              <div
                key={log._id}
                className={`relative w-full text-left p-4 rounded-2xl border transition-all ${selectedLogId === log._id
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-slate-200 hover:border-slate-300'
                  }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedLogId(log._id)}
                  className="w-full text-left cursor-pointer"
                >
                  <div className="flex items-center justify-between pr-6">
                    <span className="text-[11px] font-black text-slate-900 uppercase truncate">
                      {log.task?.title || 'Untitled Task'}
                    </span>
                    <span className="text-[9px] font-bold text-amber-600 uppercase bg-amber-100 px-2 py-0.5 rounded-full shrink-0 ml-2">
                      {log.stopReason === 'midnight' ? 'Auto stopped at midnight' : 'Auto stopped (inactive)'}
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-500 font-bold uppercase mt-1 flex items-center gap-1.5">
                    <HiOutlineClock size={11} />
                    {formatIST(log.startTime)} — {formatISTTimeOnly(log.endTime)} IST
                    <span className="text-slate-400">({formatDuration(log.rawDurationSeconds)} recorded)</span>
                  </p>
                </button>

                <button
                  type="button"
                  onClick={(e) => handleDismiss(e, log._id)}
                  disabled={isDismissing}
                  title="Dismiss — don't ask about this session again"
                  className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer disabled:opacity-50"
                >
                  <HiOutlineXMark size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {selectedLog && (
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <InputGroup label="Actual End Time (IST) *">
              <HiOutlineCalendarDays className="input-icon" />
              <input
                type="datetime-local"
                value={requestedEndTime}
                onChange={(e) => setRequestedEndTime(e.target.value)}
                min={toISTInputValue(selectedLog.endTime)}
                className="form-input"
                required
              />
            </InputGroup>
            <p className="text-[9px] text-slate-400 font-medium -mt-2">
              Enter the time in India Standard Time.
            </p>

            <InputGroup label="Reason *">
              <HiOutlineChatBubbleBottomCenterText className="input-icon" />
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="E.g. Browser crashed but I was still working on the task..."
                className="form-input resize-none"
                required
              />
            </InputGroup>
          </div>
        )}
      </div>
    </CommonModal>
  );
}
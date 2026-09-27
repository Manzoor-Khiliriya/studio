import { useEffect, useRef } from "react";

const BREAK_REMINDER_THRESHOLD = 15 * 60; // 15 minutes before first nudge
const BREAK_REMINDER_REPEAT = 10 * 60;    // remind again every 10 minutes after that
const CHECK_INTERVAL = 30 * 1000;         // check every 30 seconds

// Play a short reminder tone, same approach as useReminder's playReminderSound
const playReminderSound = () => {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.frequency.setValueAtTime(880, ctx.currentTime);
  oscillator.frequency.setValueAtTime(660, ctx.currentTime + 0.1);
  oscillator.frequency.setValueAtTime(880, ctx.currentTime + 0.2);
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.5);
};

const showBrowserNotification = (minutesOnBreak, onClickFocus) => {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return false;
  }

  const notification = new Notification("HRMS • Still On Break", {
    body: `You've been on break for ${minutesOnBreak} minutes. Resume work when you're ready.`,
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    tag: "hrms-break-reminder",
    requireInteraction: true,
  });

  notification.onclick = () => {
    onClickFocus?.();
    notification.close();
  };

  playReminderSound();
  return true;
};

/**
 * Watches an active break TimeLog and fires a reminder (browser notification,
 * or an in-app fallback via onReminder) once BREAK_REMINDER_THRESHOLD is
 * crossed, repeating every BREAK_REMINDER_REPEAT while the break continues.
 *
 * @param {object|null} activeBreakLog - the currently running break TimeLog, or null/undefined if not on break
 * @param {(minutesOnBreak: number) => void} onReminder - called when a reminder should show in-app (e.g. a toast), only if the browser notification couldn't be shown and the tab is visible
 */
export const useBreakReminder = (activeBreakLog, onReminder) => {
  const lastReminderAtRef = useRef(0);

  // Request notification permission once, on mount
  useEffect(() => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!activeBreakLog) {
      lastReminderAtRef.current = 0; // reset so next break starts fresh
      return;
    }

    const startTime = new Date(activeBreakLog.startTime).getTime();

    const checkBreakDuration = () => {
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      if (elapsedSeconds < BREAK_REMINDER_THRESHOLD) return;

      const now = Date.now();
      if (
        lastReminderAtRef.current &&
        now - lastReminderAtRef.current < BREAK_REMINDER_REPEAT * 1000
      ) {
        return;
      }
      lastReminderAtRef.current = now;

      const minutesOnBreak = Math.floor(elapsedSeconds / 60);

      const shown = showBrowserNotification(minutesOnBreak, () => window.focus());

      if (!shown && !document.hidden) {
        onReminder?.(minutesOnBreak);
      }
    };

    checkBreakDuration();
    const interval = setInterval(checkBreakDuration, CHECK_INTERVAL);

    const handleVisibilityChange = () => {
      if (!document.hidden) checkBreakDuration();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [activeBreakLog, onReminder]);
};
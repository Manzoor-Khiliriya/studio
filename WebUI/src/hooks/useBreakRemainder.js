import { useEffect, useRef } from "react";

// Reminder thresholds
const NORMAL_BREAK_THRESHOLD = 2 * 60; // 2 minutes
const LUNCH_BREAK_THRESHOLD = 60 * 60; // 1 hour

// Repeat every 5 minutes
const BREAK_REMINDER_REPEAT = 5 * 60;

// Check every 30 seconds
const CHECK_INTERVAL = 30 * 1000;

// ---------------------------------------------------------
// PLAY REMINDER SOUND
// ---------------------------------------------------------

const playReminderSound = () => {
  try {
    const AudioContext =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContext) return;

    const ctx = new AudioContext();

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.frequency.setValueAtTime(
      880,
      ctx.currentTime,
    );

    oscillator.frequency.setValueAtTime(
      660,
      ctx.currentTime + 0.1,
    );

    oscillator.frequency.setValueAtTime(
      880,
      ctx.currentTime + 0.2,
    );

    gain.gain.setValueAtTime(
      0.3,
      ctx.currentTime,
    );

    gain.gain.exponentialRampToValueAtTime(
      0.001,
      ctx.currentTime + 0.5,
    );

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.5);

    oscillator.onended = () => {
      ctx.close();
    };
  } catch (error) {
    console.error("Reminder sound error:", error);
  }
};

// ---------------------------------------------------------
// BROWSER NOTIFICATION
// ---------------------------------------------------------

const showBrowserNotification = (
  minutesOnBreak,
  breakType,
  onClickFocus,
) => {
  if (
    !("Notification" in window) ||
    Notification.permission !== "granted"
  ) {
    return false;
  }

  const isLunch = breakType === "lunch";

  const title = isLunch
    ? "HRMS • Lunch Break Reminder"
    : "HRMS • Still On Break";

  const body = isLunch
    ? `You've been on lunch break for ${minutesOnBreak} minutes. Resume work when you're ready.`
    : `You've been on break for ${minutesOnBreak} minutes. Resume work when you're ready.`;

  try {
    const notification = new Notification(title, {
      body,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      tag: isLunch
        ? "hrms-lunch-reminder"
        : "hrms-break-reminder",
      requireInteraction: true,
    });

    notification.onclick = () => {
      onClickFocus?.();
      notification.close();
    };

    playReminderSound();

    return true;
  } catch (error) {
    console.error("Browser notification error:", error);
    return false;
  }
};

// ---------------------------------------------------------
// BREAK REMINDER HOOK
// ---------------------------------------------------------

export const useBreakReminder = (
  activeBreakLog,
  onReminder,
) => {
  const lastReminderAtRef = useRef(0);

  const onReminderRef = useRef(onReminder);

  // Keep callback updated without resetting the interval.
  useEffect(() => {
    onReminderRef.current = onReminder;
  }, [onReminder]);

  // -------------------------------------------------------
  // NOTIFICATION PERMISSION
  // -------------------------------------------------------

  useEffect(() => {
    if (!("Notification" in window)) return;

    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // -------------------------------------------------------
  // REMINDER TIMER
  // -------------------------------------------------------

  useEffect(() => {
    if (!activeBreakLog) {
      lastReminderAtRef.current = 0;
      return;
    }

    const breakType = activeBreakLog.logType;

    const isLunch = breakType === "lunch";

    // Different thresholds for lunch and normal breaks.
    const reminderThreshold = isLunch
      ? LUNCH_BREAK_THRESHOLD
      : NORMAL_BREAK_THRESHOLD;

    const startTime = new Date(
      activeBreakLog.startTime,
    ).getTime();

    if (!Number.isFinite(startTime)) return;

    // Reset reminder when a different break starts.
    lastReminderAtRef.current = 0;

    const checkBreakDuration = () => {
      const currentTime = Date.now();

      const elapsedSeconds = Math.max(
        0,
        Math.floor(
          (currentTime - startTime) / 1000,
        ),
      );

      // Wait until the threshold is reached.
      if (elapsedSeconds < reminderThreshold) {
        return;
      }

      // Don't repeat until 5 minutes have passed.
      if (
        lastReminderAtRef.current &&
        currentTime - lastReminderAtRef.current <
          BREAK_REMINDER_REPEAT * 1000
      ) {
        return;
      }

      const minutesOnBreak = Math.floor(
        elapsedSeconds / 60,
      );

      const shown = showBrowserNotification(
        minutesOnBreak,
        breakType,
        () => window.focus(),
      );

      // Show the existing toast when browser notifications
      // are unavailable and the page is visible.
      if (!shown && !document.hidden) {
        onReminderRef.current?.(
          minutesOnBreak,
          breakType,
        );
      }

      // Remember when the last reminder was triggered.
      if (shown || !document.hidden) {
        lastReminderAtRef.current = currentTime;
      }
    };

    // Check immediately, including after a page refresh.
    checkBreakDuration();

    const interval = setInterval(
      checkBreakDuration,
      CHECK_INTERVAL,
    );

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkBreakDuration();
      }
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange,
    );

    return () => {
      clearInterval(interval);

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );
    };
  }, [
    activeBreakLog?._id,
    activeBreakLog?.startTime,
    activeBreakLog?.logType,
  ]);
};
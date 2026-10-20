import { useEffect, useRef } from "react";

const fmt = (s) => {
  const h = String(Math.floor(s / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const sec = String(s % 60).padStart(2, "0");
  return `${h}:${m}:${sec}`;
};

export function useTitleTimer({ seconds, isRunning, label }) {
  const anchor = useRef({ seconds, at: Date.now() });

  useEffect(() => {
    anchor.current = { seconds, at: Date.now() };
  }, [seconds]);

  useEffect(() => {
    const original = document.title;
    if (!label) return;

    const update = () => {
      const { seconds: s, at } = anchor.current;
      const total = isRunning ? s + Math.floor((Date.now() - at) / 1000) : s;
      document.title = `${isRunning ? "▶" : "⏸"} ${fmt(total)} · ${label}`;
    };

    update();
    const id = setInterval(update, 1000);
    return () => {
      clearInterval(id);
      document.title = original;
    };
  }, [isRunning, label]);
}
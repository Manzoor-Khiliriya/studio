import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";

const PIP_W = 200;
const PIP_H = 76;

const THEMES = {
  working: { bg: "#064e3b", label: "#f5f3ff", time: "#ecfdf5" },
  break: { bg: "#7c2d12", label: "#f5f3ff", time: "#fff7ed" },
  lunch: { bg: "#4c1d95", label: "#f5f3ff", time: "#f5f3ff" },
};

const fmt = (s) => {
  const h = String(Math.floor(s / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const sec = String(s % 60).padStart(2, "0");
  return `${h}:${m}:${sec}`;
};

export function usePipTimer() {
  const [pipWindow, setPipWindow] = useState(null);
  const opening = useRef(false);
  const supported =
    typeof window !== "undefined" && "documentPictureInPicture" in window;

  const open = useCallback(async () => {
    if (!supported || pipWindow || opening.current) return;
    opening.current = true;
    try {
      const win = await window.documentPictureInPicture.requestWindow({
        width: PIP_W,
        height: PIP_H,
      });

      // Ask for the bottom-right corner. The browser may ignore this and use
      // its default spot or the position the user last dragged it to.
      try {
        const left =
          (window.screen.availLeft ?? 0) + window.screen.availWidth - PIP_W - 16;
        const top =
          (window.screen.availTop ?? 0) + window.screen.availHeight - PIP_H - 16;
        win.moveTo(left, top);
      } catch {
        // moveTo not allowed in this browser version
      }

      win.addEventListener("pagehide", () => setPipWindow(null));
      setPipWindow(win);
    } finally {
      opening.current = false;
    }
  }, [supported, pipWindow]);

  const close = useCallback(() => {
    pipWindow?.close();
    setPipWindow(null);
  }, [pipWindow]);

  // Close the floating window if the component using this hook unmounts
  useEffect(() => {
    return () => pipWindow?.close();
  }, [pipWindow]);

  return { pipWindow, open, close, supported };
}

export function PipTimerView({
  pipWindow,
  seconds,
  isRunning,
  label,
  status = "working",
}) {
  const [, force] = useState(0);
  const anchor = useRef({ seconds, at: Date.now() });
  const theme = THEMES[status] || THEMES.working;

  useEffect(() => {
    anchor.current = { seconds, at: Date.now() };
  }, [seconds]);

  useEffect(() => {
    if (!pipWindow) return;
    const id = pipWindow.setInterval(() => force((n) => n + 1), 1000);
    return () => pipWindow.clearInterval(id);
  }, [pipWindow]);

  // Remove default margin/scrollbars and keep the body color in sync with status
  useEffect(() => {
    if (!pipWindow) return;
    const { documentElement: html, body } = pipWindow.document;

    html.style.margin = "0";
    html.style.height = "100%";
    html.style.overflow = "hidden";

    body.style.margin = "0";
    body.style.height = "100%";
    body.style.overflow = "hidden";
    body.style.background = theme.bg;
  }, [pipWindow, theme.bg]);

  if (!pipWindow) return null;

  const { seconds: s, at } = anchor.current;
  const total = isRunning ? s + Math.floor((Date.now() - at) / 1000) : s;

  return createPortal(
    <div
      style={{
        margin: 0,
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        background: theme.bg,
        color: theme.time,
        fontFamily: "system-ui, sans-serif",
        overflow: "hidden",
        transition: "background 0.3s",
      }}
    >
      <div
        style={{
          fontSize: 8,
          letterSpacing: 2,
          color: theme.label,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 26,
          fontWeight: 900,
          lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {fmt(total)}
      </div>
    </div>,
    pipWindow.document.body
  );
}
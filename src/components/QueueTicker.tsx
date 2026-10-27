"use client";

import { useEffect } from "react";

// Ticks the request-driven queue (item 7) on page load and tab focus.
// Defensive: the tick route may not exist yet; failures are ignored.
export default function QueueTicker() {
  useEffect(() => {
    let cancelled = false;
    const tick = () => {
      fetch("/api/jobs/tick", { keepalive: true }).catch(() => {});
    };
    tick();
    const onFocus = () => {
      if (!cancelled) tick();
    };
    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
    };
  }, []);
  return null;
}

"use client";

import { useEffect } from "react";

let lastTraffic = "low";
export function currentTraffic() { return lastTraffic; }

// Wake on user activity; the minute cron recovers due work without tab polling.
export default function QueueTicker() {
  useEffect(() => {
    let cancelled = false;
    let running = false;
    let requested = false;
    const tick = async () => {
      if (cancelled) return;
      if (running) { requested = true; return; }
      running = true;
      try {
        const response = await fetch("/api/jobs/tick", {keepalive: true, cache: "no-store", signal: AbortSignal.timeout(10000)});
        if (!response.ok || cancelled) return;
        const {traffic} = await response.json();
        if (cancelled) return;
        if (["low", "medium", "high"].includes(traffic)) {
          lastTraffic = traffic;
          window.dispatchEvent(new CustomEvent("queue-traffic", {detail: {traffic}}));
        }
      } catch { /* The cron wake still recovers due work after a failed tick. */ }
      finally {
        running = false;
        if (!cancelled) {
          if (requested) { requested = false; void tick(); }
        }
      }
    };
    const wake = () => { void tick(); };
    const events = ["focus", "post-created", "upload-started", "upload-finished"];
    events.forEach(event => window.addEventListener(event, wake));
    wake();
    return () => {
      cancelled = true;
      events.forEach(event => window.removeEventListener(event, wake));
    };
  }, []);
  return null;
}

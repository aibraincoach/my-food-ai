"use client";

import { useEffect } from "react";

let lastTraffic = "low";
export function currentTraffic() { return lastTraffic; }

// Wake on user activity; poll only while the queue reports outstanding work.
export default function QueueTicker() {
  useEffect(() => {
    let cancelled = false;
    let running = false;
    let requested = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const tick = async () => {
      clearTimeout(timer);
      if (cancelled) return;
      if (running) { requested = true; return; }
      running = true;
      let pending = false;
      try {
        const response = await fetch("/api/jobs/tick", {keepalive: true, cache: "no-store", signal: AbortSignal.timeout(10000)});
        if (!response.ok || cancelled) return;
        const {traffic, queued, running: active} = await response.json();
        if (cancelled) return;
        if (["low", "medium", "high"].includes(traffic)) {
          lastTraffic = traffic;
          window.dispatchEvent(new CustomEvent("queue-traffic", {detail: {traffic}}));
        }
        pending = Number.isFinite(queued) && Number.isFinite(active) && queued + active > 0;
      } catch { /* The cron wake still recovers due work after a failed tick. */ }
      finally {
        running = false;
        if (!cancelled) {
          if (requested) { requested = false; void tick(); }
          else if (pending) timer = setTimeout(() => { void tick(); }, 60000);
        }
      }
    };
    const wake = () => { void tick(); };
    const events = ["focus", "post-created", "upload-started", "upload-finished"];
    events.forEach(event => window.addEventListener(event, wake));
    wake();
    return () => {
      cancelled = true;
      clearTimeout(timer);
      events.forEach(event => window.removeEventListener(event, wake));
    };
  }, []);
  return null;
}

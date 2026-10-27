"use client";

import { useEffect } from "react";

let lastTraffic = "low";
export function currentTraffic() { return lastTraffic; }

// Ticks the request-driven queue (item 7) on page load and tab focus.
// Defensive: the tick route may not exist yet; failures are ignored.
export default function QueueTicker() {
  useEffect(() => {
    let cancelled = false;
    const tick = () => {
      fetch("/api/jobs/tick", { keepalive: true, cache: "no-store" }).then(async response=>{
        if(!response.ok || cancelled) return;
        const {traffic}=await response.json();
        if(["low","medium","high"].includes(traffic)) { lastTraffic=traffic; window.dispatchEvent(new CustomEvent("queue-traffic",{detail:{traffic}})); }
      }).catch(() => {});
    };
    tick();
    const timer=setInterval(tick,60000);
    const onFocus = () => {
      if (!cancelled) tick();
    };
    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, []);
  return null;
}

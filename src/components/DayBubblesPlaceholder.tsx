"use client";

import { useSyncExternalStore } from "react";

function todayKey() {
  const day = new Date();
  return `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
}
function subscribe(callback: () => void) {
  const timer = setInterval(callback, 60_000);
  window.addEventListener("focus", callback);
  return () => { clearInterval(timer); window.removeEventListener("focus", callback); };
}

export default function DayBubblesPlaceholder() {
  const today = useSyncExternalStore(subscribe, todayKey, () => "");
  return <div className="flex justify-between gap-grid px-screen-x pt-sheet-top pb-card-gap" aria-label="Last seven days">
    {Array.from({ length: 7 }, (_, index) => {
      const day = today ? new Date(`${today}T12:00:00`) : null;
      day?.setDate(day.getDate() - 6 + index);
      return <div key={index} className="flex flex-col items-center gap-grid text-faint" aria-label={day?.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}>
        <span className="flex size-sheet-bottom items-center justify-center rounded-circle border border-dashed border-ring text-body tabular-nums">{day?.getDate()}</span>
        <span className="text-bubble">{day?.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 1)}</span>
      </div>;
    })}
  </div>;
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { LoggedDay } from "@/lib/posts/days";

export default function DayBubbles({ days, today, zone }: { days: LoggedDay[]; today: string; zone: string }) {
  const router = useRouter();
  const [empty, setEmpty] = useState(false);
  useEffect(() => {
    const local = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (local && local !== zone) {
      document.cookie = `time-zone=${encodeURIComponent(local)}; Path=/; SameSite=Lax; Max-Age=31536000`;
      router.refresh();
    }
    const onFeedState = (event: Event) => {
      const detail = (event as CustomEvent<{ empty?: unknown }>).detail;
      if (typeof detail?.empty === "boolean") setEmpty(detail.empty);
    };
    window.addEventListener("feed-state", onFeedState);
    window.dispatchEvent(new CustomEvent("feed-state-request"));
    const refresh = () => router.refresh();
    window.addEventListener("post-created", refresh);
    window.addEventListener("focus", refresh);
    return () => { window.removeEventListener("feed-state", onFeedState); window.removeEventListener("post-created", refresh); window.removeEventListener("focus", refresh); };
  }, [router, zone]);
  return <nav aria-label="Last seven days" className="flex justify-between gap-grid px-screen-x pt-sheet-top pb-card-gap">
    {Array.from({ length: 7 }, (_, index) => {
      const date = new Date(`${today}T12:00:00Z`); date.setUTCDate(date.getUTCDate() - 6 + index);
      const key = date.toISOString().slice(0, 10);
      const day = days.find((entry) => entry.date === key);
      return <Link key={key} href={`/days/${key}?tz=${encodeURIComponent(zone)}`} aria-label={date.toLocaleDateString("en", { timeZone: "UTC", weekday: "long", month: "long", day: "numeric" })} className={`flex flex-col items-center gap-grid ${!empty && day ? "text-text" : "text-faint"}`}>
        <span className={`flex size-sheet-bottom items-center justify-center rounded-circle text-body tabular-nums ${empty ? "border border-dashed border-ring text-faint" : key === today ? "border-2 border-text text-text" : day ? "border-2 border-ring text-text" : "text-faint"}`}>{date.getUTCDate()}</span>
        <span className="text-bubble">{date.toLocaleDateString("en", { timeZone: "UTC", weekday: "short" }).slice(0, 1)}</span>
      </Link>;
    })}
  </nav>;
}

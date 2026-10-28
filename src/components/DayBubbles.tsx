"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { withZone } from "@/lib/posts/days";
import { bubbleClass, bubbleLinkClass } from "@/lib/posts/bubble";

export default function DayBubbles({ days, today, zone, zoneKnown }: { days: { date: string }[]; today: string; zone: string; zoneKnown: boolean }) {
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
    return () => { window.removeEventListener("feed-state", onFeedState); };
  }, [router, zone]);
  return <nav aria-label="Last seven days" className="flex justify-between gap-grid px-screen-x pt-sheet-top pb-card-gap">
    {Array.from({ length: 7 }, (_, index) => {
      const date = new Date(`${today}T12:00:00Z`); date.setUTCDate(date.getUTCDate() - 6 + index);
      const key = date.toISOString().slice(0, 10);
      const day = days.find((entry) => entry.date === key);
      return <Link key={key} href={withZone(`/days/${key}`, zone, zoneKnown)} aria-label={date.toLocaleDateString("en", { timeZone: "UTC", weekday: "long", month: "long", day: "numeric" })} className={`flex flex-col items-center gap-grid ${bubbleLinkClass(Boolean(day))}`}>
        <span className={`flex size-sheet-bottom items-center justify-center rounded-circle text-body tabular-nums ${bubbleClass({ empty, isToday: key === today, hasDay: Boolean(day) })}`}>{date.getUTCDate()}</span>
        <span className="text-bubble">{date.toLocaleDateString("en", { timeZone: "UTC", weekday: "short" }).slice(0, 1)}</span>
      </Link>;
    })}
  </nav>;
}

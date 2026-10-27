"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { LoggedDay } from "@/lib/posts/days";

export default function DayBubbles({ days, today, zone }: { days: LoggedDay[]; today: string; zone: string }) {
  const router = useRouter();
  useEffect(() => {
    const local = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (local && local !== zone) {
      document.cookie = `time-zone=${encodeURIComponent(local)}; Path=/; SameSite=Lax; Max-Age=31536000`;
      router.refresh();
    }
    const refresh = () => router.refresh();
    window.addEventListener("post-created", refresh);
    window.addEventListener("focus", refresh);
    return () => { window.removeEventListener("post-created", refresh); window.removeEventListener("focus", refresh); };
  }, [router, zone]);
  return <nav aria-label="Last seven days" className="flex justify-between gap-grid px-screen-x pt-sheet-top pb-card-gap">
    {Array.from({ length: 7 }, (_, index) => {
      const date = new Date(`${today}T12:00:00Z`); date.setUTCDate(date.getUTCDate() - 6 + index);
      const key = date.toISOString().slice(0, 10);
      const day = days.find((entry) => entry.date === key);
      return <Link key={key} href={`/days/${key}?tz=${encodeURIComponent(zone)}`} aria-label={date.toLocaleDateString("en", { timeZone: "UTC", weekday: "long", month: "long", day: "numeric" })} className={`flex flex-col items-center gap-grid ${day ? "text-text" : "text-faint"}`}>
        <span className={`flex size-sheet-bottom items-center justify-center overflow-hidden rounded-circle border text-body tabular-nums ${day ? "border-text bg-card" : "border-dashed border-ring"}`}>
          {day?.posts[0]?.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={day.posts[0].photoUrl} alt="" className="h-full w-full object-cover" />
          ) : date.getUTCDate()}
        </span>
        <span className="text-bubble">{date.toLocaleDateString("en", { timeZone: "UTC", weekday: "short" }).slice(0, 1)}</span>
      </Link>;
    })}
  </nav>;
}

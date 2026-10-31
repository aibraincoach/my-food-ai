"use client";
import { useEffect, useRef, useState } from "react";
import { dateInZone, shiftDay, type FeedDayTotal } from "@/lib/posts/days";
import { tokens } from "@/lib/theme/tokens";

export default function DayHeader({ day, zone, empty, total }: { day: string; zone: string; empty: boolean; total?: FeedDayTotal }) {
  const sentinel = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);
  useEffect(() => {
    const offset = tokens.spacing['top-h'];
    const observer = new IntersectionObserver(([entry]) => setStuck(!entry.isIntersecting && entry.boundingClientRect.top < offset), { rootMargin: `-${offset}px 0px 0px 0px`, threshold: 0 });
    if (sentinel.current) observer.observe(sentinel.current);
    return () => observer.disconnect();
  }, []);
  const today = dateInZone(new Date(), zone);
  const relative = day === today ? "Today" : day === shiftDay(today, -1) ? "Yesterday" : null;
  const older = new Date(`${day}T12:00:00Z`) < new Date(`${Number(today.slice(0,4))-1}${today.slice(4)}T12:00:00Z`);
  const label = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "long", month: "short", day: "numeric", ...(older ? {year: "numeric"} : {}) }).format(new Date(`${day}T12:00:00Z`));
  return <>
    <div ref={sentinel} aria-hidden="true" style={{height: tokens.border.hairline}} />
    <header className={`sticky z-10 flex h-tap items-center justify-between border-b border-hairline bg-surface px-screen-x ${empty ? "text-faint" : "text-text"} ${stuck ? "stuck" : ""}`}
      style={{top: `calc(${tokens.spacing['top-h']}px + env(safe-area-inset-top))`, boxShadow: stuck ? tokens.colors['shadow-stuck'] : undefined}}>
      <div className="flex items-baseline gap-2"><span className="text-body font-semibold">{relative ?? label}</span>{relative ? <span className={`text-meta ${empty ? "text-faint" : "text-muted"}`}>{label}</span> : null}</div>
      <span className={`text-meta tabular-nums ${empty ? "text-faint" : "text-muted"}`}>{empty ? "No posts" : total?.ready ? `Consumed: ${total.kcal === null ? "unavailable" : Math.round(total.kcal).toLocaleString("en-US")} kcal${total.missing?.length?"*":""}` : ""}</span>
    </header>
    {total?.missing?.length ? <p className="px-screen-x py-grid text-meta text-muted">* Known nutrition shown. Nutrition unavailable: {[...new Set(total.missing)].join(", ")}</p> : null}
  </>;
}

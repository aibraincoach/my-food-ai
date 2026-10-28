import { tokens } from "@/lib/theme/tokens";
import Link from "next/link";
import type { LoggedDay } from "@/lib/posts/days";

export default function MonthGrid({ month, days, today, zone }: { month: string; days: LoggedDay[]; today: string; zone: string }) {
  const first = new Date(`${month}-01T12:00:00Z`);
  const count = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  const previous = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() - 1, 1, 12));
  const next = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 1, 12));
  const query = (date: Date) => `/days?month=${date.toISOString().slice(0, 7)}&tz=${encodeURIComponent(zone)}`;
  return <>
    <header className="flex h-top-h items-center justify-between px-screen-x">
      <h1 className="text-title">{first.toLocaleDateString("en", { timeZone: "UTC", month: "long", year: "numeric" })}</h1>
      <Link href={query(previous)} className="flex min-h-tap items-center text-detail text-muted">{previous.toLocaleDateString("en", { timeZone: "UTC", month: "long" })}</Link>
    </header>
    <div style={{ paddingInline: tokens.calendar.outerX }}>
    <div className="grid grid-cols-7" style={{ columnGap: tokens.calendar.columnGap, paddingBlock: tokens.calendar.weekdayY }}>
      {["S", "M", "T", "W", "T", "F", "S"].map((label, index) => <span key={index} className="text-center text-label text-muted">{label}</span>)}
    </div>
    <div className="grid grid-cols-7" style={{ columnGap: tokens.calendar.columnGap, rowGap: tokens.calendar.rowGap }}>
      {Array.from({ length: first.getUTCDay() }, (_, index) => <span key={`blank-${index}`} />)}
      {Array.from({ length: count }, (_, index) => {
        const date = `${month}-${String(index + 1).padStart(2, "0")}`;
        const day = days.find((entry) => entry.date === date);
        return <Link href={`/days/${date}?tz=${encodeURIComponent(zone)}`} key={date} className="flex flex-col items-center" style={{ gap: tokens.calendar.labelGap }} aria-label={`${date}${day ? `, ${Math.round(day.totals.calories)} kcal` : ""}`}>
          <span className={`relative overflow-hidden rounded-tile ${date === today ? "border-text" : ""}`} style={{ width: "100%", maxWidth: tokens.calendar.cell, aspectRatio: "1 / 1", borderWidth: date === today ? tokens.calendar.border : undefined }}>
            {day?.posts[0]?.photoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={day.posts[0].photoUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
            )}
            <span style={{ padding: tokens.calendar.padding }} className={`relative block text-label font-medium ${date > today ? "text-faint" : "text-text"}`}>{index + 1}</span>
          </span>
          <span className="text-bubble text-muted tabular-nums" style={{ height: tokens.calendar.labelHeight, lineHeight: `${tokens.calendar.labelHeight}px` }}>{day ? `${Math.round(day.totals.calories)} kcal` : ""}</span>
        </Link>;
      })}
    </div>
    </div>
    {month < today.slice(0, 7) && <Link href={query(next)} className="mx-screen-x mt-4 flex min-h-tap items-center justify-end text-detail text-muted">{next.toLocaleDateString("en", { timeZone: "UTC", month: "long" })}</Link>}
  </>;
}

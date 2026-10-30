"use client";

import { formatNutrition } from "@/lib/nutrition/totals";
import { tokens } from "@/lib/theme/tokens";
import type { MonthSummary } from "@/lib/posts/days";

export function monthName(month: string, year = false) {
  return new Date(`${month}-01T12:00:00Z`).toLocaleDateString("en", { timeZone: "UTC", month: "long", ...(year ? { year: "numeric" } : {}) });
}
export function formatDayKcal(value: number | null) { return value === null ? "—" : Math.round(value).toLocaleString("en"); }
export function postedLabel(count: number) { return count === 0 ? "No days posted" : `${count} ${count === 1 ? "day" : "days"} posted`; }

export default function MonthGrid({ month, summary, today, selected, onDay }: { month: string; summary: MonthSummary; today: string; selected?: string; onDay: (date: string, cell: HTMLElement) => void }) {
  const first = new Date(`${month}-01T12:00:00Z`);
  const count = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  return <section aria-label={monthName(month, true)} data-month={month} id={`month-${month}`}>
    <div className="flex items-baseline justify-between px-screen-x" style={{ paddingBottom: tokens.spacing.grid + tokens.spacing.grid / 2 }}>
      <h2 className="text-month">{monthName(month, true)}</h2><span className="text-meta text-muted tabular-nums">{postedLabel(summary.posted)}</span>
    </div>
    <div style={{ paddingInline: tokens.spacing["tooltip-x"] }}>
      <div className="grid grid-cols-7 gap-1 pb-1" aria-hidden="true">{["S", "M", "T", "W", "T", "F", "S"].map((label, index) => <span key={index} className="text-center text-bubble text-faint">{label}</span>)}</div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: first.getUTCDay() }, (_, index) => <span key={`blank-${index}`} />)}
        {Array.from({ length: count }, (_, index) => {
          const date = `${month}-${String(index + 1).padStart(2, "0")}`;
          const day = summary.days.find(entry => entry.day === date);
          const enabled = Boolean(day && date <= today);
          const outlined = date === today || date === selected;
          return <button type="button" key={date} data-day={date} disabled={!enabled} onClick={event => onDay(date, event.currentTarget)}
            aria-label={`${date}${day ? `, ${day.posts} ${day.posts === 1 ? "post" : "posts"}${day.ready ? `, ${formatNutrition(day.kcal)} kcal` : ""}` : ""}`}
            className={`flex min-w-0 flex-col justify-between rounded-tile text-left ${day ? "bg-card" : ""} ${date > today ? "text-faint" : "text-text"}`}
            style={{ height: tokens.spacing.tap, padding: `${tokens.spacing.grid}px ${tokens.calendar.padding}px`, border: outlined ? `${tokens.calendar.border}px solid ${tokens.colors.text}` : `${tokens.calendar.border}px solid transparent` }}>
            <span className="text-label font-medium leading-none">{index + 1}</span>
            <span className="text-cell-kcal text-muted tabular-nums">{day?.ready ? formatDayKcal(day.kcal) : ""}</span>
          </button>;
        })}
      </div>
    </div>
  </section>;
}

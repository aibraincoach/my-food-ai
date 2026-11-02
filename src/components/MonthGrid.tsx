"use client";

import {useEffect,useState} from "react";
import { formatCalories } from "@/lib/nutrition/totals";
import { tokens } from "@/lib/theme/tokens";
import type { MonthSummary } from "@/lib/posts/days";

export function monthName(month: string, year = false) {
  return new Date(`${month}-01T12:00:00Z`).toLocaleDateString("en", { timeZone: "UTC", month: "long", ...(year ? { year: "numeric" } : {}) });
}
export function formatDayKcal(value: number | null) { return formatCalories(value,"en"); }
export function postedLabel(count: number) { return count === 0 ? "No days posted" : `${count} ${count === 1 ? "day" : "days"} posted`; }

export default function MonthGrid({ month, summary, today, selected, onDay }: { month: string; summary: MonthSummary; today: string; selected?: string; onDay: (date: string, cell: HTMLElement) => void }) {
  const [desktop,setDesktop]=useState(false);
  useEffect(()=>{const query=matchMedia('(min-width:1024px)');const update=()=>setDesktop(query.matches);update();query.addEventListener('change',update);return()=>query.removeEventListener('change',update);},[]);
  const first = new Date(`${month}-01T12:00:00Z`);
  const count = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  return <section aria-label={monthName(month, true)} data-month={month} id={`month-${month}`} className="desktop:w-full" onKeyDown={event=>{
    if(!matchMedia('(min-width:1024px)').matches)return;
    const step=event.key==='ArrowRight'?1:event.key==='ArrowLeft'?-1:event.key==='ArrowDown'?7:event.key==='ArrowUp'?-7:0;
    if(!step)return;event.preventDefault();
    const buttons=Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button[data-day]'));
    const index=buttons.indexOf(event.target as HTMLButtonElement);const target=buttons[Math.max(0,Math.min(buttons.length-1,index+step))];target?.focus();

  }}>
    <div className="flex items-baseline justify-between px-screen-x" style={{ paddingBottom: tokens.spacing.grid + tokens.spacing.grid / 2 }}>
      <h2 className="text-month desktop:text-[22px]">{monthName(month, true)}</h2><span className="text-meta text-muted tabular-nums">{postedLabel(summary.posted)}</span>
    </div>
    {summary.days.some(day=>day.missing?.length) ? <p className="px-screen-x text-meta text-muted">* Known nutrition shown. Nutrition unavailable: {[...new Set(summary.days.flatMap(day=>day.missing??[]))].join(", ")}</p> : null}
    <div style={{ paddingInline: tokens.spacing["tooltip-x"] }}>
      <div className="grid grid-cols-7 gap-1 pb-1" aria-hidden="true">{["S", "M", "T", "W", "T", "F", "S"].map((label, index) => <span key={index} className="text-center text-bubble text-faint">{label}</span>)}</div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: first.getUTCDay() }, (_, index) => <span key={`blank-${index}`} />)}
        {Array.from({ length: count }, (_, index) => {
          const date = `${month}-${String(index + 1).padStart(2, "0")}`;
          const day = summary.days.find(entry => entry.day === date);
          const enabled = Boolean((day||desktop) && date <= today);
          const outlined = date === today || date === selected;
          return <button type="button" key={date} data-day={date} disabled={!enabled} tabIndex={!day&&!desktop?-1:0} onFocus={event=>{if(matchMedia("(min-width:1024px)").matches)onDay(date,event.currentTarget);}} onClick={event => { if(day || matchMedia("(min-width:1024px)").matches)onDay(date, event.currentTarget); }}
            aria-label={`${date}${day ? `, ${day.posts} ${day.posts === 1 ? "post" : "posts"}${day.ready ? `, ${formatCalories(day.kcal)} kcal${day.missing?.length?`, nutrition unavailable: ${[...new Set(day.missing)].join(", ")}`:""}` : ""}` : ""}`}
            className={`flex min-w-0 flex-col justify-between rounded-tile text-left desktop:!h-[76px] desktop:focus-visible:outline-2 desktop:focus-visible:outline-text ${day ? "bg-card" : ""} ${date > today ? "text-faint" : "text-text"}`}
            style={{ height: tokens.spacing.tap, padding: `${tokens.spacing.grid}px ${tokens.calendar.padding}px`, border: outlined ? `${tokens.calendar.border}px solid ${tokens.colors.text}` : `${tokens.calendar.border}px solid transparent` }}>
            <span className="text-label font-medium leading-none desktop:text-[13px]">{index + 1}</span>
            <span className="text-cell-kcal text-muted tabular-nums desktop:text-[12px]">{day?.ready ? `${formatDayKcal(day.kcal)}${day.missing?.length?"*":""}` : ""}</span>
          </button>;
        })}
      </div>
    </div>
  </section>;
}

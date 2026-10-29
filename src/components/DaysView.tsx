"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/ui/TopBar";
import { Icon } from "@/components/ui/Icon";
import { tokens } from "@/lib/theme/tokens";
import { shiftMonth, validDate, type LoggedDay, type MonthSummary } from "@/lib/posts/days";
import MonthGrid, { monthName } from "@/components/MonthGrid";
import GoToMonthSheet from "@/components/GoToMonthSheet";
import StoryPlayer from "@/components/StoryPlayer";

type Props = { initialMonths: Record<string, MonthSummary>; earliest: string; today: string; zone: string; initialDay?: LoggedDay };
export default function DaysView({ initialMonths, earliest, today, zone, initialDay }: Props) {
  const router = useRouter();
  const [months, setMonths] = useState(initialMonths);
  const monthsRef = useRef(initialMonths);
  const inFlight = useRef(new Map<string, Promise<void>>());
  const [active, setActive] = useState<LoggedDay | null>(initialDay ?? null);
  const [selected, setSelected] = useState<string | undefined>(initialDay?.date);
  const [loadingDay, setLoadingDay] = useState(false);
  const [error, setError] = useState("");
  const [loadingMonth, setLoadingMonth] = useState(false);
  const [menu, setMenu] = useState(false);
  const [counts, setCounts] = useState<Record<string, number> | null>(null);
  const [menuError, setMenuError] = useState("");
  const [menuLoading, setMenuLoading] = useState(false);
  const dayRequest = useRef(0);
  const retry = useRef<(() => void) | null>(null);
  const activeRef = useRef<LoggedDay | null>(initialDay ?? null);
  const previousInitialMonths = useRef(initialMonths);
  const tail = useRef<HTMLDivElement>(null);
  const top = today.slice(0, 7), floor = earliest.slice(0, 7);
  const displayed = Object.keys(months).sort().reverse();
  const last = displayed.at(-1) ?? top;
  const allMonths: string[] = [];
  for (let month = top; month >= floor; month = shiftMonth(month, -1)) allMonths.push(month);
  const url = useCallback((path: string) => `${path}${path.includes("?") ? "&" : "?"}tz=${encodeURIComponent(zone)}`, [zone]);
  const loadMonth = useCallback(async (month: string): Promise<void> => {
    if (monthsRef.current[month]) return;
    const existing = inFlight.current.get(month);
    if (existing) return existing;
    const task = (async () => {
      const response = await fetch(url(`/api/days?month=${month}`), { cache: "no-store" });
      if (!response.ok) throw new Error("The month could not be loaded. Try again.");
      const summary: MonthSummary = await response.json();
      monthsRef.current = { ...monthsRef.current, [month]: summary };
      setMonths(monthsRef.current);
    })();
    inFlight.current.set(month, task);
    try { await task; } finally { inFlight.current.delete(month); }
  }, [url]);
  const loadThrough = useCallback(async (month: string) => {
    const missing: string[] = [];
    for (let value = today.slice(0, 7); value >= month; value = shiftMonth(value, -1)) if (!monthsRef.current[value]) missing.push(value);
    for (let index = 0; index < missing.length; index += 4) await Promise.all(missing.slice(index, index + 4).map(loadMonth));
  }, [today, loadMonth]);
  const scrollMonth = useCallback((month: string) => {
    requestAnimationFrame(() => document.getElementById(`month-${month}`)?.scrollIntoView({ block: "start", behavior: "instant" }));
  }, []);
  const openDay = useCallback(async function requestDay(date: string, updateUrl = true): Promise<void> {
    if (!validDate(date) || date > today) return;
    const request = ++dayRequest.current;
    setLoadingDay(true); setError("");
    try {
      const [response] = await Promise.all([fetch(url(`/api/days?date=${date}`), { cache: "no-store" }), loadThrough(date.slice(0, 7))]);
      if (!response.ok) throw new Error("The day could not be loaded. Try again.");
      const data: { day: LoggedDay } = await response.json();
      if (request !== dayRequest.current) return;
      setSelected(date); activeRef.current = data.day; setActive(data.day);
      scrollMonth(date.slice(0, 7));
      if (updateUrl) window.history.replaceState(null, "", url(`/days/${date}`));
    } catch (failure) {
      if (request === dayRequest.current) {
        retry.current = () => { void requestDay(date, updateUrl); };
        setError(failure instanceof Error ? failure.message : "The day could not be loaded.");
      }
    }
    finally { if (request === dayRequest.current) setLoadingDay(false); }
  }, [today, url, loadThrough, scrollMonth]);
  // Readiness refreshes supply new server props without discarding months already read.
  useEffect(() => {
    monthsRef.current = { ...monthsRef.current, ...initialMonths };
    setMonths(monthsRef.current);
    if (initialDay && activeRef.current?.date === initialDay.date) {
      activeRef.current = initialDay; setActive(initialDay);
    }
    if (previousInitialMonths.current === initialMonths) return;
    previousInitialMonths.current = initialMonths;
    let live = true;
    // A server reconciliation only includes the first two months. Revalidate
    // older loaded records as well, preserving their order and scroll position.
    for (const month of Object.keys(monthsRef.current).filter(value => !initialMonths[value])) {
      void fetch(url(`/api/days?month=${month}`), { cache: "no-store" }).then(async response => {
        if (!response.ok) return;
        const summary: MonthSummary = await response.json();
        if (live) { monthsRef.current = { ...monthsRef.current, [month]: summary }; setMonths(monthsRef.current); }
      }).catch(() => {});
    }
    const activeDate = activeRef.current?.date;
    if (activeDate && initialDay?.date !== activeDate) {
      const request = ++dayRequest.current;
      void fetch(url(`/api/days?date=${activeDate}`), { cache: "no-store" }).then(async response => {
        if (!response.ok) return;
        const data: { day: LoggedDay } = await response.json();
        if (live && request === dayRequest.current && activeRef.current?.date === activeDate) { activeRef.current = data.day; setActive(data.day); }
      }).catch(() => {});
    }
    return () => { live = false; };
  }, [initialMonths, initialDay, url]);
  useEffect(() => {
    if (!initialDay) return;
    let live = true;
    void loadThrough(initialDay.date.slice(0, 7)).then(() => { if (live) scrollMonth(initialDay.date.slice(0, 7)); }).catch(() => { if (live) setError("The month behind this day could not be loaded."); });
    return () => { live = false; };
  }, [initialDay?.date, loadThrough, scrollMonth]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const reconcile = () => {
      const date = window.location.pathname.match(/^\/days\/(2\d{3}-\d{2}-\d{2})$/)?.[1];
      if (date) void openDay(date, false);
      else if (window.location.pathname === "/days") { dayRequest.current++; activeRef.current = null; setActive(null); }
    };
    window.addEventListener("popstate", reconcile);
    return () => window.removeEventListener("popstate", reconcile);
  }, [openDay]);
  useEffect(() => {
    if (last <= floor) return;
    const sentinel = tail.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect(); setLoadingMonth(true); setError("");
      const nextMonth = shiftMonth(last, -1);
      const attempt = () => {
        setLoadingMonth(true); setError("");
        void loadMonth(nextMonth).catch(failure => { retry.current = attempt; setError(failure.message); }).finally(() => setLoadingMonth(false));
      };
      attempt();
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [last, floor, loadMonth]);
  useEffect(() => {
    const refresh = () => {
      const date = window.location.pathname.match(/^\/days\/(2\d{3}-\d{2}-\d{2})$/)?.[1];
      if (date) void openDay(date, false);
      for (const month of Object.keys(monthsRef.current)) {
        void fetch(url(`/api/days?month=${month}`), { cache: "no-store" }).then(async response => {
          if (!response.ok) return;
          const summary: MonthSummary = await response.json();
          monthsRef.current = { ...monthsRef.current, [month]: summary }; setMonths(monthsRef.current);
        }).catch(() => {});
      }
    };
    window.addEventListener("post-settled", refresh);
    return () => window.removeEventListener("post-settled", refresh);
  }, [openDay, url]);
  const showMenu = async () => {
    setMenu(true);
    setMenuLoading(true); setMenuError("");
    try {
      const response = await fetch(url("/api/days?months=1"), { cache: "no-store" });
      if (!response.ok) throw new Error("Posted month counts could not be loaded.");
      const data: { months: Record<string, number> } = await response.json(); setCounts(data.months);
    } catch (failure) { setMenuError(failure instanceof Error ? failure.message : "Posted months could not be loaded."); }
    finally { setMenuLoading(false); }
  };
  const jump = async (month: string) => {
    setMenu(false); setLoadingMonth(true); setError("");
    try { await loadThrough(month); scrollMonth(month); }
    catch (failure) { retry.current = () => { void jump(month); }; setError(failure instanceof Error ? failure.message : "The month could not be loaded."); }
    finally { setLoadingMonth(false); }
  };
  const close = () => {
    dayRequest.current++; activeRef.current = null; setActive(null); setLoadingDay(false);
    window.history.replaceState(null, "", url("/days"));
    if (selected) requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-day="${selected}"]`)?.focus({ preventScroll: true }));
  };
  return <main className="flex flex-1 flex-col">
    <TopBar className="sticky top-0 z-10 bg-surface" title={<h1 className="text-month">Days</h1>}
      left={<Link href="/" className="flex min-h-tap items-center text-body" style={{ marginLeft: -tokens.spacing["tooltip-y"] }}><Icon name="back" size={tokens.radii.pill} strokeWidth={tokens.icon.strongStroke} />Feed</Link>}
      right={<button type="button" onClick={() => { void showMenu(); }} className="flex min-h-tap items-center gap-1 text-detail text-muted" style={{ marginRight: -tokens.spacing.grid * 2 }}>{top.slice(0, 4)}<Icon name="chevron-down" /></button>} />
    <div className="flex flex-col pt-1" style={{ gap: tokens.spacing["icon-small"] + tokens.spacing.grid }}>
      {displayed.map(month => <MonthGrid key={month} month={month} summary={months[month]} today={today} selected={selected} onDay={date => { void openDay(date); }} />)}
      <div ref={tail} className="px-screen-x text-month text-faint" style={{ minHeight: tokens.spacing.tap }}>{monthName(shiftMonth(last, -1), true)}</div>
    </div>
    {loadingMonth || loadingDay ? <p role="status" className="px-screen-x text-meta text-muted">{loadingDay ? "Loading day…" : "Loading months…"}</p> : null}
    {error ? <p role="alert" className="px-screen-x text-meta text-muted">{error}<button type="button" className="ml-2 min-h-tap text-text" onClick={() => { setError(""); if (retry.current) retry.current(); else router.refresh(); }}>Try again</button></p> : null}
    <GoToMonthSheet open={menu} months={allMonths} counts={counts} loading={menuLoading} error={menuError} onClose={() => setMenu(false)} onMonth={month => { void jump(month); }} />
    {active ? <StoryPlayer key={active.date} day={active} zone={zone} onClose={close} onDay={date => { void openDay(date); }} cell={() => document.querySelector<HTMLElement>(`[data-day="${active.date}"]`)?.getBoundingClientRect()} /> : null}
  </main>;
}

"use client";
import DayTotalReview from '@/components/DayTotalReview';
import {DisplayError,displayErrorText} from '@/i18n/display-error';
import {useLocale,useTranslations} from "next-intl";
import {formatDate,formatEnergy,formatNumber} from "@/i18n/format";
import DesktopDays from '@/components/DesktopDays';
import {useDesktop} from "@/lib/ui/use-desktop";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/ui/TopBar";
import { Icon } from "@/components/ui/Icon";
import { tokens } from "@/lib/theme/tokens";
import { shiftMonth, validDate, type LoggedDay, type MonthSummary } from "@/lib/posts/days";
import PhoneCalendar from "@/components/PhoneCalendar";
import GoToMonthSheet from "@/components/GoToMonthSheet";
import StoryPlayer,{dayPostName} from "@/components/StoryPlayer";

type Props = { initialMonths: Record<string, MonthSummary>; initialMonthErrors?: string[]; earliest: string; today: string; zone: string; initialDay?: LoggedDay };
export default function DaysView({ initialMonths, initialMonthErrors, earliest, today, zone, initialDay }: Props) {
  const t=useTranslations("days"),locale=useLocale();
  const router = useRouter();
  const [months, setMonths] = useState(initialMonths);
  const monthsRef = useRef(initialMonths);
  const [monthErrors, setMonthErrors] = useState<string[]>(initialMonthErrors ?? []);
  const inFlight = useRef(new Map<string, Promise<void>>());
  const desktop=useDesktop();
  const [desktopStory,setDesktopStory]=useState(Boolean(initialDay));
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
  const openingDay=useRef<string|null>(null);
  const retry = useRef<(() => void) | null>(null);
  const activeRef = useRef<LoggedDay | null>(initialDay ?? null);
  const previousInitialMonths = useRef(initialMonths);
  const monthScroll=useRef<HTMLDivElement>(null);
  useEffect(()=>{if(desktop&&monthScroll.current)monthScroll.current.scrollTop=monthScroll.current.scrollHeight;},[desktop]);
  const top = today.slice(0, 7), floor = earliest.slice(0, 7);
  const displayed = Object.keys(months).sort().reverse();
  const last = displayed.at(-1) ?? top;
  const allMonths: string[] = [];
  for (let month = top; month >= floor; month = shiftMonth(month, -1)) allMonths.push(month);
  const url = useCallback((path: string) => `${path}${path.includes("?") ? "&" : "?"}tz=${encodeURIComponent(zone)}`, [zone]);
  const loadMonth = useCallback(async (month: string, force = false): Promise<void> => {
    if (monthsRef.current[month] && !force) return;
    const existing = inFlight.current.get(month);
    if (existing) return existing;
    const task = (async () => {
      const response = await fetch(url(`/api/days?month=${month}`), { cache: "no-store" });
      let summary: MonthSummary;
      if (!response.ok) {
        const failure = await response.json();
        if (response.status !== 503 || failure.month !== month || !failure.summary) throw new DisplayError(t("monthLoadFailedRetry"));
        summary = failure.summary;
        setMonthErrors(current => [...new Set([...current, month])]);
      } else {
        summary = await response.json();
        setMonthErrors(current => current.filter(value => value !== month));
      }
      const element=monthScroll.current,oldHeight=element?.scrollHeight??0,oldTop=element?.scrollTop??0;
      monthsRef.current = { ...monthsRef.current, [month]: summary };
      setMonths(monthsRef.current);
      if(matchMedia('(min-width:1024px)').matches)requestAnimationFrame(()=>{if(element)element.scrollTop=oldTop+element.scrollHeight-oldHeight;});
    })();
    inFlight.current.set(month, task);
    try { await task; } finally { inFlight.current.delete(month); }
  }, [url,t]);
  const loadThrough = useCallback(async (month: string) => {
    const missing: string[] = [];
    for (let value = today.slice(0, 7); value >= month; value = shiftMonth(value, -1)) if (!monthsRef.current[value]) missing.push(value);
    for (let index = 0; index < missing.length; index += 4) await Promise.all(missing.slice(index, index + 4).map(value => loadMonth(value)));
  }, [today, loadMonth]);
  const scrollMonth = useCallback((month: string) => {
    requestAnimationFrame(() => document.getElementById(`month-${month}`)?.scrollIntoView({ block: "start", behavior: "instant" }));
  }, []);
  const openDay = useCallback(async function requestDay(date: string, updateUrl = true): Promise<void> {
    if (!validDate(date) || date > today) return;
    if(matchMedia('(min-width:1024px)').matches&&openingDay.current===date)return;
    openingDay.current=date;
    const request = ++dayRequest.current;
    setLoadingDay(true); setError("");
    try {
      const [response] = await Promise.all([fetch(url(`/api/days?date=${date}`), { cache: "no-store" }), loadThrough(date.slice(0, 7))]);
      if (!response.ok) throw new DisplayError(t("dayLoadFailedRetry"));
      const data: { day: LoggedDay } = await response.json();
      if (request !== dayRequest.current) return;
      setSelected(date); activeRef.current = data.day; setActive(data.day);
      if(!matchMedia("(min-width:1024px)").matches)scrollMonth(date.slice(0, 7));
      if (updateUrl && !matchMedia("(min-width:1024px)").matches) window.history.replaceState(null, "", url(`/days/${date}`));
    } catch (failure) {
      if (request === dayRequest.current) {
        retry.current = () => { void requestDay(date, updateUrl); };
        setError(failure instanceof DisplayError ? failure.message : t("dayLoadFailed"));
      }
    }
    finally { if (request === dayRequest.current) {openingDay.current=null;setLoadingDay(false);} }
  }, [today, url, loadThrough, scrollMonth,t]);
  useEffect(()=>{
    const refresh=()=>{
      router.refresh();
      for(const month of Object.keys(monthsRef.current))void loadMonth(month,true).catch(()=>{});
      if(activeRef.current)void openDay(activeRef.current.date,false);
    };
    window.addEventListener('post-deleted',refresh);
    return()=>window.removeEventListener('post-deleted',refresh);
  },[router,loadMonth,openDay]);
  // Readiness refreshes supply new server props without discarding months already read.
  useEffect(() => {
    monthsRef.current = { ...monthsRef.current, ...initialMonths };
    setMonths(monthsRef.current);
    setMonthErrors(current => [...current.filter(month => !initialMonths[month]), ...(initialMonthErrors ?? [])]);
    if (initialDay && activeRef.current?.date === initialDay.date) {
      activeRef.current = initialDay; setActive(initialDay);
    }
    if (previousInitialMonths.current === initialMonths) return;
    previousInitialMonths.current = initialMonths;
    let live = true;
    // A server reconciliation only includes the first two months. Revalidate
    // older loaded records as well, preserving their order and scroll position.
    for (const month of Object.keys(monthsRef.current).filter(value => !initialMonths[value])) {
      void loadMonth(month,true).catch(() => {});
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
  }, [initialMonths, initialMonthErrors, initialDay, url, loadMonth]);
  useEffect(() => {
    if (!initialDay) return;
    let live = true;
    void loadThrough(initialDay.date.slice(0, 7)).then(() => { if (live) scrollMonth(initialDay.date.slice(0, 7)); }).catch(() => { if (live) setError(t("monthBehindDayLoadFailed")); });
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
    const refresh = () => {
      const date = window.location.pathname.match(/^\/days\/(2\d{3}-\d{2}-\d{2})$/)?.[1];
      if (date) void openDay(date, false);
      for (const month of Object.keys(monthsRef.current)) {
        void loadMonth(month,true).catch(() => {});
      }
    };
    window.addEventListener("post-settled", refresh);
    return () => window.removeEventListener("post-settled", refresh);
  }, [openDay, loadMonth]);
  const showMenu = async () => {
    setMenu(true);
    setMenuLoading(true); setMenuError("");
    try {
      const response = await fetch(url("/api/days?months=1"), { cache: "no-store" });
      if (!response.ok) throw new DisplayError(t("monthCountsLoadFailed"));
      const data: { months: Record<string, number> } = await response.json(); setCounts(data.months);
    } catch (failure) { setMenuError(failure instanceof DisplayError ? failure.message : t("monthsLoadFailed")); }
    finally { setMenuLoading(false); }
  };
  const jump = async (month: string) => {
    setMenu(false); setLoadingMonth(true); setError("");
    try { await loadThrough(month); scrollMonth(month); }
    catch (failure) { retry.current = () => { void jump(month); }; setError(failure instanceof DisplayError ? failure.message : t("monthLoadFailed")); }
    finally { setLoadingMonth(false); }
  };
  const close = () => {
    if(matchMedia('(min-width:1024px)').matches){setDesktopStory(false);window.history.replaceState(null,'',url('/days'));if(selected)requestAnimationFrame(()=>document.querySelector<HTMLElement>(`[data-day="${selected}"]`)?.focus({preventScroll:true}));return;}
    setDesktopStory(false);dayRequest.current++; activeRef.current = null; setActive(null); setLoadingDay(false);
    window.history.replaceState(null, "", url("/days"));
    if (selected) requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-day="${selected}"]`)?.focus({ preventScroll: true }));
  };
  const retryMonth = (month: string) => {
    const attempt = () => {
      setError("");
      void loadMonth(month,true).catch(failure => { retry.current = attempt; setError(displayErrorText(failure,t("monthLoadFailed"))); });
    };
    attempt();
  };
  const monthFailures = monthErrors.slice().sort().reverse().map(month => <p key={month} role="alert" className="px-screen-x text-meta text-muted">{t("monthlyDrinksLoadFailed",{month})}<button type="button" className="ml-2 min-h-tap text-text" onClick={() => retryMonth(month)}>{t("tryAgain")}</button></p>);
  if(desktop)return <main className="flex flex-1 flex-col">{monthFailures}<DesktopDays months={months} today={today} earliest={earliest} zone={zone} selected={selected} active={active} onDay={date=>{if(activeRef.current?.date!==date)void openDay(date);}} onMonth={loadMonth} onOpen={date=>{void openDay(date,false).then(()=>{if(activeRef.current?.date===date){setDesktopStory(true);window.history.pushState(null,'',url(`/days/${date}`));}});}}/>{loadingDay?<p role="status" className="px-8">{t("loadingDay")}</p>:null}{error?<p role="alert" className="px-8">{error}</p>:null}{active&&desktopStory?<StoryPlayer key={active.date} day={active} zone={zone} onClose={close} onDay={date=>void openDay(date)} cell={()=>document.querySelector<HTMLElement>(`[data-day="${active.date}"]`)?.getBoundingClientRect()}/>:null}</main>;
  return <main className="flex flex-1 flex-col desktop:mx-auto desktop:w-full desktop:max-w-[1112px] desktop:px-4 desktop:pt-8">
    <TopBar className="sticky top-0 z-10 bg-surface desktop:hidden" title={<h1 className="text-month">{t("title")}</h1>}
      left={<Link href="/" className="flex min-h-tap items-center text-body" style={{ marginLeft: -tokens.spacing["tooltip-y"] }}><Icon name="back" size={tokens.radii.pill} strokeWidth={tokens.icon.strongStroke} />{t("feed")}</Link>}
      right={<button type="button" onClick={() => { void showMenu(); }} className="flex min-h-tap items-center gap-1 text-detail text-muted" style={{ marginRight: -tokens.spacing.grid * 2 }}>{top.slice(0, 4)}<Icon name="chevron-down" /></button>} />
    {monthFailures}
    <div className="desktop:flex desktop:items-start desktop:justify-center desktop:gap-6"><div ref={monthScroll} className="flex flex-col pt-1 desktop:max-h-[calc(100dvh-96px)] desktop:overflow-y-auto desktop:w-[616px] desktop:min-w-0 desktop:flex-1 desktop:max-w-[616px]" style={{ gap: tokens.spacing["icon-small"] + tokens.spacing.grid }}>
      <PhoneCalendar months={months} today={today} selected={selected} onDay={date=>{if(activeRef.current?.date!==date)void openDay(date);}} onOlder={last>floor?()=>{
        const attempt=()=>{setLoadingMonth(true);setError('');void loadMonth(shiftMonth(last,-1)).catch(failure=>{retry.current=attempt;setError(displayErrorText(failure,t("monthLoadFailed")));}).finally(()=>setLoadingMonth(false));};attempt();
      }:undefined}/>
    </div>
    <aside className="hidden desktop:sticky desktop:top-6 desktop:block desktop:w-[440px] desktop:max-w-[44%] desktop:shrink-0 desktop:overflow-hidden desktop:rounded-[16px] desktop:border desktop:border-line desktop:bg-white" aria-label={t("selectedDay")}>
      {active?<><div className="border-b border-hairline px-4 pb-3 pt-4"><h2 className="text-[17px] font-semibold">{formatDate(locale,new Date(`${active.date}T12:00:00Z`),'UTC',{weekday:'long',month:'short',day:'numeric'})}</h2><p className="mt-2 text-detail text-muted">{t('consumedSummary',{kcal:formatEnergy(locale,active.totals.calories),count:active.posts.length,pending:active.pending?'yes':'no',unfinished:formatNumber(locale,active.pending,{useGrouping:false})})}</p></div>
      <DayTotalReview kcal={active.totals.calories} posts={active.posts}/><div>{active.posts.map(post=><Link key={post.id} href={`/?post=${post.id}`} className="flex items-center gap-3 border-b border-hairline px-4 py-[10px]">{post.photoUrl?<img src={post.photoUrl} alt={post.caption||t("mealImage")} className="size-10 rounded-thumb object-cover"/>:<span className="size-10 rounded-thumb bg-card"/>}<span className="min-w-0 flex-1"><span className="block truncate text-body" title={dayPostName(post,t("mealImage"))}>{dayPostName(post,t("mealImage"))}</span>{post.caption.trim()&&post.caption.trim()!==dayPostName(post,t("mealImage"))?<span className="block truncate text-meta text-muted">{post.caption}</span>:null}<span className="text-meta text-muted">{formatDate(locale,new Date(post.eatenAt),zone,{hour:'numeric',minute:'2-digit'})}</span></span><span className="text-meta text-muted">{formatEnergy(locale,post.totals.calories)} kcal</span></Link>)}</div>
      <Link href={url(`/days/${active.date}`)} className="block px-4 py-3 text-body" onClick={event=>{event.preventDefault();setDesktopStory(true);window.history.pushState(null,'',url(`/days/${active.date}`));}}>{t("openDay")}</Link></>:<p className="p-4 text-detail text-muted">{t("chooseDay")}</p>}
    </aside></div>
    {loadingMonth || loadingDay ? <p role="status" className="px-screen-x text-meta text-muted">{loadingDay ? t("loadingDay") : t("loadingMonths")}</p> : null}
    {error ? <p role="alert" className="px-screen-x text-meta text-muted">{error}<button type="button" className="ml-2 min-h-tap text-text" onClick={() => { setError(""); if (retry.current) retry.current(); else router.refresh(); }}>{t("tryAgain")}</button></p> : null}
    <GoToMonthSheet open={menu} months={allMonths} counts={counts} loading={menuLoading} error={menuError} onClose={() => setMenu(false)} onMonth={month => { void jump(month); }} />
    {active && (!desktop||desktopStory) ? <StoryPlayer key={active.date} day={active} zone={zone} onClose={close} onDay={date => { void openDay(date); }} cell={() => document.querySelector<HTMLElement>(`[data-day="${active.date}"]`)?.getBoundingClientRect()} /> : null}
  </main>;
}

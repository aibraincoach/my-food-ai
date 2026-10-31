"use client";
import { unavailableFoods } from "@/lib/nutrition/totals";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {useDeviceTimeZone} from "@/components/LocalTime";
import {formatLocalTime} from "@/lib/time/local";
import Link from "next/link";
import { formatNutrition } from "@/lib/nutrition/totals";
import { intakeLine } from "@/lib/intake/intake";
import { tokens } from "@/lib/theme/tokens";
import { dateInZone, shiftDay, type LoggedDay } from "@/lib/posts/days";
import { ResultsCard } from "@/components/ResultsCard";
import { Icon } from "@/components/ui/Icon";
import { formatDayKcal } from "@/components/MonthGrid";

function subscribeWidth(listener: () => void) {
  window.addEventListener("resize", listener);
  return () => window.removeEventListener("resize", listener);
}
const readWidth = () => Math.min(tokens.spacing.phone, window.innerWidth);
const serverWidth = () => tokens.spacing.phone;

export default function StoryPlayer({ day, zone, onClose, onDay, cell }: { day: LoggedDay; zone: string; onClose: () => void; onDay: (date: string) => void; cell: () => DOMRect | undefined }) {
  const clockZone=useDeviceTimeZone();
  const width = useSyncExternalStore(subscribeWidth, readWidth, serverWidth);
  const dialog = useRef<HTMLDialogElement>(null);
  const story = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const scrollStart = useRef(0);
  const [dragging, setDragging] = useState(false);
  const start = useRef<{ x: number; y: number } | null>(null);
  const gesture = useRef(false);
  const gestureMode = useRef<"scroll" | "dismiss" | "horizontal" | null>(null);
  const closing = useRef(false);
  const [drag, setDrag] = useState(0);
  const [pick, setPick] = useState<string>("totals");
  const [brokenPhotos, setBrokenPhotos] = useState<ReadonlySet<string>>(new Set());
  const photo = (entry: { photoUrl?: string | null }) => entry.photoUrl && !brokenPhotos.has(entry.photoUrl) ? entry.photoUrl : null;
  const photoFailed = (url: string | null) => { if (url) setBrokenPhotos(current => new Set(current).add(url)); };
  const slide = pick === "totals" ? day.posts.length : Math.max(0, day.posts.findIndex(entry => entry.id === pick));
  const setSlide = (index: number) => setPick(index >= day.posts.length ? "totals" : day.posts[index].id);
  const today = dateInZone(new Date(), zone);
  const previous = shiftDay(day.date, -1), next = shiftDay(day.date, 1);
  const post = day.posts[slide];
  const time = (value: string) => clockZone ? formatLocalTime(value,clockZone) : "";
  const title = new Date(`${day.date}T12:00:00Z`).toLocaleDateString("en", { timeZone: "UTC", weekday: "long", month: "short", day: "numeric" });
  const weekday = new Date(`${day.date}T12:00:00Z`).toLocaleDateString("en", { timeZone: "UTC", weekday: "long" });
  const month = new Date(`${day.date}T12:00:00Z`).toLocaleDateString("en", { timeZone: "UTC", month: "long" });
  const previousLabel = new Date(`${previous}T12:00:00Z`).toLocaleDateString("en", { timeZone: "UTC", weekday: "short", month: "short", day: "numeric" });
  const nextLabel = new Date(`${next}T12:00:00Z`).toLocaleDateString("en", { timeZone: "UTC", weekday: "short" });
  useEffect(() => {
    const element = dialog.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (!element?.open) element?.showModal();
    return () => { element?.close(); document.body.style.overflow = previousOverflow; };
  }, []);
  const close = async () => {
    if (closing.current) return;
    closing.current = true;
    const element = story.current, target = cell();
    if (element) {
      const left = (window.innerWidth - width) / 2;
      const scale = 1 - 0.14 * Math.min(drag / 150, 1);
      const transform = target
        ? `translate(${target.left - left}px, ${target.top}px) scale(${target.width / width}, ${target.height / element.offsetHeight})`
        : `translateY(${tokens.spacing.tap}px) scale(0.86)`;
      const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 220;
      try { await element.animate([{ transform: `translate(${(width - width * scale) / 2}px, ${drag}px) scale(${scale})`, transformOrigin: "top left" }, { transform, opacity: 0, borderRadius: tokens.radii.tile, transformOrigin: "top left" }], { duration, easing: "ease-in", fill: "forwards" }).finished; } catch {}
    }
    onClose();
  };
  const adjacent = (date: string) => { if (date <= today && !closing.current) onDay(date); };
  const release = (x: number, y: number) => {
    const origin = start.current; start.current = null; setDragging(false);
    if (!origin) return;
    const dx = x - origin.x, dy = y - origin.y;
    if (gestureMode.current !== "scroll" && gestureMode.current !== "dismiss" && Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) { gesture.current = true; adjacent(dx < 0 ? next : previous); }
    else if (gestureMode.current === "dismiss" && dy > 120) { gesture.current = true; void close(); }
    else if (Math.abs(dy) > 10 || Math.abs(dx) > 10) { gesture.current = true; setDrag(0); }
  };
  return <dialog ref={dialog} aria-label={`Meals on ${title}`} onCancel={event => { event.preventDefault(); void close(); }}
    className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-hidden bg-transparent p-0 text-surface backdrop:bg-transparent">
    <div className="absolute inset-0 bg-text" style={{ opacity: 0.32 * (1 - Math.min(drag / 300, 1)) }} />
    <div ref={story} className="relative mx-auto flex h-dvh w-full max-w-phone flex-col overflow-hidden bg-text pt-safe pb-safe"
      style={{ transform: `translateY(${drag}px) scale(${1 - 0.14 * Math.min(drag / 150, 1)})`, transformOrigin: "top center", borderRadius: drag ? tokens.spacing["field-h"] - tokens.spacing.grid * 2 : 0, boxShadow: drag ? tokens.colors["shadow-story"] : undefined, transition: dragging ? undefined : "transform 220ms ease", touchAction: "none" }}
      onPointerDown={event => { if (event.button !== 0) return; gesture.current = false; gestureMode.current = null; scrollStart.current = content.current?.scrollTop ?? 0; start.current = { x: event.clientX, y: event.clientY }; }}
      onPointerMove={event => {
        const origin = start.current;
        if (!origin) return;
        const dy = event.clientY - origin.y, dx = event.clientX - origin.x;
        if (!gestureMode.current) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) <= 10) return;
          gestureMode.current = Math.abs(dx) > Math.abs(dy) ? "horizontal" : dy > 0 && scrollStart.current <= 0 ? "dismiss" : "scroll";
        }
        gesture.current = true;
        event.currentTarget.setPointerCapture(event.pointerId);
        if (gestureMode.current === "dismiss") { setDragging(true); setDrag(Math.max(0, dy)); }
        else if (gestureMode.current === "scroll" && content.current) content.current.scrollTop = scrollStart.current - dy;
      }}
      onPointerUp={event => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
        release(event.clientX, event.clientY);
      }} onPointerCancel={event => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
        start.current = null; gestureMode.current = null; setDragging(false); setDrag(0);
      }}
      onClickCapture={event => { if (gesture.current) { event.preventDefault(); event.stopPropagation(); } }}>
      <div className="flex gap-1" style={{ padding: `${tokens.spacing.grid * 2}px ${tokens.spacing["sheet-top"]}px 0` }} aria-label={`Slide ${slide + 1} of ${day.posts.length + 1}`}>
        {Array.from({ length: day.posts.length + 1 }, (_, index) => <button type="button" key={index} aria-label={`Show slide ${index + 1}`} onClick={() => setSlide(index)} className={`flex-1 bg-surface ${index > slide ? "opacity-30" : ""}`} style={{ height: tokens.border.hairline * 2 }} />)}
      </div>
      <header className="flex shrink-0 items-center justify-between" style={{ padding: `${tokens.spacing["tooltip-y"]}px ${tokens.spacing["sheet-top"]}px 0 ${tokens.spacing["tooltip-y"]}px` }}>
        <button type="button" onClick={() => { void close(); }} className="flex min-h-tap items-center text-body"><Icon name="back" size={tokens.radii.pill} strokeWidth={tokens.icon.strongStroke} />{month}</button>
        <h1 className="text-body font-semibold">{title}</h1>
        <button type="button" onClick={() => { void close(); }} aria-label="Close day" className="flex size-tap items-center justify-center"><Icon name="close" size={tokens.radii.pill} /></button>
      </header>
      <div ref={content} className="flex min-h-0 flex-1 flex-col gap-7 overflow-y-auto" style={{ paddingBottom: tokens.spacing.tap, touchAction: "none" }}
        onClick={event => {
          if (gesture.current || (event.target as HTMLElement).closest("a,button")) return;
          const rect = event.currentTarget.getBoundingClientRect(), fraction = (event.clientX - rect.left) / rect.width;
          if (fraction < 1 / 3) adjacent(previous);
          else if (fraction > 2 / 3) adjacent(next);
          else setSlide(Math.min(slide + 1, day.posts.length));
        }}>
        {post ? <div className="mt-auto flex shrink-0 flex-col gap-7">
          <div className="aspect-square w-full shrink-0 overflow-hidden">
            {photo(post) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo(post)!} onError={() => photoFailed(post.photoUrl)} alt={post.caption || "Meal"} className="h-full w-full object-cover" />
            ) : <ResultsCard unavailable={unavailableFoods(post.totals)} size={width} time={time(post.eatenAt)} calories={post.totals.calories} protein={post.totals.protein_g} carbs={post.totals.carbs_g} fat={post.totals.fat_g} items={post.items.map(item => ({ name: item.name, grams: item.portion_grams == null ? null : Number(item.portion_grams) }))} />}
          </div>
          <div className="px-screen-x"><p className="text-body">{post.caption}</p><p className="mt-1 text-meta text-faint">{time(post.eatenAt)}</p></div>
        </div> : <div className="mt-auto flex shrink-0 flex-col gap-7 px-screen-x">
          <div><p className="mb-3 text-detail text-faint">Consumed on {weekday}</p><p className="flex items-baseline gap-2"><span className="text-display-day tabular-nums">{formatDayKcal(day.totals.calories)}</span><span className="text-month font-normal text-faint">kcal</span></p></div>
          <div className="grid grid-cols-3 pt-4" style={{ borderTop: `${tokens.border.hairline}px solid ${tokens.colors.surface}`, borderTopColor: `color-mix(in srgb, ${tokens.colors.surface} 14%, transparent)` }}>
            {([[day.totals.protein_g, "protein"], [day.totals.carbs_g, "carbs"], [day.totals.fat_g, "fat"]] as const).map(([value, word]) => <div key={word}><p className="text-day-macro tabular-nums">{formatNutrition(value)} g</p><p className="text-meta text-faint">{word}</p></div>)}
          </div>
          {intakeLine(day.intake) ? <p className="text-meta text-faint tabular-nums">{intakeLine(day.intake)}</p> : null}
          <div className="grid grid-cols-3 gap-2">{day.posts.map(entry => <Link key={entry.id} href={`/posts/${entry.id}`} className="min-w-0">
            <div className="flex aspect-square items-center justify-center overflow-hidden rounded-thumb bg-card text-text">
              {photo(entry) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo(entry)!} onError={() => photoFailed(entry.photoUrl)} alt={entry.caption || "Meal"} className="h-full w-full object-cover" />
              ) : <span className="text-detail tabular-nums">{formatNutrition(entry.totals.calories)} kcal</span>}
            </div>
            <p className="mt-1 flex justify-between gap-1 text-label text-faint tabular-nums"><span>{time(entry.eatenAt)}</span><span>{formatNutrition(entry.totals.calories)} kcal</span></p>
          </Link>)}</div>
        </div>}
        <nav className="flex items-center justify-between px-screen-x text-meta text-muted" aria-label="Adjacent days">
          <button type="button" className="min-h-tap" onClick={() => adjacent(previous)}>‹ {previousLabel}</button><span>Swipe down to close</span><button type="button" disabled={next > today} className="min-h-tap disabled:text-faint" onClick={() => adjacent(next)}>{nextLabel} ›</button>
        </nav>
      </div>
    </div>
  </dialog>;
}

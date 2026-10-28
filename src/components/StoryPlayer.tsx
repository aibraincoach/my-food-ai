"use client";

import { tokens } from "@/lib/theme/tokens";

import { useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ResultsCard } from "@/components/ResultsCard";
import { Icon } from "@/components/ui/Icon";
import type { LoggedDay } from "@/lib/posts/days";

function subscribeWidth(listener: () => void) {
  window.addEventListener("resize", listener);
  return () => window.removeEventListener("resize", listener);
}
const readWidth = () => Math.min(tokens.spacing.phone, window.innerWidth);
const serverWidth = () => tokens.spacing.phone;

export default function StoryPlayer({ day, zone, previous, next }: { day: LoggedDay; zone: string; previous: string; next: string }) {
  const width = useSyncExternalStore(subscribeWidth, readWidth, serverWidth);
  // Keyed by meal id, not index: a refresh can insert a meal while the story is open.
  // null means the reader has not chosen a slide, so the first one follows the data
  // (an empty day shows its totals, then the first meal once one becomes ready).
  const [pick, setPick] = useState<string | null>(null);
  // Signed photo URLs expire; a meal whose photo fails to load falls back to its nutrition card.
  const [brokenPhotos, setBrokenPhotos] = useState<ReadonlySet<string>>(new Set());
  const photo = (entry: { id: string; photoUrl?: string | null }) => entry.photoUrl && !brokenPhotos.has(entry.id) ? entry.photoUrl : null;
  const photoFailed = (id: string) => setBrokenPhotos((current) => new Set(current).add(id));
  const slide = pick === null ? 0 : pick === "totals" ? day.posts.length : Math.max(0, day.posts.findIndex((entry) => entry.id === pick));
  const setSlide = (target: number | ((current: number) => number)) => {
    const index = typeof target === "function" ? target(slide) : target;
    setPick(index >= day.posts.length ? "totals" : day.posts[index].id);
  };
  const start = useRef<{ x: number; y: number } | null>(null);
  const router = useRouter();
  const post = day.posts[slide];
  const time = (value: string) => new Date(value).toLocaleTimeString("en", { timeZone: zone, hour: "numeric", minute: "2-digit" });
  const title = new Date(`${day.date}T12:00:00Z`).toLocaleDateString("en", { timeZone: "UTC", weekday: "long", month: "short", day: "numeric" });
  const weekday = new Date(`${day.date}T12:00:00Z`).toLocaleDateString("en", { timeZone: "UTC", weekday: "long" });
  const adjacent = (date: string) => router.push(`/days/${date}?tz=${encodeURIComponent(zone)}`);
  return <main className="mx-auto flex min-h-dvh w-full max-w-phone flex-col bg-text text-surface"
    onTouchStart={(event) => { const point = event.touches[0]; start.current = { x: point.clientX, y: point.clientY }; }}
    onTouchEnd={(event) => {
      const origin = start.current; start.current = null;
      if (!origin) return;
      const point = event.changedTouches[0], dx = point.clientX - origin.x, dy = point.clientY - origin.y;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) adjacent(dx < 0 ? next : previous);
    }}>
    <div className="flex gap-1 px-screen-x pt-3" aria-label={`Slide ${slide + 1} of ${day.posts.length + 1}`}>
      {Array.from({ length: day.posts.length + 1 }, (_, index) => <button key={index} aria-label={`Show slide ${index + 1}`} onClick={() => setSlide(index)} className="flex min-h-tap flex-1 items-center"><span className={`h-0.5 w-full bg-surface ${index > slide ? "opacity-30" : ""}`} /></button>)}
    </div>
    <header className="flex items-center justify-between px-screen-x">
      <h1 className="text-body font-semibold">{title}</h1>
      <Link href={`/days?month=${day.date.slice(0, 7)}&tz=${encodeURIComponent(zone)}`} aria-label="Close day" className="flex size-tap items-center justify-center"><Icon name="close" /></Link>
    </header>
    <div className="flex flex-1 flex-col justify-end gap-7 pb-14">
      {post ? <>
        <button onClick={() => setSlide((current) => Math.min(current + 1, day.posts.length))} aria-label="Next slide" className="aspect-square w-full overflow-hidden">
          {photo(post) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo(post)!} onError={() => photoFailed(post.id)} alt={post.caption || "Meal"} className="h-full w-full object-cover" />
          ) : <div className="h-full w-full overflow-hidden"><ResultsCard size={width} time={time(post.eatenAt)} calories={post.totals.calories} protein={post.totals.protein_g} carbs={post.totals.carbs_g} fat={post.totals.fat_g} items={post.items.map((item) => ({ name: item.name, grams: item.portion_grams == null ? null : Number(item.portion_grams) }))} /></div>}
        </button>
        <div className="px-screen-x"><p className="text-body">{post.caption}</p><p className="mt-1 text-meta text-faint">{time(post.eatenAt)}</p></div>
      </> : <div className="flex flex-col gap-7 px-screen-x">
        <div><p className="mb-3 text-detail text-faint">Consumed on {weekday}</p><p className="flex items-baseline gap-2"><span className="text-display-day tabular-nums">{Math.round(day.totals.calories)}</span><span className="text-sheet-title font-normal text-faint">kcal</span></p></div>
        <div className="grid grid-cols-3 border-t border-surface/15 pt-4">
          {[[day.totals.protein_g, "protein"], [day.totals.carbs_g, "carbs"], [day.totals.fat_g, "fat"]].map(([value, word]) => <div key={word}><p className="text-day-macro tabular-nums">{Math.round(Number(value))} g</p><p className="text-meta text-faint">{word}</p></div>)}
        </div>
        <div className="grid grid-cols-3 gap-2">{day.posts.map((entry) => <Link key={entry.id} href={`/posts/${entry.id}`} className="min-w-0">
          <div className="flex aspect-square items-center justify-center overflow-hidden rounded-thumb bg-card text-text">
            {photo(entry) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo(entry)!} onError={() => photoFailed(entry.id)} alt={entry.caption || "Meal"} className="h-full w-full object-cover" />
            ) : <span className="text-detail tabular-nums">{Math.round(entry.totals.calories)} kcal</span>}
          </div>
          <p className="mt-1 text-label text-faint tabular-nums">{time(entry.eatenAt)}<br />{Math.round(entry.totals.calories)} kcal</p>
        </Link>)}</div>
      </div>}
      <nav className="flex justify-between px-screen-x text-meta text-faint" aria-label="Adjacent days"><button className="min-h-tap" onClick={() => adjacent(previous)}>Previous day</button><button className="min-h-tap" onClick={() => adjacent(next)}>Next day</button></nav>
    </div>
  </main>;
}

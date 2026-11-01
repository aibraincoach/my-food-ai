"use client";
import { useEffect, useState } from "react";
import type { DrinkCardData } from "@/lib/intake/hydration";

type Waiting = { resolve: (drink: DrinkCardData | null) => void; reject: (error: unknown) => void };
const batches = new Map<string, Map<string, Waiting[]>>();

// Cards mounting together share one HTTP read, without a permanent cache that could
// retain stale food-water totals after a correction. The API shares each day's timeline.
function requestDrink(postId: string, zone: string): Promise<DrinkCardData | null> {
  return new Promise((resolve, reject) => {
    let batch = batches.get(zone);
    if (!batch) {
      batch = new Map();
      batches.set(zone, batch);
      setTimeout(() => {
        const waiting = batches.get(zone)!;
        batches.delete(zone);
        const ids = [...waiting.keys()];
        for (let start = 0; start < ids.length; start += 50) {
          const selected = ids.slice(start, start + 50);
          void fetch(`/api/intake/post?post_ids=${selected.map(encodeURIComponent).join(",")}&tz=${encodeURIComponent(zone)}`)
            .then(async response => {
              if (!response.ok) throw new Error("Drink cards could not be read.");
              const data = await response.json() as { drinks: Record<string, DrinkCardData | null> };
              for (const id of selected) for (const listener of waiting.get(id)!) listener.resolve(data.drinks[id] ?? null);
            }).catch(error => { for (const id of selected) for (const listener of waiting.get(id)!) listener.reject(error); });
        }
      }, 0);
    }
    batch.set(postId, [...(batch.get(postId) ?? []), { resolve, reject }]);
  });
}

export function useDrinkCard(postId: string, status: string, eatenAt: string, initial?: DrinkCardData | null): DrinkCardData | null {
  const [value, setValue] = useState<{ id: string; drink: DrinkCardData | null; initial: DrinkCardData | null | undefined } | null>(null);
  useEffect(() => {
    if (status !== "ready" || initial === null) return;
    let active = true;
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let attempt = 0;
    let inFlight = false;
    let refreshPending = false;
    const read = async () => {
      if (!active) return;
      if (inFlight) { refreshPending = true; return; }
      inFlight = true;
      try {
        const drink = await requestDrink(postId, zone);
        if (active) setValue({ id: postId, drink, initial });
        if (active && !drink && attempt++ < 3) timer = setTimeout(read, 1000 * attempt);
      } catch {
        if (active && attempt++ < 3) timer = setTimeout(read, 1000 * attempt);
      } finally {
        inFlight = false;
        if (active && refreshPending) { refreshPending = false; clearTimeout(timer); void read(); }
      }
    };
    const refresh = () => { clearTimeout(timer); attempt = 0; void read(); };
    const visible = () => { if (document.visibilityState === "visible") refresh(); };
    window.addEventListener("post-created", refresh);
    window.addEventListener("post-ready", refresh);
    window.addEventListener("online", refresh);
    document.addEventListener("visibilitychange", visible);
    // Feed/detail hydration was read in the page batch. Refresh it on an event,
    // rather than immediately issuing the same day read again for each mount.
    if (initial === undefined) void read();
    return () => { active = false; clearTimeout(timer); window.removeEventListener("post-created", refresh); window.removeEventListener("post-ready", refresh);
      window.removeEventListener("online", refresh); document.removeEventListener("visibilitychange", visible); };
  }, [postId, status, eatenAt, initial]);
  return value?.id === postId && value.initial === initial ? value.drink : initial ?? null;
}

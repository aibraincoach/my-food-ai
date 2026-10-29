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

export function useDrinkCard(postId: string, status: string, eatenAt: string): DrinkCardData | null {
  const [value, setValue] = useState<{ id: string; drink: DrinkCardData | null } | null>(null);
  useEffect(() => {
    if (status !== "ready") return;
    let active = true;
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    void requestDrink(postId, zone).then(drink => { if (active) setValue({ id: postId, drink }); }).catch(() => {});
    return () => { active = false; };
  }, [postId, status, eatenAt]);
  return value?.id === postId ? value.drink : null;
}

"use client";
import { useEffect, useState } from "react";
import type { DrinkCardData } from "@/lib/intake/hydration";

export function useDrinkCard(postId: string, status: string, eatenAt: string): DrinkCardData | null {
  const [value, setValue] = useState<{ id: string; drink: DrinkCardData | null } | null>(null);
  useEffect(() => {
    if (status !== "ready") return;
    const controller = new AbortController();
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    void fetch(`/api/intake/post?post_id=${encodeURIComponent(postId)}&tz=${encodeURIComponent(zone)}`, { signal: controller.signal })
      .then(async response => { if (response.ok) setValue({ id: postId, drink: (await response.json()).drink }); })
      .catch(() => {});
    return () => controller.abort();
  }, [postId, status, eatenAt]);
  return value?.id === postId ? value.drink : null;
}

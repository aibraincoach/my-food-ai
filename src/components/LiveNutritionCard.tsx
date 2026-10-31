"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ResultsCard } from "@/components/ResultsCard";
import { sumNutrition, toNumber, unavailableFoods, type NutritionLike, type Numeric } from "@/lib/nutrition/totals";
import { tokens } from "@/lib/theme/tokens";
import type { DrinkCardData } from "@/lib/intake/hydration";

export type CardNutritionItem = NutritionLike & { name: string; portion_grams: Numeric };
function subscribeClock(listener: () => void) {
  window.addEventListener("focus", listener);
  window.addEventListener("pageshow", listener);
  document.addEventListener("visibilitychange", listener);
  return () => {
    window.removeEventListener("focus", listener);
    window.removeEventListener("pageshow", listener);
    document.removeEventListener("visibilitychange", listener);
  };
}

// Both the server and the first hydrated render omit the clock. The browser then
// formats the actual instant in its own zone; a server's zone never leaks into it.
export default function LiveNutritionCard({ items, eatenAt, drink }: { items: CardNutritionItem[]; eatenAt: string; drink?: DrinkCardData | null }) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number>(tokens.spacing.phone);
  const time = useSyncExternalStore(subscribeClock, () => {
    const date = new Date(eatenAt);
    return Number.isFinite(date.getTime()) ? date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }) : "";
  }, () => "");
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width > 0) setWidth(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const totals = sumNutrition(items);
  return <div ref={ref} className="aspect-square w-full overflow-hidden bg-card" aria-label="Meal nutrition summary">
    <ResultsCard size={width} time={time} drink={drink} unavailable={unavailableFoods(totals)}
      calories={totals.calories} protein={totals.protein_g} carbs={totals.carbs_g} fat={totals.fat_g}
      items={items.map(item => ({ name: item.name, grams: item.portion_grams == null ? null : toNumber(item.portion_grams) }))} />
  </div>;
}

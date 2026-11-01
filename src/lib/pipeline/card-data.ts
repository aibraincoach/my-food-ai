import type { SupabaseClient } from "@supabase/supabase-js";
import { getPostHydrationData, type DrinkCardData, type HydrationRecord } from "@/lib/intake/hydration";
import { sumNutrition, toNumber, unavailableFoods, type Numeric, type NutritionLike, type StoredNutrient } from "@/lib/nutrition/totals";

export type CardItem = NutritionLike & { name: string; portion_grams: Numeric; portion_text?: string | null; micronutrients?: StoredNutrient[] };
export interface CardData {
  kind: "meal" | "drink";
  /** An instant, formatted in the viewing device's zone by the live wrapper. */
  time?: string;
  amountMl?: number;
  drinkLine?: string;
  caffeineMg?: number;
  hydration?: HydrationRecord;
  kcal?: number | null;
  macros?: { protein: number | null; carbs: number | null; fat: number | null };
  items?: { name: string; grams: number | null }[];
  unavailable?: string[];
  waterLine?: string;
  footer?: string;
}
export interface CardSource {
  items: CardItem[];
  eaten_at?: string;
  eatenAt?: string;
  drink?: DrinkCardData | null;
  kind?: "meal" | "drink";
  foodWaterMl?: number;
  dayHydration?: HydrationRecord;
  footer?: string;
}

/** All live cards and stored PNGs use this one presentation data builder. */
export function cardDataFromRow(source: CardSource): CardData {
  const totals = sumNutrition(source.items);
  const drink = source.drink;
  const hydration = source.dayHydration ?? (drink ? { totalMl: drink.totalMl, drinksMl: drink.drinksMl, foodMl: drink.foodMl, caffeineMg: drink.dayCaffeineMg ?? drink.caffeineMg } : undefined);
  return {
    kind: drink || source.kind === "drink" ? "drink" : "meal",
    time: source.eaten_at ?? source.eatenAt,
    amountMl: drink?.ml,
    caffeineMg: drink?.caffeineMg,
    drinkLine: drink ? `${drink.label}${drink.caffeineMg ? ` · ${Math.round(drink.caffeineMg)} mg caffeine · ${totals.calories === null ? "unavailable" : Math.round(totals.calories)} kcal` : ""}` : undefined,
    hydration,
    kcal: totals.calories,
    macros: { protein: totals.protein_g, carbs: totals.carbs_g, fat: totals.fat_g },
    items: source.items.map(item => ({ name: item.name, grams: item.portion_grams == null ? null : toNumber(item.portion_grams) })),
    unavailable: unavailableFoods(totals),
    waterLine: (source.foodWaterMl ?? 0) >= 50 && hydration ? `Water in this meal: ${Math.round(source.foodWaterMl!).toLocaleString("en-US")} ml · Consumed today: ${hydration.totalMl.toLocaleString("en-US")} ml` : undefined,
    footer: source.footer,
  };
}
export const buildCardData = cardDataFromRow;

/** Read presentation fields with owner-scoped access; callers may provide their
 * atomic nutrition snapshot, preserving the renderer's publication fingerprint. */
export async function readCardData(db: SupabaseClient, userId: string, post: { id: string; eaten_at: string; items: CardItem[] }, zone = "UTC"): Promise<CardData> {
  const values = await getPostHydrationData(db, userId, [{ ...post, items: post.items.map(item => ({ ...item, micronutrients: item.micronutrients ?? [] })) }], zone);
  return cardDataFromRow({ ...post, ...values[post.id] });
}

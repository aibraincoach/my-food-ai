import { formatNutrition, unavailableFoods, type MissingNutrition } from "@/lib/nutrition/totals";
export { checkWording } from "./wording-check";
export type ConsumedTotals = { missing?: MissingNutrition; calories: number | null; protein_g: number | null; carbs_g: number | null; fat_g: number | null };
export function plainConsumed(totals: ConsumedTotals): string {
  const value = (n: number | null) => n !== null && Number.isFinite(n) ? formatNutrition(n) : "unavailable";
  const missing=unavailableFoods(totals);
  return `Consumed: ${value(totals.calories)} kcal · ${value(totals.protein_g)} g protein · ${value(totals.carbs_g)} g carbs · ${value(totals.fat_g)} g fat.${missing.length?` Nutrition unavailable: ${missing.join(", ")}.`:""}`;
}
// Nutrition text is always formatted from the calculation. Caption text is stored separately.
export async function safeSummary(_text: string, totals: ConsumedTotals): Promise<string> {
  return plainConsumed(totals);
}

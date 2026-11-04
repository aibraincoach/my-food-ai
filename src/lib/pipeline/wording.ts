import { formatCalories, formatNutrition, unavailableFoods, type MissingNutrition } from "@/lib/nutrition/totals";
export { checkWording } from "./wording-check";
export type ConsumedTotals = { missing?: MissingNutrition; calories: number | null; protein_g: number | null; carbs_g: number | null; fat_g: number | null };
export function plainConsumed(totals: ConsumedTotals, approximations: {name:string;basis:string}[] = []): string {
  const value = (n: number | null) => n !== null && Number.isFinite(n) ? formatNutrition(n) : "unavailable";
  const missing=unavailableFoods(totals);
  return `Consumed: ${totals.calories === null ? "unavailable" : formatCalories(totals.calories)} kcal · ${value(totals.protein_g)} g protein · ${value(totals.carbs_g)} g carbs · ${value(totals.fat_g)} g fat.${missing.length?` Nutrition unavailable: ${missing.join(", ")}.`:""}${approximations.map(a=>` Nutrition for ${a.name} is taken from the closest USDA record, ${a.basis}.`).join("")}`;
}
// Nutrition text is always formatted from the calculation. Caption text is stored separately.
export async function safeSummary(_text: string, totals: ConsumedTotals, approximations: {name:string;basis:string}[] = []): Promise<string> {
  return plainConsumed(totals, approximations);
}

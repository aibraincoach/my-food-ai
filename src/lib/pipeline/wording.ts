import { unavailableSentence } from "@/lib/fdc/unavailable";
import { formatCalories, formatNutrition, unavailableFoods, type MissingNutrition } from "@/lib/nutrition/totals";
export { checkWording } from "./wording-check";
export type ConsumedTotals = { missing?: MissingNutrition; calories: number | null; protein_g: number | null; carbs_g: number | null; fat_g: number | null };
export function plainConsumed(totals: ConsumedTotals, approximations: {name:string;basis:string;kind?:'closest'|'estimate'}[] = [], unavailable: {name:string;sourceRef:unknown}[] = []): string {
  const value = (n: number | null) => n !== null && Number.isFinite(n) ? formatNutrition(n) : "unavailable";
  const missing=unavailableFoods(totals);
  return `Consumed: ${totals.calories === null ? "unavailable" : formatCalories(totals.calories)} kcal · ${value(totals.protein_g)} g protein · ${value(totals.carbs_g)} g carbs · ${value(totals.fat_g)} g fat.${missing.length?` Nutrition unavailable: ${missing.join(", ")}.`:""}${unavailable.map(u=>unavailableSentence(u.name,u.sourceRef,false)).filter(Boolean).map(s=>` ${s}`).join("")}${approximations.map(a=>a.kind==='estimate'?` Nutrition for ${a.name} is a model estimate, ${a.basis}.`:` Nutrition for ${a.name} is taken from the closest USDA record, ${a.basis}.`).join("")}`;
}
// Nutrition text is always formatted from the calculation. Caption text is stored separately.
export async function safeSummary(_text: string, totals: ConsumedTotals, approximations: {name:string;basis:string;kind?:'closest'|'estimate'}[] = [], unavailable: {name:string;sourceRef:unknown}[] = []): Promise<string> {
  return plainConsumed(totals, approximations, unavailable);
}

import type { FdcFood } from "@/lib/fdc/client";
import { scaleNutrition } from "./nutrients";

// What one "serving" of a search result is: the label's gram serving for Branded foods, otherwise 100 g.
export function servingGrams(food: FdcFood): number {
  return food.servingSize && food.servingSize > 0 && food.servingSizeUnit?.toLowerCase() === "g" ? food.servingSize : 100;
}

export function caloriesPerServing(food: FdcFood): number | null {
  const calories = scaleNutrition(food, servingGrams(food)).calories;
  return calories === null ? null : Math.round(calories);
}

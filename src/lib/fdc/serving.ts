import type { FdcFood } from "@/lib/fdc/client";
import { nutritionBasis, scaleNutrition } from "./nutrients";

// USDA GBFPD, Standardizing and Presenting GBFPD Data:
// https://fdc.nal.usda.gov/GBFPD_Documentation/
// "Data are converted to a 100-unit basis, either gram (g) or milliliter (ml),
// depending on which was received from the data provider."
export function servingPortion(food: FdcFood): { amount: number; unit: "g" | "ml" } {
  if (food.servingSize && food.servingSize > 0) {
    if (food.servingSizeUnit?.toLowerCase() === "g") return { amount: food.servingSize, unit: "g" };
    if (nutritionBasis(food) === "ml") return { amount: food.servingSize, unit: "ml" };
  }
  return { amount: 100, unit: "g" };
}

export function caloriesPerServing(food: FdcFood): number | null {
  const portion = servingPortion(food);
  const calories = scaleNutrition(food, portion.amount, null, portion.unit).calories;
  return calories === null ? null : Math.round(calories);
}

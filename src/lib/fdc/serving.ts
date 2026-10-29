import type { FdcFood } from "@/lib/fdc/client";

// What one "serving" of a search result is: the label's gram serving for Branded foods, otherwise 100 g.
export function servingGrams(food: FdcFood): number {
  return food.servingSize && food.servingSize > 0 && food.servingSizeUnit?.toLowerCase() === "g" ? food.servingSize : 100;
}

export function caloriesPerServing(food: FdcFood): number | null {
  const energy = food.foodNutrients.find((nutrient) => nutrient.nutrientId === 1008);
  return energy ? Math.round(energy.value * servingGrams(food) / 100) : null;
}

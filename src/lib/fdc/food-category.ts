// Shared parser for USDA search, detail and barcode reference shapes.
export function foodCategory(payload: Record<string, unknown>): string | undefined {
  const legacy = payload.foodCategory;
  const survey = payload.wweiaFoodCategory as { wweiaFoodCategoryDescription?: unknown } | undefined;
  const category = typeof legacy === "string" ? legacy
    : legacy && typeof legacy === "object" ? (legacy as { description?: unknown }).description : undefined;
  const value = category ?? survey?.wweiaFoodCategoryDescription ?? payload.brandedFoodCategory;
  return typeof value === "string" && value.trim() ? value.trim().toLowerCase() : undefined;
}

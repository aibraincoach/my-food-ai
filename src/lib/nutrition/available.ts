/** True when any core macro is missing — such rows must not be reused or certified. */
export function nutritionUnavailable(row: {
  calories?: unknown;
  protein_g?: unknown;
  carbs_g?: unknown;
  fat_g?: unknown;
}): boolean {
  return (
    row.calories == null ||
    row.protein_g == null ||
    row.carbs_g == null ||
    row.fat_g == null
  );
}

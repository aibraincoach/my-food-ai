import { FOOD_MATCH_VERSION } from "@/lib/fdc/version";

// The producer certifies these rows only after checking their stored matching
// provenance. Older producers must not bypass the new analysis during rollout.
export function certifiedPriorNutrition(rows: Record<string, unknown>[] | undefined): boolean {
  return Boolean(rows?.length) && rows!.every(row=>row.matcher_version===FOOD_MATCH_VERSION);
}

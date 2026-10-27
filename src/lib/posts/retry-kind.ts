export function retryKind(failedKind: unknown): "analyze" | "correct" | "recompute" | null {
  if (failedKind === "card_backfill") return "recompute";
  return failedKind === "analyze" || failedKind === "correct" || failedKind === "recompute" ? failedKind : null;
}

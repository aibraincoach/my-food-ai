export function retryKind(failedKind: unknown, initialized?: boolean): "analyze" | "correct" | "recompute" | null {
  if (initialized === false) return "analyze";
  if (initialized === true && failedKind === "analyze") return "recompute";
  if (failedKind === "card_backfill") return "recompute";
  return failedKind === "analyze" || failedKind === "correct" || failedKind === "recompute" ? failedKind : null;
}

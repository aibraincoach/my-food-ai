import { createAdminClient } from "@/lib/supabase/admin";
import { traceContext } from "./context";

export type CallKind = "sam" | "spark_identify" | "spark_correct" | "spark_same_meal" | "spark_search" | "fdc" | "transcribe";
type Details = { text?: unknown; usage?: { input_tokens?: number; output_tokens?: number } | null; fdcId?: number | null };

// Keep readable prompts/results, but never persist image/audio bytes, masks,
// signed media URLs, or credentials accidentally embedded in a structured call.
export function traceText(value: unknown): string {
  const safe = JSON.stringify(value, (key, entry: unknown) => {
    if (/image_url|audio|raster|mask|authorization|api[_-]?key|token$|secret/i.test(key)) return "[omitted]";
    if (ArrayBuffer.isView(entry) || entry instanceof ArrayBuffer) return "[binary omitted]";
    if (typeof entry === "string") return entry
      .replace(/data:[^\s"']+/gi, "[data omitted]")
      .replace(/https?:\/\/[^\s"']+/gi, "[URL omitted]");
    return entry;
  });
  return (safe ?? "").slice(0, 60000);
}

export async function recordCall<T>(kind: CallKind, requestText: unknown, fn: () => Promise<T>, describe: (value: T) => Details = (value) => ({ text: value })): Promise<T> {
  const started = Date.now();
  const startedAt = new Date(started).toISOString();
  let details: Details = {};
  let failure: string | null = null;
  try {
    const value = await fn(); details = describe(value); return value;
  } catch (error) {
    const status = typeof (error as { status?: unknown })?.status === "number" ? (error as { status: number }).status : null;
    // Exception bodies can contain credentials or image data. Record category/status only.
    failure = `${error instanceof Error ? error.name : "CallError"}${status === null ? "" : ` (status ${status})`}`;
    throw error;
  } finally {
    try {
      const finite = (value?: number) => typeof value === "number" && Number.isFinite(value) && value >= 0 ? Math.round(value) : null;
      const { error } = await createAdminClient().from("model_calls").insert({
        post_id: traceContext.getStore()?.postId ?? null, kind, started_at: startedAt,
        duration_ms: Math.min(2147483647, Date.now() - started),
        input_tokens: finite(details.usage?.input_tokens), output_tokens: finite(details.usage?.output_tokens),
        request_text: traceText(requestText), response_text: details.text === undefined ? null : traceText(details.text),
        fdc_id: finite(details.fdcId ?? undefined), error: failure,
      });
      if (error) console.error("Model trace could not be stored.");
    } catch { console.error("Model trace could not be stored."); }
  }
}

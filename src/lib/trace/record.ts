import { createAdminClient } from "@/lib/supabase/admin";
import { traceContext } from "./context";

export type CallKind = "sam" | "spark_identify" | "spark_correct" | "spark_same_meal" | "spark_search" | "fdc" | "transcribe";
type Details = { text?: unknown; usage?: { input_tokens?: number; output_tokens?: number } | null; fdcId?: number | null };

const SENSITIVE_KEY = /image_url|audio|raster|mask|authorization|api[_-]?key|token$|secret/i;
export const TRACE_WRITE_TIMEOUT_MS = 3000;

// Credentials typed into free text (a caption, a transcript, a model reply) have no key name to filter on.
function redactCredentials(text: string): string {
  return text
    .replace(/\bBearer\s+[A-Za-z0-9._~+\/=-]{6,}/gi, "Bearer [credential omitted]")
    .replace(/\b(authorization|api[_-]?key|access[_-]?token|refresh[_-]?token|secret|password)\b(\s*[:=]\s*|"\s*:\s*")(?:Bearer\s+)?[^\s"',;}]+/gi, "$1$2[credential omitted]");
}

// Keep readable prompts/results, but never persist image/audio bytes, masks,
// signed media URLs, or credentials accidentally embedded in a structured call or in text.
export function traceText(value: unknown): string {
  const safe = JSON.stringify(value, function (key, entry: unknown) {
    if (SENSITIVE_KEY.test(key)) return "[omitted]";
    if (ArrayBuffer.isView(entry) || entry instanceof ArrayBuffer) return "[binary omitted]";
    if (typeof entry === "string") {
      // JSON text (a model reply, a serialized thread) is inspected as a structure, so its keys are filtered too.
      const trimmed = entry.trim();
      if ((trimmed.startsWith("{") || trimmed.startsWith("[")) && trimmed.length < 200000) {
        try { return traceText(JSON.parse(trimmed)); } catch { /* not JSON: fall through */ }
      }
      return redactCredentials(entry)
        .replace(/data:[^\s"']+/gi, "[data omitted]")
        .replace(/https?:\/\/[^\s"']+/gi, "[URL omitted]");
    }
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
      // The write has its own deadline: a stalled trace store must never hold back a finished model call.
      const { error } = await createAdminClient().from("model_calls").insert({
        post_id: traceContext.getStore()?.postId ?? null, kind, started_at: startedAt,
        duration_ms: Math.min(2147483647, Date.now() - started),
        input_tokens: finite(details.usage?.input_tokens), output_tokens: finite(details.usage?.output_tokens),
        request_text: traceText(requestText), response_text: details.text === undefined ? null : traceText(details.text),
        fdc_id: finite(details.fdcId ?? undefined), error: failure,
      }).abortSignal(AbortSignal.timeout(TRACE_WRITE_TIMEOUT_MS));
      if (error) console.error("Model trace could not be stored.");
    } catch { console.error("Model trace could not be stored."); }
  }
}

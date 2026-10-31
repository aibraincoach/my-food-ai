import { recordCall, type CallKind } from "@/lib/trace/record";
import OpenAI from "openai";
import { ApiError, isRetriable } from "@/lib/worker/errors";

// The one fetch wrapper for the Meta Model API (section 4).
// Base URL https://api.meta.ai/v1, header Authorization: Bearer $MODEL_API_KEY.
// Keys stay server-side; nothing here runs in the browser.

// P6: Vercel effective production config.functionTimeout=300 seconds (fluid),
// verified through v13 REST on 2026-10-27.
// Two 30-second calls plus at most 10 seconds waiting fit that duration.
export const TIMEOUT_MS = 30000;
export const MAX_RETRIES = 1;
export const MAX_RETRY_AFTER_S = 10;

export const META_API_BASE_URL = process.env.MODEL_API_BASE_URL || "https://api.meta.ai/v1";

export function metaApiKey(): string {
  const key = process.env.MODEL_API_KEY;
  if (!key) {
    throw new Error("meta: MODEL_API_KEY is not set.");
  }
  return key;
}

export class MetaApiError extends ApiError {
  readonly code: string | undefined;

  constructor(status: number, message: string, code?: string, body = "") {
    super(status, body, message);
    this.name = "MetaApiError";
    this.code = code;
  }
}

function errorCode(payload: unknown): string | undefined {
  if (typeof payload !== "object" || payload === null) return undefined;
  const error = (payload as { error?: unknown }).error;
  if (typeof error === "object" && error !== null) {
    const code = (error as { code?: unknown }).code;
    return typeof code === "string" ? code : undefined;
  }
  return undefined;
}

function retryAfterSeconds(headers: Headers): number | null {
  const millis = headers.get("retry-after-ms")?.trim();
  if (millis && Number.isFinite(Number(millis))) return Math.max(0, Number(millis) / 1000);
  const value = headers.get("retry-after")?.trim();
  if (!value) return null;
  if (Number.isFinite(Number(value))) return Math.max(0, Number(value));
  const date = Date.parse(value);
  return Number.isFinite(date) ? Math.max(0, (date - Date.now()) / 1000) : null;
}

function retryable(status: number): boolean {
  return status === 429 || status >= 500;
}

// Buffer before exposing a response so header and body timeouts share one
// retry boundary. SDK SSE consumers still receive the original event bytes.
async function bufferedResponse(response: Response, headers = response.headers): Promise<Response> {
  const body = response.body === null ? null : await response.arrayBuffer();
  return new Response(body, {status: response.status, statusText: response.statusText, headers});
}

// SDK retries use these same limits. Its documented override header prevents
// the SDK's longer Retry-After allowance from extending the job attempt.
export function createMetaClient(): OpenAI {
  return new OpenAI({ baseURL: META_API_BASE_URL, apiKey: metaApiKey(), timeout: TIMEOUT_MS, maxRetries: MAX_RETRIES,
    fetch: async (input, init) => {
      const response = await fetch(input, init);
      const wait = retryAfterSeconds(response.headers);
      const headers = new Headers(response.headers);
      const noRetry = !retryable(response.status) || (wait !== null && wait > MAX_RETRY_AFTER_S);
      if (noRetry) headers.set("x-should-retry", "false");
      try { return await bufferedResponse(response, headers); }
      catch (error) {
        // An already known permanent HTTP error must not become a transport
        // retry merely because its diagnostic body stalled.
        if (!response.ok && noRetry) return new Response(null, {status: response.status, headers});
        throw error;
      }
    },
  });
}

export async function metaFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${metaApiKey()}`);
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    let response: Response | undefined;
    const timeout = AbortSignal.timeout(TIMEOUT_MS);
    const signal = init.signal ? AbortSignal.any([init.signal, timeout]) : timeout;
    try {
      response = await fetch(`${META_API_BASE_URL}${path}`, { ...init, headers, signal });
      const wait = retryAfterSeconds(response.headers);
      // Retryable error responses can be cancelled immediately below; all
      // success/final bodies must finish within this attempt's timeout.
      const willRetry = !response.ok && attempt < MAX_RETRIES && retryable(response.status)
        && (wait === null || wait <= MAX_RETRY_AFTER_S);
      if (!willRetry) response = await bufferedResponse(response);
    } catch (error) {
      if (init.signal?.aborted) throw error;
      if (response && !response.ok) {
        const wait = retryAfterSeconds(response.headers);
        if (!retryable(response.status) || (wait !== null && wait > MAX_RETRY_AFTER_S))
          throw new MetaApiError(response.status, `meta: ${path} failed with ${response.status}.`);
      }
      if (!timeout.aborted && !isRetriable(error)) throw error;
      if (attempt < MAX_RETRIES) continue;
      // Preserve the timeout/transport cause for the worker classifier.
      throw error;
    }
    if (response.ok) return response;
    const wait = retryAfterSeconds(response.headers);
    if (attempt < MAX_RETRIES && retryable(response.status) && (wait === null || wait <= MAX_RETRY_AFTER_S)) {
      await response.body?.cancel();
      await new Promise<void>((resolve, reject) => {
        const abort = () => { clearTimeout(timer); reject(init.signal?.reason); };
        const timer = setTimeout(() => { init.signal?.removeEventListener("abort", abort); resolve(); }, (wait ?? 0.5) * 1000);
        if (init.signal?.aborted) abort();
        else init.signal?.addEventListener("abort", abort, { once: true });
      });
      continue;
    }
    const body = await response.text();
    let code: string | undefined;
    try { code = errorCode(JSON.parse(body)); } catch { /* Non-JSON errors retain their HTTP status. */ }
    throw new MetaApiError(response.status, `meta: ${path} failed with ${response.status}.`, code, body);
  }
  throw new MetaApiError(503, "meta: retry limit reached.");
}

export interface ResponseOutput {
  status: string;
  outputText: string | null;
  outputTextPath: string | null;
  refusal: boolean;
  usage: { input_tokens: number; output_tokens: number } | null;
}

// Reads a non-streaming /v1/responses body: status, the first
// type:"output_text" block and where it sits, refusal blocks, usage.
export function readResponseOutput(payload: unknown): ResponseOutput {
  const root =
    typeof payload === "object" && payload !== null
      ? (payload as Record<string, unknown>)
      : {};
  const status = typeof root.status === "string" ? root.status : "unknown";
  const output = Array.isArray(root.output) ? root.output : [];
  let outputText: string | null = null;
  let outputTextPath: string | null = null;
  let refusal = false;
  for (let i = 0; i < output.length; i += 1) {
    const item = output[i] as { type?: unknown; content?: unknown };
    if (item.type === "refusal") refusal = true;
    if (item.type !== "message" || !Array.isArray(item.content)) continue;
    for (let j = 0; j < item.content.length; j += 1) {
      const block = item.content[j] as { type?: unknown; text?: unknown };
      if (block.type === "refusal") refusal = true;
      if (
        outputText === null &&
        block.type === "output_text" &&
        typeof block.text === "string"
      ) {
        outputText = block.text;
        outputTextPath = `output[${i}].content[${j}].text`;
      }
    }
  }
  const usage = root.usage as ResponseOutput["usage"];
  return {
    status,
    outputText,
    outputTextPath,
    refusal,
    usage:
      usage &&
      typeof usage.input_tokens === "number" &&
      typeof usage.output_tokens === "number"
        ? { input_tokens: usage.input_tokens, output_tokens: usage.output_tokens }
        : null,
  };
}

export async function createResponse(
  body: Record<string, unknown>,
  options: {signal?:AbortSignal} = {}
): Promise<ResponseOutput> {
  const format = (body.text as { format?: { name?: string } } | undefined)?.format?.name;
  const kind: CallKind = format === "correct" ? "spark_correct" : format === "same_meal" ? "spark_same_meal" : (format === "search" || format === "search_query") ? "spark_search" : "spark_identify";
  return recordCall(kind, body, async () => {
    const response = await metaFetch("/responses", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal:options.signal,
    });
    return readResponseOutput(await response.json());
  }, (out) => ({ text: out.outputText, usage: out.usage }));
}

import { APIConnectionTimeoutError } from "openai/core/error";

// HTTP clients preserve the response body for diagnostics without exposing it
// in the message shown on the post.
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: string,
    message = `API request failed with ${status}.`
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const TIMEOUT_CODES = new Set([
  "ETIMEDOUT", "UND_ERR_CONNECT_TIMEOUT", "UND_ERR_HEADERS_TIMEOUT", "UND_ERR_BODY_TIMEOUT",
]);

export function isRetriable(error: unknown): boolean {
  // fetch wraps Undici failures in TypeError.cause; SDKs can add another wrapper.
  // Guard cycles without retrying unrelated transport or programming errors.
  const seen = new Set<object>();
  let httpStatus: number | undefined;
  while (typeof error === "object" && error !== null && !seen.has(error)) {
    seen.add(error);
    // The SDK timeout class has name="Error" and no cause/status.
    if (httpStatus === undefined && error instanceof APIConnectionTimeoutError) return true;
    const value = error as { status?: unknown; name?: unknown; code?: unknown; cause?: unknown; originalError?: unknown };
    // PostgREST maps serialization conflicts/deadlocks to 4xx responses,
    // but retrying their entire transaction is safe and required.
    if (value.code === "40001" || value.code === "40P01") return true;
    if (httpStatus === undefined && typeof value.status === "number") httpStatus = value.status;
    if (httpStatus === undefined && (value.name === "AbortError" || value.name === "TimeoutError"
      || (typeof value.code === "string" && TIMEOUT_CODES.has(value.code)))) return true;
    // Supabase StorageUnknownError retains fetch failures as originalError.
    error = value.cause ?? value.originalError;
  }
  return httpStatus === 429 || (httpStatus !== undefined && httpStatus >= 500);
}

// PostgREST returns HTTP status beside (not inside) its error. Network failures
// are serialized into message/details with status 0 by the SDK.
export function ioError(message: string, cause: unknown, status?: number): Error {
  const error = new Error(message, { cause });
  if (status !== undefined && status >= 400) return Object.assign(error, { status });
  if (status === 0 && cause && typeof cause === "object") {
    const detail = cause as { message?: string; details?: string };
    const text = `${detail.message ?? ""} ${detail.details ?? ""}`;
    const code = text.match(/\b(?:ETIMEDOUT|UND_ERR_CONNECT_TIMEOUT|UND_ERR_HEADERS_TIMEOUT|UND_ERR_BODY_TIMEOUT)\b/)?.[0];
    if (code) return Object.assign(error, { code });
    if (/^(AbortError|TimeoutError):/.test(detail.message ?? "")) return Object.assign(error, { name: "TimeoutError" });
  }
  return error;
}

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
  while (typeof error === "object" && error !== null && !seen.has(error)) {
    seen.add(error);
    const value = error as { status?: unknown; name?: unknown; code?: unknown; cause?: unknown };
    if (typeof value.status === "number") return value.status === 429 || value.status >= 500;
    if (value.name === "AbortError" || value.name === "TimeoutError"
      || (typeof value.code === "string" && TIMEOUT_CODES.has(value.code))) return true;
    error = value.cause;
  }
  return false;
}

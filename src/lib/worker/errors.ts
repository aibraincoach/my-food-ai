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

export function isRetriable(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const value = error as { status?: unknown; name?: unknown; code?: unknown; cause?: unknown };
  if (typeof value.status === "number") {
    return value.status === 429 || value.status >= 500;
  }
  if (value.name === "AbortError" || value.code === "ETIMEDOUT") return true;
  // Node's fetch wraps network timeouts in a TypeError with a cause.
  if (typeof value.cause === "object" && value.cause !== null) {
    const cause = value.cause as { code?: unknown };
    return cause.code === "ETIMEDOUT";
  }
  return false;
}

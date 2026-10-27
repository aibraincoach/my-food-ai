// The one fetch wrapper for the Meta Model API (section 4).
// Base URL https://api.meta.ai/v1, header Authorization: Bearer $MODEL_API_KEY.
// Keys stay server-side; nothing here runs in the browser.

export const META_API_BASE_URL = "https://api.meta.ai/v1";

export function metaApiKey(): string {
  const key = process.env.MODEL_API_KEY;
  if (!key) {
    throw new Error("meta: MODEL_API_KEY is not set.");
  }
  return key;
}

export class MetaApiError extends Error {
  readonly status: number;
  readonly code: string | undefined;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = "MetaApiError";
    this.status = status;
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

export async function metaFetch(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${metaApiKey()}`);
  const response = await fetch(`${META_API_BASE_URL}${path}`, {
    ...init,
    headers,
  });
  if (!response.ok) {
    let code: string | undefined;
    const message = `meta: ${path} failed with ${response.status}.`;
    try {
      code = errorCode(await response.json());
    } catch {
      // Keep the default message when the body is not JSON.
    }
    throw new MetaApiError(response.status, message, code);
  }
  return response;
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
  body: Record<string, unknown>
): Promise<ResponseOutput> {
  const response = await metaFetch("/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return readResponseOutput(await response.json());
}

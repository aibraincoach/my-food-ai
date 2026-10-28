import { createResponse, MetaApiError, type ResponseOutput } from "@/lib/meta/client";

// The gateway returns transient empty-body 404s on non-streaming POSTs. 429 and 5xx belong to the
// worker's retry policy; any other 404 would be a real missing resource, so only this one is retried here.
export async function createResponseRetrying404(body: Record<string, unknown>, attempts = 4): Promise<ResponseOutput> {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await createResponse(body);
    } catch (error) {
      if (!(error instanceof MetaApiError && error.status === 404) || attempt >= attempts - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
}

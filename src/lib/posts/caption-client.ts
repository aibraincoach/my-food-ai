import {CaptureFailureError} from '@/lib/posts/capture-failure';
import { validCaption } from "./caption";

// A caption update refreshes the existing record. It must not announce a new
// meal to notification enrollment, readiness watchers or empty-feed listeners.
export async function updateCaption(postId: string, caption: string, request: typeof fetch = fetch, events: EventTarget = window): Promise<void> {
  if (!validCaption(caption)) throw new CaptureFailureError({code:"route_277df75eda6a"});
  const response = await request(`/api/posts/${encodeURIComponent(postId)}/caption`, {
    method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ caption }),
  });
  if (!response.ok) throw new CaptureFailureError({code:"route_b089f161f53a"});
  events.dispatchEvent(new CustomEvent("post-updated", { detail: { id: postId } }));
}

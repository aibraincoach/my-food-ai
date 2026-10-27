import webpush from "web-push";
import type { SupabaseClient } from "@supabase/supabase-js";

export function validSubscription(value: unknown): value is webpush.PushSubscription {
  if (!value || typeof value !== "object") return false;
  const subscription = value as webpush.PushSubscription;
  try {
    const url = new URL(subscription.endpoint);
    return typeof subscription.endpoint === "string" && subscription.endpoint.length <= 4096 &&
      url.protocol === "https:" && !url.port && !url.username && !url.password && (
        url.hostname === "fcm.googleapis.com" || url.hostname === "web.push.apple.com" ||
        url.hostname === "updates.push.services.mozilla.com" || url.hostname.endsWith(".notify.windows.com")
      ) && /^[A-Za-z0-9_-]{87}$/.test(subscription.keys?.p256dh ?? "") && /^[A-Za-z0-9_-]{22}$/.test(subscription.keys?.auth ?? "");
  } catch { return false; }
}

// Delivery is optional: a push outage must never invalidate meal analysis.
export async function sendPostPush(admin: SupabaseClient, postId: string, question?: string): Promise<void> {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) return;
  try {
    const { data: post, error } = await admin.from("posts").select("user_id").eq("id", postId).maybeSingle();
    if (error || !post) return;
    const { data: subscriptions, error: subscriptionError } = await admin.from("push_subscriptions")
      .select("id,endpoint,keys").eq("user_id", post.user_id);
    if (subscriptionError || !subscriptions?.length) return;
    const { data: media } = await admin.from("post_media").select("storage_path,kind")
      .eq("post_id", postId).order("position").limit(1).maybeSingle();
    let image: string | undefined;
    if (media) {
      const base = media.storage_path.replace(/\.[^.]+$/, "");
      const path = media.kind === "card" ? media.storage_path : `${base}.feed.jpg`;
      const signed = await admin.storage.from("media").createSignedUrl(path, 3600);
      image = signed.data?.signedUrl;
    }
    const payload = JSON.stringify({ title: question ? "Your meal needs a reply" : "Your meal is ready", body: question?.slice(0, 300), image, postId });
    await Promise.all(subscriptions.map(async (subscription) => {
      if (!validSubscription(subscription)) return;
      try {
        await webpush.sendNotification({ endpoint: subscription.endpoint, keys: subscription.keys }, payload,
          { vapidDetails: { subject, publicKey, privateKey }, TTL: 3600, timeout: 10000 });
      } catch (error) {
        if (typeof error === "object" && error !== null && "statusCode" in error && error.statusCode === 410) {
          await admin.from("push_subscriptions").delete().eq("id", subscription.id).eq("user_id", post.user_id);
        }
      }
    }));
  } catch { /* Push is best-effort; never log private endpoints or keys. */ }
}

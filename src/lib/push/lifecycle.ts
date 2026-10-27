// Serialize registration and logout so a late registration cannot outlive cleanup.
let tail: Promise<unknown> = Promise.resolve();
let signingOut = false;
export const pushOwnerKey = "meal-push-owner";
export function pushSessionStarted() { signingOut = false; }
export function pushSignOutStarted() { signingOut = true; }
export function pushSignOutFailed() { signingOut = false; }
export function pushIsSigningOut() { return signingOut; }
export function withPushLock<T>(work: () => Promise<T>): Promise<T> {
  const result = tail.then(work, work);
  tail = result.catch(() => {});
  return result;
}

export async function detachCurrentPushDevice() {
  if (!("serviceWorker" in navigator)) return;
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager?.getSubscription();
  if (subscription) {
    // The route is authenticated while logout has not cleared the session yet.
    const response = await fetch("/api/push/subscribe", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: subscription.endpoint }) });
    if (!response.ok) throw new Error("This device could not be detached.");
    if (!await subscription.unsubscribe()) throw new Error("This device could not be unsubscribed.");
  }
  try { localStorage.removeItem(pushOwnerKey); } catch { /* Storage may be unavailable. */ }
}

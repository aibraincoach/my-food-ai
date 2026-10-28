// Serialize registration and logout so a late registration cannot outlive cleanup. The order is enforced
// across tabs: an origin-wide Web Lock covers the detach and every registration, and a shared sign-out
// marker (localStorage) tells every other tab that a sign-out is under way until the session is gone.
let tail: Promise<unknown> = Promise.resolve();
let signingOut = false;
export const pushOwnerKey = "meal-push-owner";
const lockName = "meal-push-lifecycle";
const signOutKey = "meal-push-signing-out";
const signOutTtlMs = 30_000;
function readSignOutMarker(): number {
  try { return Number(localStorage.getItem(signOutKey)) || 0; } catch { return 0; }
}
export function pushSessionStarted() { signingOut = false; }
export function pushSignOutStarted() {
  signingOut = true;
  try { localStorage.setItem(signOutKey, String(Date.now())); } catch { /* Storage may be unavailable; the Web Lock still serializes. */ }
}
export function pushSignOutFailed() {
  signingOut = false;
  try { localStorage.removeItem(signOutKey); } catch { /* Storage may be unavailable. */ }
}
// True in this tab, or in any tab of this origin that started a sign-out within the last 30 seconds.
export function pushIsSigningOut() { return signingOut || Date.now() - readSignOutMarker() < signOutTtlMs; }
export function withPushLock<T>(work: () => Promise<T>): Promise<T> {
  const run = (): Promise<T> => typeof navigator !== "undefined" && navigator.locks ? (navigator.locks.request(lockName, () => work()) as Promise<T>) : work();
  const result = tail.then(run, run);
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

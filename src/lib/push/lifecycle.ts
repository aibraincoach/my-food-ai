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

export const detachRequestTimeoutMs = 5000;

// Both halves always run: a failed or hung server request must not stop the browser from dropping the
// subscription (a closed app can still receive pushes). The request is aborted at its own deadline so the
// lifecycle lock is always released. Any failure still throws, and the owner marker stays for a retry.
export async function detachCurrentPushDevice() {
  if (!("serviceWorker" in navigator)) return;
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager?.getSubscription();
  if (subscription) {
    let failure: Error | null = null;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), detachRequestTimeoutMs);
    try {
      // The route is authenticated while logout has not cleared the session yet.
      const response = await fetch("/api/push/subscribe", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: subscription.endpoint }), signal: controller.signal });
      if (!response.ok) failure = new Error("This device could not be detached.");
    } catch {
      failure = new Error("This device could not be detached.");
    } finally { clearTimeout(timer); }
    let unsubscribed = false;
    try { unsubscribed = await subscription.unsubscribe(); } catch { /* reported below */ }
    if (!unsubscribed) failure ??= new Error("This device could not be unsubscribed.");
    if (failure) throw failure;
  }
  try { localStorage.removeItem(pushOwnerKey); } catch { /* Storage may be unavailable. */ }
}

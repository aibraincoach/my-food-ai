import { pushSignOutFailed, pushSignOutStarted } from "@/lib/push/lifecycle";

// A Next redirect thrown by a server action is control flow, not a failure.
function isRedirect(error: unknown): boolean {
  return typeof error === "object" && error !== null && String((error as { digest?: unknown }).digest ?? "").startsWith("NEXT_REDIRECT");
}

// Ending the session never depends on notifications. Device cleanup is bounded and best effort; if it fails the
// owner marker stays, so the next page load unsubscribes this device (PushPrompt reconciles a previous owner).
// Returns "failed" only when the sign-out itself failed, after restoring this tab's push state.
export async function leaveSession({ detach, signOut, timeoutMs = 8000 }: {
  detach: () => Promise<unknown>;
  signOut: () => Promise<unknown>;
  timeoutMs?: number;
}): Promise<"failed"> {
  pushSignOutStarted();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([detach(), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("Device cleanup timed out.")), timeoutMs); })]);
  } catch {
    // Best effort only.
  } finally { clearTimeout(timer); }
  try {
    await signOut();
  } catch (error) {
    if (isRedirect(error)) throw error;
    pushSignOutFailed();
  }
  return "failed";
}

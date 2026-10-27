"use client";
import { useState } from "react";
import { signOut } from "@/lib/auth/actions";
import { detachCurrentPushDevice, pushSignOutStarted, pushSignOutFailed, withPushLock } from "@/lib/push/lifecycle";

export function SignOutButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const leave = async () => {
    if (busy) return;
    setBusy(true); setError(false); pushSignOutStarted();
    try { await withPushLock(detachCurrentPushDevice); }
    catch { pushSignOutFailed(); setBusy(false); setError(true); return; }
    // Keep the redirect outside the cleanup catch: Next's redirect is control flow.
    await signOut();
  };
  return <div className="text-right">
    <button type="button" disabled={busy} onClick={() => { void leave(); }} className="min-h-tap shrink-0 whitespace-nowrap text-comment text-muted">{busy ? "Signing out…" : "Sign out"}</button>
    {error ? <p role="alert" className="text-meta text-muted">Could not disconnect notifications. Try signing out again.</p> : null}
  </div>;
}

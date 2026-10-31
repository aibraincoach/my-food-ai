"use client";
import { useRef, useState } from "react";
import { signOut } from "@/lib/auth/actions";
import { detachCurrentPushDevice, withPushLock } from "@/lib/push/lifecycle";
import { leaveSession } from "@/lib/push/leave";

export function SignOutButton() {
  const leaving = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const leave = async () => {
    if (leaving.current) return;
    leaving.current = true;
    setBusy(true); setError(false);
    // A redirect from signOut leaves the page; reaching the next line means the sign-out itself failed.
    try {
      await leaveSession({ detach: () => withPushLock(detachCurrentPushDevice), signOut });
      setError(true);
    } finally {
      leaving.current = false;
      setBusy(false);
    }
  };
  return <div className="text-right">
    <button type="button" disabled={busy} onClick={() => { void leave(); }} className="min-h-tap shrink-0 whitespace-nowrap text-comment text-muted">{busy ? "Signing out…" : "Sign out"}</button>
    {error ? <p role="alert" className="text-meta text-muted">Could not sign out. Try again.</p> : null}
  </div>;
}

"use client";
import { useEffect, useRef, useState } from "react";
import { signOut } from "@/lib/auth/actions";
import { detachCurrentPushDevice, withPushLock } from "@/lib/push/lifecycle";
import { blockMediaSession, connectMediaSession } from "@/lib/posts/media-session";
import { clearFeedCache } from "@/lib/posts/feed-cache";
import { leaveSession } from "@/lib/push/leave";

export function SignOutButton() {
  useEffect(connectMediaSession, []);
  const leaving = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const leave = async () => {
    if (leaving.current) return;
    leaving.current = true;
    setBusy(true); setError(false);
    // A redirect from signOut leaves the page; reaching the next line means the sign-out itself failed.
    try {
      const mediaPrivacy = blockMediaSession();
      clearFeedCache();
      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        // Bound the acknowledgement so a stopped worker cannot block sign-out.
        // Waiting closes the old-cache window before another account signs in.
        await new Promise<void>(resolve => {
          const channel = new MessageChannel();
          const done = () => { clearTimeout(timer); channel.port1.close(); channel.port2.close(); resolve(); };
          const timer = setTimeout(done, 1500);
          channel.port1.onmessage = done;
          try { navigator.serviceWorker.controller!.postMessage({ type: "clear-media", ...mediaPrivacy }, [channel.port2]); }
          catch { done(); }
        });
      }
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

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Direct calendar/story entry must not depend on visiting Home first.
export default function LocalTimeZone({ zone, explicit }: { zone: string; explicit: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (explicit) return;
    const local = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!local) return;
    document.cookie = `time-zone=${encodeURIComponent(local)}; Path=/; SameSite=Lax; Max-Age=31536000`;
    if (local !== zone) router.refresh();
  }, [explicit, router, zone]);
  return null;
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { dateInZone } from "@/lib/posts/days";

// Direct calendar/story entry must not depend on visiting Home first.
export default function LocalTimeZone({ zone, explicit }: { zone: string; explicit: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (explicit) return;
    const local = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!local) return;
    document.cookie = `time-zone=${encodeURIComponent(local)}; Path=/; SameSite=Lax; Max-Age=31536000`;
    const now = new Date();
    if (local === zone || dateInZone(now, local) === dateInZone(now, zone)) return;
    router.refresh();
  }, [explicit, router, zone]);
  return null;
}

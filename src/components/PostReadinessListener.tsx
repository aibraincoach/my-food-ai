"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Tabs share one readiness observer so capture also updates Days and Profile.
export default function PostReadinessListener() {
  const router = useRouter();
  useEffect(() => {
    const db = createClient();
    const pending = new Map<string, { started: number; nextCheck: number }>();
    let live = true;
    let polling = false;
    const settle = (id: string, status: string) => {
      if (!["ready", "failed", "needs_input"].includes(status)) return;
      pending.delete(id);
      if (live) router.refresh();
    };
    const created = (event: Event) => {
      const id = (event as CustomEvent<{ id?: unknown }>).detail?.id;
      if (typeof id === "string") pending.set(id, { started: Date.now(), nextCheck: 0 });
    };
    const ready = (event: Event) => {
      const id = (event as CustomEvent<{ id?: unknown }>).detail?.id;
      if (typeof id === "string") settle(id, "ready");
    };
    const focus = () => router.refresh();
    const channel = db.channel("tab-post-readiness").on("postgres_changes", {
      event: "UPDATE", schema: "public", table: "posts",
    }, ({ new: row }) => {
      if (typeof row.id === "string" && pending.has(row.id)) settle(row.id, row.status);
    }).subscribe();
    // Only query newly created IDs. Back off after two minutes and stop after
    // fifteen; no repeated page hydration while analysis is still pending.
    const timer = setInterval(async () => {
      const now = Date.now();
      for (const [id, state] of pending) if (now - state.started > 15 * 60_000) pending.delete(id);
      if (!pending.size || polling || document.visibilityState === "hidden") return;
      const due = [...pending].filter(([, state]) => state.nextCheck <= now).map(([id]) => id);
      if (!due.length) return;
      polling = true;
      for (const id of due) {
        const state = pending.get(id)!;
        state.nextCheck = now + (now - state.started > 120_000 ? 15_000 : 3000);
      }
      try {
        const { data } = await db.from("posts").select("id,status").in("id", due);
        if (live) for (const row of data ?? []) settle(row.id, row.status);
      } catch {
        // The bounded next status check retries transient network errors.
      } finally { polling = false; }
    }, 3000);
    window.addEventListener("post-created", created);
    window.addEventListener("post-ready", ready);
    window.addEventListener("focus", focus);
    return () => {
      live = false; clearInterval(timer); void db.removeChannel(channel);
      window.removeEventListener("post-created", created);
      window.removeEventListener("post-ready", ready);
      window.removeEventListener("focus", focus);
    };
  }, [router]);
  return null;
}

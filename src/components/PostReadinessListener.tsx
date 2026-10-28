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
    const seedPending = async () => {
      try {
        const { data: { user } } = await db.auth.getUser();
        if (!user || !live) return;
        const { data, error } = await db.from("posts").select("id")
          .eq("user_id", user.id).in("status", ["queued", "processing"]);
        if (!live) return;
        if (!error) for (const row of data ?? []) {
          if (!pending.has(row.id)) pending.set(row.id, { started: Date.now(), nextCheck: 0 });
        }
        // Covers a meal that became ready before this pending-status read,
        // including the gap before the realtime subscription is established.
        router.refresh();
      } catch {
        if (live) router.refresh();
      }
    };
    // Meals created elsewhere are never in `pending`; look at the newest few posts now and then
    // so a disconnected channel cannot leave Days or a story stale until the next focus.
    const known = new Map<string, string>();
    let discovered = false;
    const discover = async () => {
      try {
        const { data, error } = await db.from("posts").select("id,status").order("created_at", { ascending: false }).limit(20);
        if (!live || error) return;
        let changed = false;
        for (const row of data ?? []) {
          if (discovered && known.get(row.id) !== row.status && ["ready", "failed", "needs_input"].includes(row.status)) changed = true;
          known.set(row.id, row.status);
        }
        discovered = true;
        if (changed) router.refresh();
      } catch {
        // The next visible check retries.
      }
    };
    const discoveryTimer = setInterval(() => { if (document.visibilityState === "visible") void discover(); }, 15_000);
    void discover();
    // A visible page re-renders once a minute: this covers an update to an older meal that
    // `discover` cannot see and carries "today" across local midnight (the server derives it).
    const reconcileTimer = setInterval(() => { if (document.visibilityState === "visible" && live) router.refresh(); }, 60_000);
    const visible = () => { if (document.visibilityState === "visible" && live) router.refresh(); };
    document.addEventListener("visibilitychange", visible);
    const focus = () => { void seedPending(); void discover(); };
    const channel = db.channel("tab-post-readiness").on("postgres_changes", {
      event: "UPDATE", schema: "public", table: "posts",
    }, ({ new: row }) => {
      if (typeof row.id === "string") settle(row.id, row.status);
    }).subscribe((status) => {
      // Reconcile once the channel is live (and again after a reconnect): the first read can run before it is.
      if (status === "SUBSCRIBED") void seedPending();
    });
    void seedPending();
    // Only poll pending IDs discovered at entry or newly created IDs. Back off after two minutes and stop after
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
      live = false; clearInterval(timer); clearInterval(discoveryTimer); clearInterval(reconcileTimer); document.removeEventListener("visibilitychange", visible); void db.removeChannel(channel);
      window.removeEventListener("post-created", created);
      window.removeEventListener("post-ready", ready);
      window.removeEventListener("focus", focus);
    };
  }, [router]);
  return null;
}

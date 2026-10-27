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
    const settle = (id: string, status: string, announce=true) => {
      if (!["ready", "failed", "needs_input"].includes(status)) return;
      pending.delete(id);
      if (live) {
        if(announce&&status!=="needs_input")window.dispatchEvent(new CustomEvent("post-settled",{detail:{id,status}}));
        if(status==="ready"&&announce)window.dispatchEvent(new CustomEvent("post-ready",{detail:{id}}));
        router.refresh();
      }
    };
    const created = (event: Event) => {
      const id = (event as CustomEvent<{ id?: unknown }>).detail?.id;
      if (typeof id === "string") pending.set(id, { started: Date.now(), nextCheck: 0 });
    };
    const ready = (event: Event) => {
      const id = (event as CustomEvent<{ id?: unknown }>).detail?.id;
      if (typeof id === "string") settle(id, "ready",false);
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
    const focus = () => { void seedPending(); };
    const channel = db.channel("tab-post-readiness").on("postgres_changes", {
      event: "UPDATE", schema: "public", table: "posts",
    }, ({ new: row }) => {
      if (typeof row.id === "string") settle(row.id, row.status);
    }).subscribe();
    void seedPending();
    // Poll known pending IDs until terminal, with a slower status-only check after two minutes.
    // Long queues must not strand an answered meal outside the discovery page.
    const timer = setInterval(async () => {
      const now = Date.now();
      if (!pending.size || polling || document.visibilityState === "hidden") return;
      const due = [...pending].filter(([, state]) => state.nextCheck <= now).map(([id]) => id);
      if (!due.length) return;
      polling = true;
      for (const id of due) {
        const state = pending.get(id)!;
        state.nextCheck = now + (now - state.started > 120_000 ? 15_000 : 3000);
      }
      try {
        const { data,error } = await db.from("posts").select("id,status").in("id", due);
        if (live&&!error) {
          for (const row of data ?? []) settle(row.id, row.status);
          const found=new Set((data??[]).map(row=>row.id));
          for(const id of due)if(!found.has(id))pending.delete(id);
        }
      } catch {
        // The bounded next status check retries transient network errors.
      } finally { polling = false; }
    }, 3000);
    window.addEventListener("post-created", created);
    window.addEventListener("post-answer-resume",created);
    window.addEventListener("post-ready", ready);
    window.addEventListener("focus", focus);
    return () => {
      live = false; clearInterval(timer); void db.removeChannel(channel);
      window.removeEventListener("post-created", created);
      window.removeEventListener("post-answer-resume",created);
      window.removeEventListener("post-ready", ready);
      window.removeEventListener("focus", focus);
    };
  }, [router]);
  return null;
}

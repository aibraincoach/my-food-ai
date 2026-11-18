"use client";

import { useEffect } from "react";
import {refreshAfterReadinessSeed,refreshAfterReady} from "@/lib/posts/readiness-refresh";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Tabs share one readiness observer so capture also updates Days and Profile.
export default function PostReadinessListener() {
  const router = useRouter();
  useEffect(() => {
    const db = createClient();
    // The installed shell owns an in-place client reader. A route refresh
    // would replace that cached page with a blank server Suspense boundary.
    const refreshView=()=>{if(document.querySelector('[data-shell]'))window.dispatchEvent(new Event('feed-revalidate'));else router.refresh();};
    const pending = new Map<string, { started: number; nextCheck: number }>();
    const known = new Map<string, string>();
    let live = true;
    let polling = false;
    const settle = (id: string, status: string, announce=true) => {
      if (!["ready", "failed", "needs_input"].includes(status)) return;
      const refresh=refreshAfterReady(announce,pending.has(id),known.get(id));
      known.set(id,status);
      pending.delete(id);
      if (live) {
        if(announce&&status!=="needs_input")window.dispatchEvent(new CustomEvent("post-settled",{detail:{id,status}}));
        if(status==="ready"&&announce)window.dispatchEvent(new CustomEvent("post-ready",{detail:{id}}));
        if(refresh)refreshView();
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
      const revision = authRevision;
      try {
        const { data: { session } } = await db.auth.getSession();
        const user = session?.user;
        if (!user || !live || revision !== authRevision) return;
        const { data, error } = await db.from("posts").select("id")
          .eq("user_id", user.id).in("status", ["queued", "processing"]);
        if (!live || revision !== authRevision) return;
        if (!error) for (const row of data ?? []) {
          if (!pending.has(row.id)) pending.set(row.id, { started: Date.now(), nextCheck: 0 });
        }
        // Covers a meal that became ready before this pending-status read,
        // including the gap before the realtime subscription is established.
        if(refreshAfterReadinessSeed(location.pathname,Boolean(document.querySelector("[data-home-feed]"))))refreshView();
      } catch {
        if (live && revision === authRevision && refreshAfterReadinessSeed(location.pathname,Boolean(document.querySelector("[data-home-feed]")))) refreshView();
      }
    };
    // Reconcile newest meals on mount and focus; Realtime handles live changes.
    let discovered = false;
    const discover = async () => {
      const revision = authRevision;
      try {
        const { data, error } = await db.from("posts").select("id,status").order("created_at", { ascending: false }).limit(20);
        if (!live || error || revision !== authRevision) return;
        let changed = false;
        for (const row of data ?? []) {
          if (discovered && known.get(row.id) !== row.status && ["ready", "failed", "needs_input"].includes(row.status)) changed = true;
          known.set(row.id, row.status);
        }
        discovered = true;
        if (changed) refreshView();
      } catch {
        // The next visible check retries.
      }
    };
    // The minute tick only notices a local day change; visibility keeps its reconciliation rule.
    let day = new Date().toDateString();
    const visible = () => {
      if (document.visibilityState !== "visible" || !live) return;
      const today = new Date().toDateString();
      const newDay = today !== day;
      day = today;
      if (newDay || pending.size > 0 || refreshAfterReadinessSeed(location.pathname,Boolean(document.querySelector("[data-home-feed]")))) refreshView();
    };
    const reconcileTimer = setInterval(() => {
      if (!live || document.visibilityState !== "visible") return;
      const today = new Date().toDateString();
      if (today !== day) { day = today; refreshView(); }
    }, 60_000);
    document.addEventListener("visibilitychange", visible);
    const focus = () => { void seedPending(); void discover(); };
    let channel: ReturnType<typeof db.channel> | null = null;
    let channelUser: string | null = null;
    let authRevision = 0;
    const subscribeUser = (userId: string | null) => {
      if (!live || userId === channelUser) return;
      if (channel) void db.removeChannel(channel);
      channel = null; channelUser = userId;
      pending.clear(); known.clear(); discovered = false;
      if (!userId) return;
      channel = db.channel("tab-post-readiness").on("postgres_changes", {
        event: "*", schema: "public", table: "posts", filter: `user_id=eq.${userId}`,
      }, ({ new: row }) => {
        if (live && channelUser === userId && "id" in row && typeof row.id === "string" && "status" in row && typeof row.status === "string") {
          window.dispatchEvent(new CustomEvent("post-readiness", {detail: {id: row.id}}));
          settle(row.id, row.status);
        }
      }).subscribe((status) => {
        // Reconcile once live and after reconnecting.
        if (live && channelUser === userId && status === "SUBSCRIBED") void seedPending();
      });
      void seedPending();
      void discover();
    };
    const {data: {subscription}} = db.auth.onAuthStateChange((_event, session) => {
      authRevision++;
      subscribeUser(session?.user.id ?? null);
    });
    const initialRevision = authRevision;
    void db.auth.getSession().then(({data: {session}}) => {
      if (authRevision === initialRevision) subscribeUser(session?.user.id ?? null);
    });
    // Poll known pending IDs until terminal, with a slower status-only check after two minutes.
    // Long queues must not strand an answered meal outside the discovery page.
    const timer = setInterval(async () => {
      const now = Date.now();
      if (!pending.size || polling || document.visibilityState === "hidden") return;
      const due = [...pending].filter(([, state]) => state.nextCheck <= now).map(([id]) => id);
      if (!due.length) return;
      polling = true;
      const revision = authRevision;
      for (const id of due) {
        const state = pending.get(id)!;
        state.nextCheck = now + (now - state.started > 120_000 ? 15_000 : 3000);
      }
      try {
        const { data,error } = await db.from("posts").select("id,status").in("id", due);
        if (live && revision === authRevision && !error) {
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
      live = false; clearInterval(timer); clearInterval(reconcileTimer); document.removeEventListener("visibilitychange", visible); subscription.unsubscribe(); if (channel) void db.removeChannel(channel);
      window.removeEventListener("post-created", created);
      window.removeEventListener("post-answer-resume",created);
      window.removeEventListener("post-ready", ready);
      window.removeEventListener("focus", focus);
    };
  }, [router]);
  return null;
}

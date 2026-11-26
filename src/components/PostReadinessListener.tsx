"use client";
import {onTabReturn} from '@/lib/client/tab-return';
import {useTranslations} from 'next-intl';

import { useEffect, useState } from "react";
import {refreshAfterReadinessSeed,refreshAfterReady} from "@/lib/posts/readiness-refresh";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Tabs share one readiness observer so capture also updates Days and Profile.
export default function PostReadinessListener() {
  const t=useTranslations('feed');
  const router = useRouter();
  const [reconnectFailed, setReconnectFailed] = useState(false);
  useEffect(() => {
    const db = createClient();
    // The installed shell owns an in-place client reader. A route refresh
    // would replace that cached page with a blank server Suspense boundary.
    const refreshView=()=>{if(document.querySelector('[data-shell]'))window.dispatchEvent(new Event('feed-revalidate'));else router.refresh();};
    const pending = new Set<string>();
    const known = new Map<string, string>();
    let live = true;
    let checkingPending = false;
    let lastReconnectRead = -Infinity;
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
      if (typeof id === "string") pending.add(id);
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
          if (!pending.has(row.id)) pending.add(row.id);
        }
        // Covers a meal that became ready before this pending-status read,
        // including the gap before the realtime subscription is established.
        if(refreshAfterReadinessSeed(location.pathname,Boolean(document.querySelector("[data-home-feed]"))))refreshView();
      } catch {
        if (live && revision === authRevision && refreshAfterReadinessSeed(location.pathname,Boolean(document.querySelector("[data-home-feed]")))) refreshView();
      }
    };
    // Reconcile newest meals on mount and return; Realtime handles live changes.
    let discovered = false;
    const discover = async () => {
      const revision = authRevision;
      try {
        const { data, error } = await db.from("posts").select("id,status").order("created_at", { ascending: false }).limit(20);
        if (!live || error || revision !== authRevision) return false;
        let changed = false;
        for (const row of data ?? []) {
          if (discovered && known.get(row.id) !== row.status && ["ready", "failed", "needs_input"].includes(row.status)) changed = true;
          known.set(row.id, row.status);
        }
        discovered = true;
        if (changed) refreshView();
        return true;
      } catch {
        return false;
      }
    };
    // One boundary event keeps the local day current; tab returns reconcile changes.
    let day = new Date().toDateString();
    const visible = () => {
      if (document.visibilityState !== "visible" || !live) return;
      const today = new Date().toDateString();
      const newDay = today !== day;
      day = today;
      if (newDay || pending.size > 0 || refreshAfterReadinessSeed(location.pathname,Boolean(document.querySelector("[data-home-feed]")))) refreshView();
      clearTimeout(dayBoundaryTimer);scheduleDayBoundary();
      focus();
    };
    let dayBoundaryTimer: ReturnType<typeof setTimeout>;
    const scheduleDayBoundary = () => {
      const next = new Date();next.setHours(24,0,0,0);
      dayBoundaryTimer = setTimeout(() => {
        if (!live) return;
        const today = new Date().toDateString();
        if (document.visibilityState === "visible" && today !== day) { day = today;refreshView(); }
        scheduleDayBoundary();
      }, Math.max(1,next.getTime()-Date.now()));
    };
    scheduleDayBoundary();
    let focusInFlight = false;
    let returnAgain = false;
    const focus = () => {
      if (!live) return;
      if (focusInFlight) { returnAgain = true; return; }
      focusInFlight = true;
      void (async () => { try { await reconcilePending();await seedPending();await discover(); } finally { focusInFlight = false; if (returnAgain && live) { returnAgain = false; focus(); } } })();
    };
    let channel: ReturnType<typeof db.channel> | null = null;
    let channelUser: string | null = null;
    let authRevision = 0;
    const subscribeUser = (userId: string | null) => {
      if (!live || userId === channelUser) return;
      if (channel) void db.removeChannel(channel);
      channel = null; channelUser = userId;
      pending.clear(); known.clear(); discovered = false;
      setReconnectFailed(false);
      if (!userId) return;
      let connectedOnce = false, disconnected = false;
      channel = db.channel("tab-post-readiness").on("postgres_changes", {
        event: "*", schema: "public", table: "posts", filter: `user_id=eq.${userId}`,
      }, ({ new: row }) => {
        if (live && channelUser === userId && "id" in row && typeof row.id === "string" && "status" in row && typeof row.status === "string") {
          window.dispatchEvent(new CustomEvent("post-readiness", {detail: {id: row.id}}));
          settle(row.id, row.status);
        }
      }).subscribe((status) => {
        if (!live || channelUser !== userId) return;
        if (status !== "SUBSCRIBED") {
          if (["CHANNEL_ERROR", "TIMED_OUT", "CLOSED"].includes(status)) disconnected = true;
          return;
        }
        if (!connectedOnce) {
          connectedOnce = true; disconnected = false;
          // A tracked meal can finish after the initial read but before this
          // subscription connects. The pending-only seed cannot see it now.
          void seedPending().then(reconcilePending);
          return;
        }
        if (!disconnected) return;
        disconnected = false;
        // Exactly one attempt per reconnect, at most once per 30 seconds per tab.
        if (Date.now() - lastReconnectRead < 30_000) return;
        lastReconnectRead = Date.now();
        void discover().then(ok => { if (live && channelUser === userId) setReconnectFailed(!ok); });
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
    // A tab return reconciles tracked old IDs even when they are outside the newest discovery page.
    const reconcilePending = async () => {
      if (!pending.size || checkingPending || document.visibilityState === "hidden") return;
      checkingPending = true;
      const revision = authRevision, ids = [...pending];
      try {
        const { data,error } = await db.from("posts").select("id,status").in("id", ids);
        if (!live || revision !== authRevision) return;
        if (error) { setReconnectFailed(true);return; }
        for (const row of data ?? []) settle(row.id,row.status);
        const found = new Set((data ?? []).map(row=>row.id));
        for (const id of ids) if (!found.has(id)) pending.delete(id);
        setReconnectFailed(false);
      } catch { if (live && revision === authRevision) setReconnectFailed(true); }
      finally { checkingPending = false; }
    };
    window.addEventListener("post-created", created);
    window.addEventListener("post-answer-resume",created);
    window.addEventListener("post-ready", ready);
    const stopReturn = onTabReturn(visible);
    return () => {
      live = false; clearTimeout(dayBoundaryTimer); stopReturn(); subscription.unsubscribe(); if (channel) void db.removeChannel(channel);
      window.removeEventListener("post-created", created);
      window.removeEventListener("post-answer-resume",created);
      window.removeEventListener("post-ready", ready);
    };
  }, [router]);
  return reconnectFailed ? <p role="status">{t('updatesReconnectFailed')}</p> : null;
}

"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";

const ownerKey = "meal-push-owner";
const promptedKey = (id: string) => `meal-push-prompted:${id}`;
function read(key: string) { try { return localStorage.getItem(key); } catch { return null; } }
function write(key: string, value: string) { try { localStorage.setItem(key, value); } catch { /* Private storage may be unavailable. */ } }
function installed() {
  return window.matchMedia("(display-mode: standalone)").matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
}
function applicationKey(value: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - value.length % 4) % 4);
  const raw = atob((value + padding).replaceAll("-", "+").replaceAll("_", "/"));
  return Uint8Array.from(raw, (character) => character.charCodeAt(0));
}
export default function PushPrompt() {
  const [account, setAccount] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !("Notification" in window) || !("PushManager" in window) || !("serviceWorker" in navigator)) return;
    const client = createClient();
    let cancelled = false;
    const reconcile = async (id: string | null) => {
      if (read(ownerKey) && read(ownerKey) !== id) {
        const registration = await navigator.serviceWorker.getRegistration();
        const previous = await registration?.pushManager.getSubscription();
        // Keep the old owner marker on failure so a subsequent post retries
        // unsubscription rather than treating an active endpoint as detached.
        if (previous && !await previous.unsubscribe()) throw new Error("Could not unsubscribe this device.");
        write(ownerKey, "");
      }
      if (!cancelled) setAccount((current) => current === id ? current : null);
    };
    void client.auth.getUser().then(({ data }) => reconcile(data.user?.id ?? null)).catch(() => {});
    const { data: auth } = client.auth.onAuthStateChange((_event, session) => {
      // Avoid calling async Supabase APIs inside its auth callback.
      void reconcile(session?.user.id ?? null).catch(() => {});
    });
    const posted = async () => {
      if (!installed() || Notification.permission === "denied") return;
      const { data } = await client.auth.getUser();
      if (!data.user || cancelled || read(promptedKey(data.user.id))) return;
      await reconcile(data.user.id);
      if (cancelled) return;
      setAccount(data.user.id);
    };
    const onPost = () => { void posted().catch(() => {}); };
    window.addEventListener("post-created", onPost);
    return () => { cancelled = true; auth.subscription.unsubscribe(); window.removeEventListener("post-created", onPost); };
  }, []);
  const dismiss = () => { if (account) write(promptedKey(account), "1"); setAccount(null); };
  const enable = async () => {
    if (!account || busy) return;
    setBusy(true); setError("");
    try {
      // Called directly from a button gesture, required by mobile browsers.
      if (await Notification.requestPermission() !== "granted") { write(promptedKey(account), "1"); setAccount(null); return; }
      const registration = await Promise.race([navigator.serviceWorker.ready, new Promise<never>((_, reject) => setTimeout(() => reject(new Error()), 15000))]);
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) subscription = await registration.pushManager.subscribe({ userVisibleOnly: true,
        applicationServerKey: applicationKey(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!) });
      const { data } = await createClient().auth.getUser();
      if (data.user?.id !== account) { await subscription.unsubscribe(); throw new Error(); }
      const response = await fetch("/api/push/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(subscription) });
      if (!response.ok) throw new Error();
      write(ownerKey, account);
      write(promptedKey(account), "1");
      setAccount(null);
    } catch { setError("Notifications could not be enabled. You can try again."); }
    finally { setBusy(false); }
  };
  if (!account) return null;
  return <Sheet open={Boolean(account)} onClose={() => { if (!busy) dismiss(); }} label="Meal notifications">
    <p className="text-body">Notify you when your meal is ready?</p>
    <p className="text-detail text-muted">Notifications may show your meal photo or a question about it on this device.</p>
    {error && <p role="alert" className="text-detail">{error}</p>}
    <Button disabled={busy} onClick={enable}>{busy ? "Enabling…" : "Enable notifications"}</Button>
    <Button variant="secondary" disabled={busy} onClick={dismiss}>Not now</Button>
  </Sheet>;
}

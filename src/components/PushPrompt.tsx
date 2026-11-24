"use client";
import {useTranslations} from "next-intl";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";

import { pushOwnerKey as ownerKey, pushSessionStarted, pushIsSigningOut, withPushLock, postPushSubscription, reconcilePushOwner } from "@/lib/push/lifecycle";
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
async function registerDevice(account: string) {
  if (pushIsSigningOut()) return;
  const registration = await Promise.race([navigator.serviceWorker.ready, new Promise<never>((_, reject) => setTimeout(() => reject(new Error()), 15000))]);
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) subscription = await registration.pushManager.subscribe({ userVisibleOnly: true,
    applicationServerKey: applicationKey(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!) });
  const { data: { session } } = await createClient().auth.getSession();
  if (session?.user?.id !== account || pushIsSigningOut()) { await subscription.unsubscribe(); return; }
  const response = await postPushSubscription(subscription);
  if (!response.ok) throw new Error();
  write(ownerKey, account);
  write(promptedKey(account), "1");
}
export default function PushPrompt() {
  const t=useTranslations('feed');
  const [account, setAccount] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !("Notification" in window) || !("PushManager" in window) || !("serviceWorker" in navigator)) return;
    pushSessionStarted();
    const client = createClient();
    let cancelled = false;
    const reconcile = async (id: string | null) => {
      await reconcilePushOwner(id, { read, write });
      if (!cancelled) setAccount((current) => current === id ? current : null);
    };
    void client.auth.getSession().then(({ data: { session } }) => withPushLock(() => reconcile(session?.user?.id ?? null))).catch(() => {});
    const { data: auth } = client.auth.onAuthStateChange((_event, session) => {
      // Avoid calling async Supabase APIs inside its auth callback.
      void withPushLock(() => reconcile(session?.user.id ?? null)).catch(() => {});
    });
    const posted = async () => {
      if (!installed() || Notification.permission === "denied") return;
      const { data: { session } } = await client.auth.getSession();
      const user = session?.user;
      if (!user || cancelled || pushIsSigningOut()) return;
      await reconcile(user.id);
      if (cancelled || pushIsSigningOut()) return;
      if (Notification.permission === "granted") { await registerDevice(user.id); return; }
      if (!read(promptedKey(user.id))) setAccount(user.id);
    };
    const onPost = () => { void withPushLock(posted).catch(() => {}); };
    window.addEventListener("post-created", onPost);
    return () => { cancelled = true; auth.subscription.unsubscribe(); window.removeEventListener("post-created", onPost); };
  }, []);
  const dismiss = () => { if (account) write(promptedKey(account), "1"); setAccount(null); };
  const enable = async () => {
    if (!account || busy) return;
    setBusy(true); setError(false);
    try {
      // Called directly from a button gesture, required by mobile browsers.
      if (await Notification.requestPermission() !== "granted") { write(promptedKey(account), "1"); setAccount(null); return; }
      await withPushLock(() => registerDevice(account));
      setAccount(null);
    } catch { setError(true); }
    finally { setBusy(false); }
  };
  if (!account) return null;
  return <Sheet open={Boolean(account)} onClose={() => { if (!busy) dismiss(); }} label={t('notificationsTitle')}>
    <p className="text-body">{t('notificationsQuestion')}</p>
    <p className="text-detail text-muted">{t('notificationsHint')}</p>
    {error && <p role="alert" className="text-detail">{t('notificationsEnableFailed')}</p>}
    <Button disabled={busy} onClick={enable}>{busy ? t('enablingNotifications') : t('enableNotifications')}</Button>
    <Button variant="secondary" disabled={busy} onClick={dismiss}>{t('notNow')}</Button>
  </Sheet>;
}

"use client";
import {record} from '@/lib/diagnostics/recorder';

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { createUpdateSafety, hasUnsentText } from "@/lib/sw-update-safety";
import { hasMemoryUploads } from "@/lib/posts/upload-presence";
import { uploadStore } from "@/lib/posts/upload-store";

export default function ServiceWorkerRegistration() {
  const pathname = usePathname();
  const safePoint = useRef<(() => void) | null>(null);
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const blocked = () => document.documentElement.hasAttribute('data-mfa-sheet-open') || Boolean(document.querySelector('[role="dialog"]')) ||
      Array.from(document.querySelectorAll('video')).some(video => video.srcObject instanceof MediaStream && video.srcObject.getVideoTracks().some(track => track.readyState === 'live')) ||
      hasMemoryUploads() || hasUnsentText(document);
    const update = createUpdateSafety({blocked, pending: () => uploadStore.hasPending(), reload: () => window.location.reload(), observe: state => { void record('update',state); }});
    const check = () => { void update.safePoint().catch(() => console.error('App update deferred: pending photos could not be checked.')); };
    safePoint.current = check;
    let closeFrame = 0;
    const closed = () => { cancelAnimationFrame(closeFrame); closeFrame = requestAnimationFrame(check); };
    const message = (event: MessageEvent) => {
      if (event.source === navigator.serviceWorker.controller && event.data?.type === 'app-update-ready') update.ready();
    };
    const visibility = () => { if (document.visibilityState === 'hidden') check(); };
    const observer = new MutationObserver(() => { if (!document.documentElement.hasAttribute('data-mfa-sheet-open')) check(); });
    observer.observe(document.documentElement, {attributes: true, attributeFilter: ['data-mfa-sheet-open']});
    navigator.serviceWorker.addEventListener('message', message);
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('entry-closed', closed);
    return () => { cancelAnimationFrame(closeFrame); window.removeEventListener('entry-closed', closed); safePoint.current = null; observer.disconnect(); navigator.serviceWorker.removeEventListener('message', message); document.removeEventListener('visibilitychange', visibility); };
  }, []);
  useEffect(() => { safePoint.current?.(); }, [pathname]);
  useEffect(() => {
    let pressed: HTMLElement | null = null;
    const release = () => { pressed?.removeAttribute('data-tap-pressed'); pressed = null; };
    const down = (event: PointerEvent) => { release(); const element = event.target instanceof Element ? event.target.closest<HTMLElement>('button,a[href],summary,input,textarea,select,[role="switch"],[data-tap-control]') : null; if (element && !element.matches(':disabled,[aria-disabled="true"]')) { pressed = element; element.setAttribute('data-tap-pressed', ''); } };
    const up = () => { const element = pressed; setTimeout(() => { element?.removeAttribute('data-tap-pressed'); if (pressed === element) pressed = null; }, 80); };
    window.addEventListener('pointerdown', down, {passive:true}); window.addEventListener('pointerup', up, {passive:true}); window.addEventListener('pointercancel', release); window.addEventListener('blur', release);
    return () => { release(); window.removeEventListener('pointerdown', down); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', release); window.removeEventListener('blur', release); };
  }, []);
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const register = () => {
      void navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).then(registration => {
        registration.addEventListener('updatefound',()=>{void record('update','found');});
        // Request the check on every normal page load rather than waiting for
        // the browser's background update schedule to notice imported bytes.
        return registration.update();
      }).catch(() => {
        // The online app remains usable when registration or its update fails.
      });
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
    return () => window.removeEventListener("load", register);
  }, []);
  return null;
}

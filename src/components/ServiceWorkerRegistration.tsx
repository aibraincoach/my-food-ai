"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistration() {
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

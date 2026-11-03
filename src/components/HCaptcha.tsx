"use client";

import Script from "next/script";
import { useCallback, useState } from "react";

type CaptchaAPI = {
  render: (container: HTMLElement, options: { sitekey: string }) => string;
  remove: (widget: string) => void;
};

declare global {
  interface Window {
    hcaptcha?: CaptchaAPI;
    mfaHCaptchaReady?: () => void;
    mfaHCaptchaLoaded?: boolean;
  }
}

const listeners = new Set<() => void>();

export default function HCaptcha() {
  const sitekey = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY;
  const [failed, setFailed] = useState(false);

  const container = useCallback((node: HTMLDivElement | null) => {
    if (!sitekey || !node) return;
    let widget: string | undefined;
    const render = () => {
      if (widget === undefined && window.hcaptcha) {
        widget = window.hcaptcha.render(node, { sitekey });
      }
    };
    // Register before loading the SDK; its onload callback means API setup is
    // complete. Retain that state across client-side sign-in/sign-up navigation.
    window.mfaHCaptchaReady ??= () => {
      window.mfaHCaptchaLoaded = true;
      for (const listener of listeners) listener();
    };
    listeners.add(render);
    if (window.mfaHCaptchaLoaded) render();
    return () => {
      listeners.delete(render);
      if (widget !== undefined) window.hcaptcha?.remove(widget);
    };
  }, [sitekey]);

  if (!sitekey) return null;
  return <>
    <div ref={container} className="h-captcha" data-sitekey={sitekey} />
    <Script id="mfa-hcaptcha" src="https://js.hcaptcha.com/1/api.js?onload=mfaHCaptchaReady&render=explicit"
      strategy="afterInteractive" onError={() => setFailed(true)} />
    {failed ? <p role="alert" className="text-detail text-text">The check could not load. Refresh and try again.</p> : null}
  </>;
}

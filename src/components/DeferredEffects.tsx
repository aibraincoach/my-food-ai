"use client";

import {useEffect} from 'react';

// Let the first content render before creating the frosted/shadowed layers.
export default function DeferredEffects() {
  useEffect(() => {
    let frame: number | undefined;
    const enable = () => {
      frame = requestAnimationFrame(() => {
        document.documentElement.dataset.effects = '';
      });
    };
    if (document.readyState === 'complete') enable();
    else window.addEventListener('load', enable, {once: true});
    return () => {
      window.removeEventListener('load', enable);
      if (frame !== undefined) cancelAnimationFrame(frame);
    };
  }, []);
  return null;
}

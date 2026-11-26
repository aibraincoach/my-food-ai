"use client";

import {useEffect} from 'react';
import {firstPhotoSettled,settleWithoutFirstPhoto} from '@/lib/posts/feed-photo-url';

// Restore the resting effects after the photo upgrade has painted, or at the cap.
export default function DeferredEffects() {
  useEffect(() => {
    let frame: number | undefined;
    let live = true;
    let enabled = false;
    const enable = () => {
      if (!live || enabled) return;
      enabled = true;
      document.documentElement.dataset.effects = '';
      clearTimeout(cap);
    };
    const loaded = () => {
      frame = requestAnimationFrame(() => {
        if (!live || enabled) return;
        if (settleWithoutFirstPhoto()) { enable(); return; }
        void firstPhotoSettled.then(() => {
          if (live && !enabled) frame = requestAnimationFrame(enable);
        });
      });
    };
    const cap = setTimeout(enable, Math.max(0, 8000 - performance.now()));
    if (document.readyState === 'complete') loaded();
    else window.addEventListener('load', loaded, {once: true});
    return () => {
      live = false;
      window.removeEventListener('load', loaded);
      clearTimeout(cap);
      if (frame !== undefined) cancelAnimationFrame(frame);
    };
  }, []);
  return null;
}

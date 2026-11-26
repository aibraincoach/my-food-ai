// Focus alone is not a return. Readiness and Realtime keep visible pages current.
const listeners = new Set<() => void>();
let stop: (() => void) | undefined;
export function onTabReturn(listener: () => void): () => void {
  listeners.add(listener);
  if (!stop) {
    let hidden = document.visibilityState === 'hidden';
    let visibleAt = -Infinity;
    const publish = () => { for (const callback of [...listeners]) callback(); };
    const visibility = () => {
      if (document.visibilityState === 'hidden') { hidden = true; visibleAt = -Infinity; return; }
      if (!hidden || document.visibilityState !== 'visible') return;
      hidden = false; visibleAt = performance.now(); publish();
    };
    const restored = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      hidden = false;
      // A restore can also deliver visible; a new hidden period is always distinct.
      if (performance.now() - visibleAt < 1000) return;
      publish();
    };
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('pageshow', restored);
    stop = () => {
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('pageshow', restored); stop = undefined;
    };
  }
  return () => { listeners.delete(listener); if (!listeners.size) stop?.(); };
}

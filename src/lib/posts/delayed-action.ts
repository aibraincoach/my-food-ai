/** Keep a destructive request undoable until the timer expires. A page closing
 * flushes it with keepalive; either path may commit the operation only once. */
export function delayAction(ms: number, run: (keepalive?: boolean) => void | Promise<void>): {undo(): void} {
  let pending=true;
  const finish=(keepalive=false)=>{
    if (!pending) return;
    pending=false;
    clearTimeout(timer);
    window.removeEventListener('pagehide',flush);
    void run(keepalive);
  };
  const flush=()=>finish(true);
  const timer=setTimeout(()=>finish(),ms);
  window.addEventListener('pagehide',flush);
  return {undo(){if(!pending)return;pending=false;clearTimeout(timer);window.removeEventListener('pagehide',flush);}};
}

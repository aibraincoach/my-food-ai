let users = 0;
let originalOverflow = '';

/** Full-screen capture and sheets share one lock, including nested close paths. */
export function lockBodyScroll(): () => void {
  if (users++ === 0) {
    originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  let released = false;
  return () => {
    if (released) return;
    released = true;
    if (--users === 0) document.body.style.overflow = originalOverflow;
  };
}

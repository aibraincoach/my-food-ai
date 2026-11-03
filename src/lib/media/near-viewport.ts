// Native image lazy loading can fetch several screens ahead. Keep private
// feed URLs unset until their fixed-size image is close to the visible area.
export function observeNearViewport(element: Element, reveal: () => void): () => void {
  if (typeof IntersectionObserver === 'undefined') { reveal(); return () => {}; }
  let active = true;
  const observer = new IntersectionObserver(entries => {
    if (!active || !entries.some(entry => entry.isIntersecting)) return;
    active = false;
    observer.disconnect();
    reveal();
  }, {rootMargin: '100px'});
  observer.observe(element);
  return () => {active = false; observer.disconnect();};
}

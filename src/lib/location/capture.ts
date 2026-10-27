export type CapturedLocation = { lat: number; lng: number; accuracy_m: number };

// Storage may be unavailable in private browsing; location stays optional.
let denied = false;
export async function requestLocation(): Promise<CapturedLocation | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation || denied) return null;
  try { if (sessionStorage.getItem("loc-denied") === "1") return null; } catch {}
  return new Promise((resolve) => {
    let finished = false;
    const finish = (value: CapturedLocation | null) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      resolve(value);
    };
    // Also bound time spent waiting for a browser permission decision.
    const timer = setTimeout(() => finish(null), 5000);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => finish({ lat: coords.latitude, lng: coords.longitude, accuracy_m: coords.accuracy }),
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          denied = true;
          try { sessionStorage.setItem("loc-denied", "1"); } catch {}
        }
        finish(null);
      },
      { timeout: 5000, maximumAge: 60000, enableHighAccuracy: false },
    );
  });
}

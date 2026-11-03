const SHELL_CACHE = "my-food-ai-shell-v2";
const MEDIA_CACHE = "mfa-media-v1";
const MAX_MEDIA = 300;
let mediaGeneration = 0;
let mediaWrites = Promise.resolve();

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    // Store only an anonymous entry page. Authenticated navigation responses
    // may contain private data, so they are never written to the shared cache.
    for (const path of ["/", "/manifest.webmanifest"]) {
      const response = await fetch(new Request(new URL(path, self.location.origin), {
        credentials: "omit",
        cache: "reload",
      }));
      if (!response.ok) throw new Error("App shell could not be cached.");
      // The anonymous entry may redirect to sign-in. Store a normal response
      // so its redirected flag cannot invalidate an offline navigation reply.
      const headers = new Headers(response.headers);
      headers.delete("content-encoding");
      headers.delete("content-length");
      await cache.put(path, new Response(await response.arrayBuffer(), {
        status: response.status,
        statusText: response.statusText,
        headers,
      }));
    }
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name !== SHELL_CACHE && name !== MEDIA_CACHE).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener("message", (event) => {
  if (event.data?.type !== "clear-media") return;
  // Synchronously invalidate pending fetches, then wait for their writes before
  // removing the cache. A late response must not recreate private media.
  mediaGeneration++;
  event.waitUntil((async () => {
    await mediaWrites.catch(() => {});
    await caches.delete(MEDIA_CACHE);
    event.ports?.[0]?.postMessage({ type: "media-cleared" });
  })());
});

function isFeedImage(request) {
  if (request.method !== "GET") return false;
  const url = new URL(request.url);
  return /^https?:$/.test(url.protocol) && url.pathname.includes("/storage/v1/object/sign/media/") && url.pathname.endsWith(".feed.jpg");
}

async function feedImage(request, generation) {
  const url = new URL(request.url);
  const key = url.origin + url.pathname;
  let cache;
  try {
    cache = await caches.open(MEDIA_CACHE);
    const cached = await cache.match(key);
    if (cached && generation === mediaGeneration) return cached;
  } catch { /* A storage failure does not prevent a network image. */ }
  const response = await fetch(request);
  if (response.status === 200 && response.type !== "opaque") {
    const copy = response.clone();
    mediaWrites = mediaWrites.catch(() => {}).then(async () => {
      if (generation !== mediaGeneration) return;
      const target = cache || await caches.open(MEDIA_CACHE);
      if (generation !== mediaGeneration) return;
      await target.put(key, copy);
      const keys = await target.keys();
      await Promise.all(keys.slice(0, Math.max(0, keys.length - MAX_MEDIA)).map(old => target.delete(old)));
    }).catch(() => { /* Cache quota cannot fail an otherwise loaded image. */ });
    await mediaWrites;
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  if (isFeedImage(event.request)) {
    event.respondWith(feedImage(event.request, mediaGeneration));
    return;
  }
  if (event.request.mode !== "navigate") return;
  event.respondWith((async () => {
    try {
      return await fetch(event.request);
    } catch {
      const cache = await caches.open(SHELL_CACHE);
      const shell = await cache.match("/");
      return shell || Response.error();
    }
  })());
});

self.addEventListener("push", (event) => {
  let payload;
  try { payload = event.data?.json(); } catch { return; }
  if (!payload || !/^[0-9a-f-]{36}$/i.test(payload.postId)) return;
  event.waitUntil(self.registration.showNotification(payload.title || "Your meal is ready", {
    body: typeof payload.body === "string" ? payload.body : undefined,
    image: typeof payload.image === "string" ? payload.image : undefined,
    icon: "/icons/icon-192.png", tag: `meal:${payload.postId}`,
    data: { postId: payload.postId },
  }));
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const id = event.notification.data?.postId;
  if (!/^[0-9a-f-]{36}$/i.test(id || "")) return;
  event.waitUntil((async () => {
    const url = new URL(`/posts/${id}`, self.location.origin).href;
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const window of windows) {
      if (new URL(window.url).origin !== self.location.origin) continue;
      await window.navigate(url); await window.focus(); return;
    }
    await self.clients.openWindow(url);
  })());
});

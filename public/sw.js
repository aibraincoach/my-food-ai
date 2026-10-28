const SHELL_CACHE = "my-food-ai-shell-v1";

self.addEventListener("install", (event) => {
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

self.addEventListener("fetch", (event) => {
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

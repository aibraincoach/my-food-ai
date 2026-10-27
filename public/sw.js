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

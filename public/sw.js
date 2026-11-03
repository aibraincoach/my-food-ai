const SHELL_CACHE = "my-food-ai-shell-v4";
// Retire the previous media cache, which had no durable logout tombstones.
const MEDIA_CACHE = "mfa-media-v2";
const CONTROL_CACHE = "mfa-media-control-v1";
const CONTROL_URL = new URL("/__mfa_media_control__", self.location.origin).href;
const MAX_MEDIA = 300;
const PUBLIC_ASSET = /^\/_next\/static\/(?:immutable\/)?(?:chunks|media)\//;
// Cache only the public hashed files named by the anonymous shell. Flight
// references omit /_next/, while script/link attributes include it.
function shellAssets(html) {
  const matches = html.matchAll(/["']((?:(?:https?:)?\/\/[^/"'\\\s]+)?\/_next\/static\/(?:immutable\/)?(?:chunks|media)\/[a-zA-Z0-9._/-]+\.(?:js|css|woff2?)\b|static\/(?:immutable\/)?(?:chunks|media)\/[a-zA-Z0-9._/-]+\.(?:js|css|woff2?)\b)/g);
  const urls = new Set();
  for (const [, value] of matches) {
    if (value.includes('/../')) continue;
    const url = new URL(value.startsWith('static/') ? '/_next/' + value : value, self.location.origin);
    if (url.origin === self.location.origin && PUBLIC_ASSET.test(url.pathname) && !url.search) urls.add(url.href);
    if (urls.size === 64) break;
  }
  return [...urls];
}
async function putDecoded(cache, key, response) {
  const headers = new Headers(response.headers);
  headers.delete('content-encoding'); headers.delete('content-length');
  await cache.put(key, new Response(await response.arrayBuffer(), {status: response.status, statusText: response.statusText, headers}));
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
let mediaGeneration = 0;
let logoutGeneration = 0;
let disabledImmediately = false;
let mediaWrites = Promise.resolve();
let controlWrites = Promise.resolve();
const clientEpochs = new Map();
const navigationEpochs = new Map();
const bindingWaiters = new Set();
const freshControl = () => ({mode: "uninitialized", epoch: null, userId: null, blocked: [], locked: false});
const notifyBindings = () => { for (const notify of [...bindingWaiters]) notify(); };

const control = (async () => {
  try {
    const cache = await caches.open(CONTROL_CACHE);
    const response = await cache.match(CONTROL_URL);
    if (!response) {
      // Missing authorization metadata alongside private bytes is ambiguous.
      const names = await caches.keys();
      if (names.includes(MEDIA_CACHE) && (await (await caches.open(MEDIA_CACHE)).keys()).length) return {...freshControl(), mode: "disabled", locked: true};
      return freshControl();
    }
    const value = await response.json();
    if (!["uninitialized", "active", "disabled"].includes(value.mode) || !Array.isArray(value.blocked) || value.blocked.length > 256 || !value.blocked.every(id => typeof id === "string" && UUID.test(id)) || typeof value.locked !== "boolean" || (value.mode === "active" && (!UUID.test(value.epoch) || !UUID.test(value.userId)))) throw Error("Invalid media session metadata");
    return value;
  } catch { return {...freshControl(), mode: "disabled", locked: true}; }
})();
async function persistControl(state) {
  try {
    await (await caches.open(CONTROL_CACHE)).put(CONTROL_URL, new Response(JSON.stringify(state), {headers: {"Content-Type": "application/json"}}));
  } catch {
    state.mode = "disabled"; state.locked = true; disabledImmediately = true;
    clientEpochs.clear(); notifyBindings();
    throw Error("Private media authorization could not be persisted");
  }
}
function controlOperation(fn) {
  const operation = controlWrites.catch(() => {}).then(async () => fn(await control));
  controlWrites = operation.catch(() => {});
  return operation;
}
function addBlocked(state, values) {
  if (!Array.isArray(values) || !values.every(id => typeof id === "string" && UUID.test(id))) {state.locked = true; return;}
  state.blocked = [...new Set([...state.blocked, ...values])];
  if (state.blocked.length > 256) state.locked = true;
}
async function disableMedia(state, data = {}) {
  state.mode = "disabled";
  addBlocked(state, [...(state.epoch ? [state.epoch] : []), ...(UUID.test(data.epoch) ? [data.epoch] : []), ...(Array.isArray(data.blocked) ? data.blocked : [])]);
  state.locked ||= Boolean(data.locked);
  await persistControl(state);
  // Persist the tombstone first; a worker restart must stay disabled even while
  // a previously started Cache.put is finishing.
  await mediaWrites.catch(() => {});
  await caches.delete(MEDIA_CACHE);
}

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    let shell = "";
    for (const path of ["/", "/shell", "/manifest.webmanifest"]) {
      const response = await fetch(new Request(new URL(path, self.location.origin), {credentials: "omit", cache: "reload"}));
      if (!response.ok) throw Error("App shell could not be cached.");
      if (path === "/shell") shell = await response.clone().text();
      await putDecoded(cache, path, response);
    }
    // The first fallback must not download a new client bundle before showing
    // the last feed. No authenticated HTML, API result or private media enters
    // this public cache; a failed optional asset retains the normal network path.
    await Promise.allSettled(shellAssets(shell).map(async url => {
      const response = await fetch(new Request(url, {credentials: "omit", cache: "force-cache"}));
      const policy = response.headers.get("cache-control") ?? "";
      if (response.ok && /\bpublic\b/i.test(policy) && /\bimmutable\b/i.test(policy) && !/\bprivate\b|no-store/i.test(policy)) await putDecoded(cache, url, response);
    }));
  })());
});
self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => ![SHELL_CACHE, MEDIA_CACHE, CONTROL_CACHE].includes(name)).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});
function authorizeClient(data, sourceId) {
  const requestedGeneration = mediaGeneration;
  return controlOperation(async state => {
      if (requestedGeneration !== mediaGeneration) return false;
      addBlocked(state, data.blocked);
      state.locked ||= Boolean(data.locked);
      if (!sourceId || !UUID.test(data.epoch) || !UUID.test(data.userId) || state.locked || state.blocked.includes(data.epoch)) {
        if (state.locked || state.blocked.includes(state.epoch)) {
          mediaGeneration++; disabledImmediately = true; clientEpochs.clear(); notifyBindings();
          await disableMedia(state, data);
        }
        return false;
      }
      const same = state.mode === "active" && state.epoch === data.epoch && state.userId === data.userId;
      const bootstrap = state.mode === "uninitialized" && !state.blocked.length;
      const newSession = ["SIGNED_IN", "NEW_SESSION"].includes(data.transition);
      if (!same && !bootstrap && !newSession) return false;
      if (!same && !bootstrap) {
        mediaGeneration++; disabledImmediately = true; clientEpochs.clear(); notifyBindings();
        await disableMedia(state);
      }
      state.mode = "active"; state.epoch = data.epoch; state.userId = data.userId;
      const activatedGeneration = mediaGeneration;
      await persistControl(state);
      // A logout arriving while this authorization was being persisted wins.
      if (activatedGeneration !== mediaGeneration) return false;
      clientEpochs.set(sourceId, {epoch: data.epoch, userId: data.userId});
      disabledImmediately = false; notifyBindings();
      return true;
  });
}
async function navigationSession(event, response) {
  const epoch = response.headers.get("x-mfa-media-session"), userId = response.headers.get("x-mfa-media-user");
  const clientId = event.resultingClientId || event.clientId;
  if (!clientId || !UUID.test(epoch) || !UUID.test(userId)) return;
  navigationEpochs.set(clientId, {epoch, userId});
  const state = await control;
  if (!disabledImmediately && !state.locked && state.mode === "active" && state.epoch === epoch && state.userId === userId && !state.blocked.includes(epoch)) {
    clientEpochs.set(clientId, {epoch, userId}); notifyBindings(); return;
  }
  await authorizeClient({epoch, userId, transition: "SIGNED_IN", blocked: [], locked: false}, clientId);
}

self.addEventListener("message", event => {
  const data = event.data;
  if (data?.type === "clear-media") {
    // This synchronous barrier also rejects requests beginning AFTER logout.
    mediaGeneration++; logoutGeneration++; disabledImmediately = true; clientEpochs.clear(); navigationEpochs.clear(); notifyBindings();
    event.waitUntil(controlOperation(async state => {
      await disableMedia(state, data);
      event.ports?.[0]?.postMessage({type: "media-cleared"});
    }));
  } else if (data?.type === "media-no-session") {
    mediaGeneration++; logoutGeneration++; disabledImmediately = true; clientEpochs.clear(); navigationEpochs.clear(); notifyBindings();
    event.waitUntil(controlOperation(async state => {
      if (state.mode === "uninitialized" && !state.blocked.length && !state.locked) return;
      await disableMedia(state);
    }));
  } else if (data?.type === "media-session") {
    event.waitUntil(authorizeClient(data, event.source?.id).then(accepted => {
      if (accepted) event.ports?.[0]?.postMessage({type: "media-session-accepted"});
    }));
  }
});

function mediaOwner(request) {
  try {
    if (request.method !== "GET") return null;
    const url = new URL(request.url);
    const resized = url.pathname.match(/^\/api\/media\/feed\/([^/]+)\/([^/]+)\/([^/]+)\/v1\.webp$/);
    if (resized) return url.origin === self.location.origin && !url.search && resized.slice(1).every(value => UUID.test(value)) ? resized[1] : null;
    if (!/^https?:$/.test(url.protocol) || !url.pathname.endsWith(".feed.jpg")) return null;
    const marker = "/storage/v1/object/sign/media/", index = url.pathname.indexOf(marker);
    if (index < 0) return null;
    const owner = decodeURIComponent(url.pathname.slice(index + marker.length).split("/")[0]);
    return UUID.test(owner) ? owner : null;
  } catch { return null; }
}
async function eligible(clientId, request, generation) {
  const state = await control;
  const identity = clientEpochs.get(clientId);
  return !disabledImmediately && generation === mediaGeneration && !state.locked && state.mode === "active" && identity?.epoch === state.epoch && identity.userId === state.userId && mediaOwner(request) === state.userId;
}
async function writable(clientId, request, context) {
  const state = await control, identity = clientEpochs.get(clientId);
  if (context.logout !== logoutGeneration || state.locked || state.mode !== "active" || disabledImmediately) return false;
  return identity?.epoch === state.epoch && identity.userId === state.userId && mediaOwner(request) === state.userId
    && (context.identity ? identity.epoch === context.identity.epoch && identity.userId === context.identity.userId : context.bootstrap);
}
async function waitForBinding(clientId, request, context) {
  const until = Date.now() + 15000;
  for (;;) {
    if (await writable(clientId, request, context)) return true;
    const state = await control, identity = clientEpochs.get(clientId);
    if (context.logout !== logoutGeneration || state.locked || Date.now() >= until
      || (!context.identity && !context.bootstrap) || state.blocked.includes(context.identity?.epoch)
      || (identity && context.identity && identity.epoch !== context.identity.epoch)) return false;
    await new Promise(resolve => {
      const done = () => {clearTimeout(timer); bindingWaiters.delete(done); resolve();};
      const timer = setTimeout(done, Math.max(0, until - Date.now()));
      bindingWaiters.add(done);
    });
  }
}
async function feedImage(event, generation) {
  const request = event.request, url = new URL(request.url), key = url.origin + url.pathname;
  const logout = logoutGeneration, state = await control;
  const context = {logout, identity: clientEpochs.get(event.clientId) || navigationEpochs.get(event.clientId), bootstrap: state.mode === "uninitialized" && !state.locked};
  let cache;
  if (await eligible(event.clientId, request, generation)) {
    try {
      cache = await caches.open(MEDIA_CACHE);
      const cached = await cache.match(key);
      if (cached && await eligible(event.clientId, request, generation)) return cached;
    } catch { /* Storage failure cannot prevent a network image. */ }
  }
  // Logout clears Cache API entries, but cannot erase the browser HTTP cache.
  // Unbound, foreign and logged-out clients must reauthenticate at the origin
  // instead of receiving a year-fresh private response from that second cache.
  const response = await fetch(request, await eligible(event.clientId, request, generation) ? undefined : {cache: "no-store"});
  if (response.status === 200 && response.type !== "opaque") {
    const copy = response.clone();
    const persistence = waitForBinding(event.clientId, request, context).then(allowed => {
      if (!allowed) return;
      // Waiting for first hydration is outside the serialized I/O queue, so an
      // unregistered background tab cannot hold up an authenticated tab's writes.
      mediaWrites = mediaWrites.catch(() => {}).then(async () => {
        const target = cache || await caches.open(MEDIA_CACHE);
        if (!await writable(event.clientId, request, context)) return;
        await target.put(key, copy);
        const keys = await target.keys();
        await Promise.all(keys.slice(0, Math.max(0, keys.length - MAX_MEDIA)).map(old => target.delete(old)));
      }).catch(() => {});
      return mediaWrites;
    });
    event.waitUntil(persistence);
  }
  return response;
}
self.addEventListener("fetch", event => {
  const publicUrl = new URL(event.request.url);
  if (event.request.method === "GET" && publicUrl.origin === self.location.origin && PUBLIC_ASSET.test(publicUrl.pathname) && !publicUrl.search) {
    event.respondWith((async () => (await (await caches.open(SHELL_CACHE)).match(publicUrl.href)) || fetch(event.request))());
    return;
  }
  if (mediaOwner(event.request)) {
    event.respondWith(feedImage(event, mediaGeneration));
    return;
  }
  const sameOrigin = new URL(event.request.url).origin === self.location.origin;
  const navUrl = new URL(event.request.url);
  if (event.request.mode === "navigate" && navUrl.origin === self.location.origin && navUrl.pathname === "/" && !navUrl.searchParams.has("_")) {
    event.respondWith((async () => {
      const network = fetch(event.request).then(response => {
        if (response.ok) event.waitUntil(navigationSession(event, response).catch(() => {}));
        return response;
      });
      const timer = new Promise(resolve => setTimeout(() => resolve(null), 1500));
      const first = await Promise.race([network.catch(() => null), timer]);
      if (first) return first;
      const state = await control;
      const shell = !disabledImmediately && !state.locked && state.mode === "active" ? await (await caches.open(SHELL_CACHE)).match("/shell") : null;
      if (shell && !disabledImmediately && state.mode === "active") { event.waitUntil(network.catch(() => {})); return shell; }
      try { return await network; } catch { return (await (await caches.open(SHELL_CACHE)).match("/")) || Response.error(); }
    })());
    return;
  }
  const rsc = event.request.method === "GET" && sameOrigin && event.request.headers?.get("RSC") === "1";
  if (event.request.mode !== "navigate" && !rsc) return;
  event.respondWith((async () => {
    try {
      const response = await fetch(event.request);
      // Same-origin middleware validated these UUIDs. Register before image
      // eligibility checks, but never make HTML delivery wait on cache I/O.
      if (response.ok && new URL(event.request.url).origin === self.location.origin) event.waitUntil(navigationSession(event, response).catch(() => {}));
      return response;
    } catch {return await (await caches.open(SHELL_CACHE)).match("/") || Response.error();}
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

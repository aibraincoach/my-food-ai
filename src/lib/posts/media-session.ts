"use client";
import {mediaSessionEpoch} from "@/lib/auth/media-session-epoch";
export {mediaSessionEpoch} from "@/lib/auth/media-session-epoch";
import {createClient} from "@/lib/supabase/client";

const BLOCKED_KEY = "mfa-media-blocked-sessions-v1";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type Epoch = {epoch: string; userId: string};
type Privacy = {blocked: string[]; locked: boolean};
type Session = {access_token: string; user: {id: string}};
let latest: Epoch | null = null;
let accepted: Epoch | null = null;
let users = 0;
let detach: (() => void) | undefined;
const warmed = new Set<string>();
function warmLoadedPhotos(identity: Epoch) {
  if (typeof document === 'undefined' || activeMediaUserId() !== identity.userId) return;
  const candidates = Array.from(document.images).filter(image => image.complete && image.naturalWidth > 0).slice(0, 6);
  for (const image of candidates) {
    try {
      const url = new URL(image.currentSrc || image.src, location.href);
      const marker = `/storage/v1/object/sign/media/${identity.userId}/`;
      const resized = url.pathname.match(/^\/api\/media\/feed\/([^/]+)\/([^/]+)\/([^/]+)\/v[12]\.webp$/);
      const ownedResize = resized && url.origin === new URL(location.href).origin && !url.search && resized.slice(1).every(value => UUID.test(value)) && resized[1] === identity.userId;
      const ownedStorage = url.pathname.includes(marker) && url.pathname.endsWith('.feed.jpg');
      if (!ownedResize && !ownedStorage) continue;
      const key = `${identity.epoch}:${url.origin}${url.pathname}`;
      if (warmed.has(key)) continue;
      warmed.add(key);
      void fetch(url, {mode: 'cors', credentials: ownedResize ? 'same-origin' : 'omit', cache: 'force-cache'}).then(async response => {
        if (!response.ok) throw Error('Photo cache warming failed');
        await response.arrayBuffer();
      }).catch(() => warmed.delete(key));
    } catch { /* Warming is optional and never changes the visible image. */ }
  }
}
function registerMediaSession(message: object, identity: Epoch) {
  const worker = navigator.serviceWorker.controller;
  if (!worker) return;
  if (typeof MessageChannel === 'undefined') {worker.postMessage(message); return;}
  const channel = new MessageChannel();
  const close = () => {clearTimeout(timer); channel.port1.close(); channel.port2.close();};
  const timer = setTimeout(close, 3000);
  channel.port1.onmessage = event => {
    close();
    if (event.data?.type === 'media-session-accepted' && navigator.serviceWorker.controller === worker && latest?.epoch === identity.epoch && activeMediaUserId() === identity.userId) {accepted = identity; warmLoadedPhotos(identity);}
  };
  try {worker.postMessage(message, [channel.port2]);} catch {close();}
}

function privacy(): Privacy {
  try {
    const raw = localStorage.getItem(BLOCKED_KEY);
    if (!raw) return {blocked: [], locked: false};
    const value = JSON.parse(raw);
    if (!Array.isArray(value.blocked) || value.blocked.length > 256 || !value.blocked.every((id: unknown) => typeof id === 'string' && UUID.test(id)) || typeof value.locked !== 'boolean') return {blocked: [], locked: true};
    return value;
  } catch { return {blocked: [], locked: true}; }
}
// Synchronous hint only; callers must still require an existing owned cache row.
// Null during bootstrap/logout never authorizes inserting another account's data.
export function activeMediaUserId(): string | null {
  const state = privacy();
  return latest && !state.locked && !state.blocked.includes(latest.epoch) ? latest.userId : null;
}

export function blockMediaSession(): Privacy & {epoch: string | null} {
  warmed.clear(); accepted = null;
  const previous = privacy();
  const blocked = [...new Set([...previous.blocked, ...(latest ? [latest.epoch] : [])])];
  const value = {blocked, locked: previous.locked || !latest || blocked.length > 256};
  try { localStorage.setItem(BLOCKED_KEY, JSON.stringify(value)); }
  catch { value.locked = true; }
  return {...value, epoch: latest?.epoch ?? null};
}

// Singleton subscription: the server seed, cached fallback and Profile can
// overlap without duplicate Auth listeners or transmitting an access token.
export function connectMediaSession(): () => void {
  users++;
  if (!detach && typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    const db = createClient();
    let live = true;
    let generation = 0;
    const publish = (event: string, session: Session | null) => {
      if (!live) return;
      const identity = mediaSessionEpoch(session);
      if (!identity) {
        if (event === 'SIGNED_OUT' || latest) {
          const blocked = blockMediaSession();
          latest = null;
          navigator.serviceWorker.controller?.postMessage({type: 'clear-media', ...blocked});
        } else {
          navigator.serviceWorker.controller?.postMessage({type: 'media-no-session'});
        }
        return;
      }
      latest = identity;
      const state = privacy();
      // Server-action sign-in supplies a new cookie session on INITIAL_SESSION.
      // A novel, unblocked UUID is an explicit new identity transition; an old
      // INITIAL_SESSION or SIGNED_IN for a blocked UUID cannot reactivate it.
      const transition = event === 'SIGNED_IN' ? 'SIGNED_IN'
        : state.blocked.length && !state.blocked.includes(identity.epoch) ? 'NEW_SESSION' : 'INITIAL_SESSION';
      registerMediaSession({type: 'media-session', ...identity, ...state, transition}, identity);
    };
    const refresh = () => {
      const version = ++generation;
      void db.auth.getSession().then(({data: {session}}) => {if (live && version === generation) publish('INITIAL_SESSION', session);}).catch(() => {if (live && version === generation) publish('INITIAL_SESSION', null);});
    };
    const subscription = db.auth.onAuthStateChange((event, session) => {generation++; publish(event, session);});
    const controller = () => {accepted = null; refresh();};
    const loaded = () => {if (latest && accepted?.epoch === latest.epoch && navigator.serviceWorker.controller) warmLoadedPhotos(latest);};
    const storage = (event: StorageEvent) => {if (event.key === BLOCKED_KEY || event.key === null) refresh();};
    navigator.serviceWorker.addEventListener('controllerchange', controller);
    window.addEventListener('storage', storage);
    window.addEventListener('load', loaded);
    document.addEventListener('load', loaded, true);
    refresh();
    detach = () => {
      live = false; generation++; subscription.data.subscription.unsubscribe();
      navigator.serviceWorker.removeEventListener('controllerchange', controller);
      window.removeEventListener('storage', storage);
      window.removeEventListener('load', loaded);
      document.removeEventListener('load', loaded, true);
      latest = null; accepted = null; warmed.clear();
    };
  }
  return () => {if (--users === 0) {detach?.(); detach = undefined;}};
}

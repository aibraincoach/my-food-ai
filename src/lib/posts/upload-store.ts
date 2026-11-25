import type {CaptureFailure} from './capture-failure';
import type {TileDrinkRequest,PhotoDrinksRequest} from './drink-request';
import type {CopyRequest} from './copy-request';

import type {FoodRequest} from './food-request';
import type { CapturedLocation } from '@/lib/location/capture';
import type { PostOptions, UploadSnapshot } from './create';

/** Durable publish acknowledgement without image bytes (#625, #570). */
export interface PublishIntent {
    operationId: string;
    ownerId: string;
    createdAt: number;
    postId: string | null;
    notEaten: boolean;
}
export interface StoredUpload {
    operationId: string;
    ownerId: string;
    createdAt: number;
    reservedAt: number;
    caption: string;
    eatenAt: string | null;
    location: CapturedLocation | null;
    options: PostOptions;
    files: File[];
    snapshot: UploadSnapshot | null;
    posted: boolean;
    publishStarted?: boolean;
    food?: FoodRequest;
    drink?: TileDrinkRequest;
    photoDrinks?: PhotoDrinksRequest;
    copy?: CopyRequest;
    // A durable photo for an existing meal; the prepared stage is reused after reload.
    attachment?: {postId: string; notEaten: boolean};
    attachmentPhoto?: {path: string; width: number; height: number};

    cancelRequested?: boolean;
    resultPostId?: string;
    photoLost?: boolean;
    failureKind?: 'storage';
    lostNoticeSeen?: true;
    failure?: CaptureFailure;
    state: 'uploading' | 'uploaded' | 'failed';
    error?: 'dropped' | 'too_large' | 'no_response';
    sent: number;
    total: number;
}
const DB_NAME = 'mfa-uploads';
const DB_VERSION = 4;
type PhotoRef = {key: string; name: string; type: string; lastModified: number; size: number};
export type StoredPhoto = {key: string; operationId: string; ownerId: string; type: string; bytes: ArrayBuffer};
type PhotoRow = Omit<StoredUpload, 'files' | 'snapshot'> & {
    photoRevision: string;
    files: PhotoRef[];
    snapshot: (Omit<UploadSnapshot, 'images'> & {images: {original: PhotoRef; feed: PhotoRef; width: number; height: number; phash: string}[]}) | null;
};
const isRef = (value: unknown): value is PhotoRef => typeof value === 'object' && value !== null && typeof (value as PhotoRef).key === 'string' && typeof (value as PhotoRef).type === 'string' && typeof (value as PhotoRef).name === 'string' && Number.isFinite((value as PhotoRef).lastModified) && Number.isFinite((value as PhotoRef).size);
const lost = (row: PhotoRow): PhotoRow => ({...row, files: [], snapshot: null, photoLost: true, state: 'failed'});
function database(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        let failed = false;
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
            const db = request.result;
            // The unlaunched app keeps only the current format. Older pending drafts are discarded.
            for (const name of Array.from(db.objectStoreNames)) db.deleteObjectStore(name);
            db.createObjectStore('drafts', {keyPath: 'operationId'});
            db.createObjectStore('intents', {keyPath: 'operationId'});
            const photos = db.createObjectStore('photos', {keyPath: 'key'});
            photos.createIndex('operationId', 'operationId');
        };
        request.onblocked = () => { failed = true; reject(new Error('The photo store upgrade is blocked by another open connection.')); };
        request.onsuccess = () => {
            if (failed) { request.result.close(); return; }
            request.result.onversionchange = () => request.result.close();
            resolve(request.result);
        };
        request.onerror = () => reject(request.error);
    });
}
async function transaction<T>(stores: string | string[], mode: IDBTransactionMode, action: (tx: IDBTransaction, abort: (error: unknown) => void) => IDBRequest<T> | void): Promise<T | void> {
    const db = await database();
    try {
        return await new Promise<T | void>((resolve, reject) => {
            const tx = db.transaction(stores, mode); let result: T | void;
            tx.oncomplete = () => resolve(result); tx.onerror = tx.onabort = () => reject(tx.error ?? new Error('Photo transaction aborted.'));
            const abort = (error: unknown) => { tx.abort(); reject(error); };
            try {
                const request = action(tx, abort);
                if (request) { request.onsuccess = () => { result = request.result; }; request.onerror = () => reject(request.error); }
            } catch (error) { tx.abort(); reject(error); }
        });
    } finally { db.close(); }
}
// Weak identities describe bytes already committed at this revision; metadata
// updates don't read or write them again. remove/clear release the operation.
type PhotoCache = {revision: string; ownerId: string; identities: Map<string, WeakSet<Blob>>; retained: {key: string; file: File}[]};
const committed = new Map<string, PhotoCache>();
let writes: Promise<unknown> = Promise.resolve();
function enqueue<T>(action: () => Promise<T>): Promise<T> { const result = writes.then(action); writes = result.catch(() => {}); return result; }
export function restoreUploadDraft(row: PhotoRow, photos: Map<string, StoredPhoto>): StoredUpload {
    const blobs = new Map<string, Blob>();
    const read = (ref: PhotoRef): Blob => {
        if (!isRef(ref)) throw new Error('Invalid photo reference.');
        const photo = photos.get(ref.key);
        if (!photo || photo.ownerId !== row.ownerId || photo.operationId !== row.operationId || !(photo.bytes instanceof ArrayBuffer) || photo.bytes.byteLength !== ref.size) throw new Error('Missing photo bytes.');
        let blob = blobs.get(ref.key);
        if (!blob) { blob = new Blob([photo.bytes], {type: ref.type}); blobs.set(ref.key, blob); }
        return blob;
    };
    try {
        const files = row.files.map(ref => new File([read(ref)], ref.name, {type: ref.type, lastModified: ref.lastModified}));
        const snapshot = row.snapshot ? {...row.snapshot, images: row.snapshot.images.map(image => ({...image, original: read(image.original), feed: read(image.feed)}))} : null;
        const prior = committed.get(row.operationId);
        const cache: PhotoCache = prior?.revision === row.photoRevision ? prior : {revision: row.photoRevision, ownerId: row.ownerId, identities: new Map(), retained: []};
        for (const [key, blob] of blobs) { if (!cache.identities.has(key)) cache.identities.set(key, new WeakSet()); cache.identities.get(key)!.add(blob); }
        files.forEach((file, index) => { cache.identities.get(row.files[index].key)!.add(file); cache.retained[index] = {key: row.files[index].key, file}; });
        committed.set(row.operationId, cache);
        const {photoRevision: _revision, ...data} = row; void _revision;
        return {...data, files, snapshot};
    } catch {
        committed.delete(row.operationId);
        const {photoRevision: _revision, ...data} = lost(row); void _revision;
        return {...data, files: [], snapshot: null};
    }
}
async function checkRoom(bytes: number): Promise<void> {
    if (!bytes || typeof navigator === 'undefined' || !navigator.storage?.estimate) return;
    const {quota, usage} = await navigator.storage.estimate();
    // An incomplete estimate is unavailable, not evidence that a write will fail.
    // The transaction still reports an actual quota failure through the visible retry path.
    if (!Number.isFinite(quota) || quota! <= 0 || !Number.isFinite(usage) || usage! < 0) return;
    const margin = Math.max(64 * 1024, Math.ceil(bytes * 0.1));
    if (quota! - usage! < bytes + margin) throw new DOMException('Insufficient photo storage.', 'QuotaExceededError');
}
async function put(draft: StoredUpload): Promise<void> {
    const previous = await transaction('drafts', 'readonly', tx => tx.objectStore('drafts').get(draft.operationId)) as PhotoRow | undefined;
    if (previous && previous.ownerId !== draft.ownerId) throw new Error('Photo owner does not match.');
    const cached = committed.get(draft.operationId);
    if (cached && previous && cached.revision !== previous.photoRevision) { committed.delete(draft.operationId); throw new Error('The stored photo changed in another context.'); }
    const cache = previous && cached?.revision === previous.photoRevision ? cached : undefined;
    const desired = new Map<string, Blob>(), shared = new Map<Blob, string>();
    const ref = (blob: Blob, key: string, name = '', lastModified = 0): PhotoRef => {
        const prior = shared.get(blob); key = prior ?? key;
        if (!prior) { shared.set(blob, key); desired.set(key, blob); }
        return {key, name, type: blob.type, lastModified, size: blob.size};
    };
    const images = draft.snapshot?.images.map((image, index) => ({...image,
        original: ref(image.original, `${draft.operationId}:${index}:original`),
        feed: ref(image.feed, `${draft.operationId}:${index}:feed`),
    }));
    if (images && images.length !== draft.files.length) throw new Error('Photo snapshot does not match selection.');
    const fileRefs = draft.files.map((file, index) => images
        ? {...images[index].original, name: file.name, lastModified: file.lastModified}
        : ref(file, `${draft.operationId}:${index}:selected`, file.name, file.lastModified));
    const changed = [...desired].filter(([key, blob]) => !cache?.identities.get(key)?.has(blob));
    await checkRoom(changed.reduce((sum, [, blob]) => sum + blob.size, 0));
    // All Blob reads finish before opening the write transaction (#684/#1233).
    const photos = await Promise.all(changed.map(async ([key, blob]): Promise<StoredPhoto> => ({key, operationId: draft.operationId, ownerId: draft.ownerId, type: blob.type, bytes: await blob.arrayBuffer()})));
    const previousKeys = new Set([...(previous?.files.map(file => file.key) ?? []), ...(previous?.snapshot?.images.flatMap(image => [image.original.key, image.feed.key]) ?? [])]);
    const keysChanged = previousKeys.size !== desired.size || [...previousKeys].some(key => !desired.has(key));
    const revision = photos.length || !cache || keysChanged ? crypto.randomUUID() : cache.revision;
    const row: PhotoRow = {...draft, photoRevision: revision, files: fileRefs, snapshot: draft.snapshot ? {...draft.snapshot, images: images!} : null};
    await transaction(['drafts', 'photos'], 'readwrite', (tx, abort) => {
        const drafts = tx.objectStore('drafts'), store = tx.objectStore('photos');
        const current = drafts.get(draft.operationId);
        current.onsuccess = () => {
            try {
            if (current.result?.photoRevision !== previous?.photoRevision) { tx.abort(); return; }
            for (const photo of photos) store.put(photo);
            const keys = store.index('operationId').getAllKeys(draft.operationId);
            keys.onsuccess = () => { for (const key of keys.result) if (!desired.has(String(key))) store.delete(key); };
            drafts.put(row);
            } catch (error) { abort(error); }
        };
    });
    const identities = new Map<string, WeakSet<Blob>>();
    for (const [key, blob] of desired) { const known = cache?.identities.get(key) ?? new WeakSet<Blob>(); known.add(blob); identities.set(key, known); }
    const retained = fileRefs.map((fileRef, index) => {
        const prior = cache?.retained[index];
        if (prior?.key === fileRef.key && prior.file.name === fileRef.name && prior.file.type === fileRef.type && prior.file.lastModified === fileRef.lastModified && identities.get(fileRef.key)?.has(prior.file)) return prior.file;
        if (!images) return draft.files[index];
        return new File([draft.snapshot!.images[index].original], fileRef.name, {type: fileRef.type, lastModified: fileRef.lastModified});
    });
    retained.forEach((file, index) => identities.get(fileRefs[index].key)!.add(file));
    committed.set(draft.operationId, {revision, ownerId: draft.ownerId, identities, retained: retained.map((file, index) => ({key: fileRefs[index].key, file}))});
    // Normalize only after atomic commit: a failed write keeps the live selection.
    draft.files = retained;
}
export const uploadStore = {
    hasPending: async () => Boolean(await transaction('drafts', 'readonly', tx => tx.objectStore('drafts').count()) || await transaction('intents', 'readonly', tx => tx.objectStore('intents').count())),
    all: async () => {
        await writes;
        let rows: PhotoRow[] = [], photos: StoredPhoto[] = [];
        await transaction(['drafts', 'photos'], 'readonly', tx => {
            const draftRows = tx.objectStore('drafts').getAll(), photoRows = tx.objectStore('photos').getAll();
            draftRows.onsuccess = () => { rows = draftRows.result; };
            photoRows.onsuccess = () => { photos = photoRows.result; };
        });
        const byKey = new Map(photos.map(photo => [photo.key, photo]));
        return rows.map(row => restoreUploadDraft(row, byKey));
    },
    put: (draft: StoredUpload) => enqueue(() => put(draft)),
    remove: (id: string) => enqueue(async () => {
        await transaction(['drafts', 'photos', 'intents'], 'readwrite', tx => {
            tx.objectStore('drafts').delete(id); tx.objectStore('intents').delete(id);
            const store = tx.objectStore('photos'), keys = store.index('operationId').getAllKeys(id);
            keys.onsuccess = () => { for (const key of keys.result) store.delete(key); };
        });
        committed.delete(id);
    }),
    clear: () => enqueue(async () => { await transaction(['drafts', 'photos', 'intents'], 'readwrite', tx => { tx.objectStore('drafts').clear(); tx.objectStore('photos').clear(); tx.objectStore('intents').clear(); }); committed.clear(); }),
    allIntents: () => transaction('intents', 'readonly', tx => tx.objectStore('intents').getAll()) as Promise<PublishIntent[]>,
    putIntent: (intent: PublishIntent) => transaction('intents', 'readwrite', tx => tx.objectStore('intents').put(intent)),
};

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
const DB_VERSION = 3;
// Version 3 removes persisted wording once. There is no legacy message reader.
export function upgradeUploadDraft(value: Record<string, unknown>): Record<string, unknown> {
    if (!Object.prototype.hasOwnProperty.call(value, 'message')) return value;
    const {message: previousMessage, ...draft} = value;
    return {...draft, ...(typeof previousMessage === 'string' && previousMessage.trim()
        ? {failure: {code: 'saved-before-update'}} : {})};
}
function database(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = event => {
            const db = request.result;
            if (!db.objectStoreNames.contains('drafts')) db.createObjectStore('drafts', {keyPath: 'operationId'});
            if (!db.objectStoreNames.contains('intents')) db.createObjectStore('intents', {keyPath: 'operationId'});
            if (event.oldVersion > 0 && event.oldVersion < 3) {
                const cursor = request.transaction!.objectStore('drafts').openCursor();
                cursor.onsuccess = () => {
                    const row = cursor.result;
                    if (!row) return;
                    const original = row.value;
                    const upgraded = upgradeUploadDraft(original);
                    if (upgraded !== original) row.update(upgraded);
                    row.continue();
                };
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}
async function transaction<T>(stores: string | string[], mode: IDBTransactionMode, action: (tx: IDBTransaction) => IDBRequest<T> | void): Promise<T | void> {
    const db = await database();
    const names = Array.isArray(stores) ? stores : [stores];
    try {
        return await new Promise<T | void>((resolve, reject) => { const tx = db.transaction(names, mode); const request = action(tx); if (!request) {
            tx.oncomplete = () => resolve();
            tx.onerror = tx.onabort = () => reject(tx.error);
            return;
        } let result: T; request.onsuccess = () => { result = request.result; }; request.onerror = () => reject(request.error); tx.oncomplete = () => resolve(result); tx.onerror = tx.onabort = () => reject(tx.error); });
    }
    finally {
        db.close();
    }
}
// #684/#1233: every durable photo, including encoded snapshots, uses bytes.
// WebKit can refuse Blob/File storage. Old binary objects are never resumed.
type KeptFile = { name: string; type: string; lastModified: number; bytes: ArrayBuffer };
const isKept = (file: unknown): file is KeptFile => typeof file === 'object' && file !== null && !(file instanceof Blob) && (file as KeptFile).bytes instanceof ArrayBuffer;
async function keepPhoto(blob: Blob): Promise<KeptFile> {
    return {name: blob instanceof File ? blob.name : '', type: blob.type,
        lastModified: blob instanceof File ? blob.lastModified : 0, bytes: await blob.arrayBuffer()};
}
async function keepFiles(draft: StoredUpload): Promise<StoredUpload> {
    const files = await Promise.all(draft.files.map(keepPhoto));
    const snapshot = draft.snapshot ? {...draft.snapshot, images: await Promise.all(draft.snapshot.images.map(async image => ({
        ...image, original: await keepPhoto(image.original), feed: await keepPhoto(image.feed),
    })))} : null;
    return {...draft, files: files as unknown as File[], snapshot: snapshot as unknown as UploadSnapshot | null};
}
export function restoreFiles(row: StoredUpload): StoredUpload {
    const kept = row.files as unknown[];
    if (!kept.every(isKept)) return {...row, files: [], snapshot: null, photoLost: true, state: 'failed'};
    const images = row.snapshot?.images as unknown as {original: unknown; feed: unknown; width: number; height: number; phash: string}[] | undefined;
    // An old Blob snapshot cannot be resumed; retained original bytes still
    // support the normal encoder. There is only one stored binary format.
    const snapshot = row.snapshot && images?.every(image => isKept(image.original) && isKept(image.feed))
        ? {...row.snapshot, images: images.map(image => ({...image,
            original: new Blob([(image.original as KeptFile).bytes], {type: (image.original as KeptFile).type}),
            feed: new Blob([(image.feed as KeptFile).bytes], {type: (image.feed as KeptFile).type}),
        }))} : null;
    return {...row, snapshot, files: kept.map(file => new File([file.bytes], file.name, {type: file.type, lastModified: file.lastModified}))};
}
export const uploadStore = {
    // Update safety needs only existence, never decoding every stored photo.
    hasPending: async () => Boolean(await transaction('drafts', 'readonly', tx => tx.objectStore('drafts').count()) || await transaction('intents', 'readonly', tx => tx.objectStore('intents').count())),
    all: async () => ((await transaction('drafts', 'readonly', tx => tx.objectStore('drafts').getAll())) as StoredUpload[] | undefined ?? []).map(restoreFiles),
    // The bytes are read before the transaction opens: IndexedDB ends a transaction that waits on anything else.
    put: async (draft: StoredUpload) => { const row = await keepFiles(draft); return transaction('drafts', 'readwrite', tx => tx.objectStore('drafts').put(row)); },
    remove: (id: string) => transaction(['drafts', 'intents'], 'readwrite', tx => { tx.objectStore('drafts').delete(id); tx.objectStore('intents').delete(id); }),
    clear: () => transaction(['drafts', 'intents'], 'readwrite', tx => { tx.objectStore('drafts').clear(); tx.objectStore('intents').clear(); }),
    allIntents: () => transaction('intents', 'readonly', tx => tx.objectStore('intents').getAll()) as Promise<PublishIntent[]>,
    putIntent: (intent: PublishIntent) => transaction('intents', 'readwrite', tx => tx.objectStore('intents').put(intent)),
};

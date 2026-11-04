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
    message?: string;
    state: 'uploading' | 'uploaded' | 'failed';
    error?: 'dropped' | 'too_large' | 'no_response';
    sent: number;
    total: number;
}
const DB_NAME = 'mfa-uploads';
const DB_VERSION = 2;
function database(): Promise<IDBDatabase> { return new Promise((resolve, reject) => { const request = indexedDB.open(DB_NAME, DB_VERSION); request.onupgradeneeded = () => { const db = request.result; if (!db.objectStoreNames.contains('drafts'))
    db.createObjectStore('drafts', { keyPath: 'operationId' }); if (!db.objectStoreNames.contains('intents'))
    db.createObjectStore('intents', { keyPath: 'operationId' }); }; request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); }); }
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
export const uploadStore = {
    all: () => transaction('drafts', 'readonly', tx => tx.objectStore('drafts').getAll()) as Promise<StoredUpload[]>,
    put: (draft: StoredUpload) => transaction('drafts', 'readwrite', tx => tx.objectStore('drafts').put(draft)),
    remove: (id: string) => transaction(['drafts', 'intents'], 'readwrite', tx => { tx.objectStore('drafts').delete(id); tx.objectStore('intents').delete(id); }),
    clear: () => transaction(['drafts', 'intents'], 'readwrite', tx => { tx.objectStore('drafts').clear(); tx.objectStore('intents').clear(); }),
    allIntents: () => transaction('intents', 'readonly', tx => tx.objectStore('intents').getAll()) as Promise<PublishIntent[]>,
    putIntent: (intent: PublishIntent) => transaction('intents', 'readwrite', tx => tx.objectStore('intents').put(intent)),
};

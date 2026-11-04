import type {TileDrinkRequest,PhotoDrinksRequest} from './drink-request';
import type {CopyRequest} from './copy-request';

import type {FoodRequest} from './food-request';
import type { CapturedLocation } from '@/lib/location/capture';
import type { PostOptions, UploadSnapshot } from './create';
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
function database(): Promise<IDBDatabase> { return new Promise((resolve, reject) => { const request = indexedDB.open('mfa-uploads', 1); request.onupgradeneeded = () => request.result.createObjectStore('drafts', { keyPath: 'operationId' }); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); }); }
async function transaction<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    const db = await database();
    try {
        return await new Promise<T>((resolve, reject) => { const tx = db.transaction('drafts', mode); const request = action(tx.objectStore('drafts')); let result: T; request.onsuccess = () => { result = request.result; }; request.onerror = () => reject(request.error); tx.oncomplete = () => resolve(result); tx.onerror = tx.onabort = () => reject(tx.error); });
    }
    finally {
        db.close();
    }
}
export const uploadStore = { all: () => transaction('readonly', store => store.getAll()) as Promise<StoredUpload[]>, put: (draft: StoredUpload) => transaction('readwrite', store => store.put(draft)), remove: (id: string) => transaction('readwrite', store => store.delete(id)), clear: () => transaction('readwrite', store => store.clear()) };

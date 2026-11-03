'use client';
import { createClient } from '@/lib/supabase/client';
import { PostUploadDraft, type PostOptions } from './create';
import { uploadStore, type StoredUpload } from './upload-store';
import { UPLOAD_PARK_MS, UPLOAD_GRACE_MS } from '@/lib/media/upload-window';
import type { CapturedLocation } from '@/lib/location/capture';
import { PhotoUploadError, type UploadError } from '@/lib/media/put-with-progress';
export interface UploadState {
    operationId: string;
    uploadId?: string;
    sent: number;
    total: number;
    state: 'uploading' | 'uploaded' | 'failed';
    error?: UploadError;
    previewUrl: string;
    caption: string;
    eatenAt: string;
    posted: boolean;
    postId?: string;
}
export interface DraftFields {
    caption: string;
    eatenAt: string | null;
    location: CapturedLocation | null;
    options: PostOptions;
}
type Entry = {
    data: StoredUpload;
    draft: PostUploadDraft;
    previewUrl: string;
    active: Promise<void> | null;
    version: number;
    rerun: boolean;
    deleted: boolean;
    finished: boolean;
    writing: Promise<unknown>;
};
const pause = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
/** Each mutation is persisted before network work. Only post() permits publication. */
export class UploadManager {
    private entries = new Map<string, Entry>();
    private listeners = new Set<() => void>();
    private ownerId = '';
    private initializing: Promise<void> | null = null;
    constructor(private store = uploadStore, private makeDraft = () => new PostUploadDraft(), private delay = pause) { }
    subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
    private notify(entry?: Entry, event?: string) { for (const listener of this.listeners)
        listener(); if (entry && event && typeof window !== 'undefined')
        window.dispatchEvent(new CustomEvent(event, { detail: this.state(entry) })); }
    private state(entry: Entry): UploadState { const d = entry.data; return { operationId: d.operationId, uploadId:d.snapshot?.id, caption: d.caption, eatenAt: d.eatenAt ?? new Date(d.createdAt).toISOString(), previewUrl: entry.previewUrl, sent: d.sent, total: d.total, state: d.state, error: d.error, posted: d.posted, ...(entry.finished ? { postId: d.snapshot?.id } : {}) }; }
    list = () => [...this.entries.values()].filter(e => !e.deleted).sort((a, b) => b.data.createdAt - a.data.createdAt).map(e => this.state(e));
    fields(id:string):DraftFields|null { const data=this.entries.get(id)?.data; return data?{caption:data.caption,eatenAt:data.eatenAt,location:data.location,options:{...data.options}}:null; }
    newest() { return [...this.entries.values()].filter(e => !e.deleted && !e.data.posted).sort((a, b) => b.data.createdAt - a.data.createdAt)[0]?.data ?? null; }
    private attachSnapshot(entry: Entry) { const draft = entry.draft; draft.setProgress((sent, total) => { if (entry.deleted || entry.draft !== draft)
        return; entry.data.sent = sent; entry.data.total = total; this.notify(entry, 'upload-progress'); }); draft.setSnapshotListener?.(async (snapshot) => { if (entry.deleted || entry.finished || entry.draft !== draft)
        return; entry.data.snapshot = snapshot; await this.persist(entry); }); }
    private make(data: StoredUpload) { const entry: Entry = { data, draft: this.makeDraft(), previewUrl: data.files[0] ? URL.createObjectURL(data.files[0]) : '', active: null, version: 0, rerun: false, deleted: false, finished: false, writing: Promise.resolve() }; if (data.snapshot)
        entry.draft.restore(data.snapshot); entry.draft.setProgress((sent, total) => { if (entry.deleted)
        return; entry.data.sent = sent; entry.data.total = total; this.notify(entry, 'upload-progress'); }); this.attachSnapshot(entry); return entry; }
    async initialize(ownerId: string) {
        if (this.ownerId === ownerId && this.initializing)
            return this.initializing;
        if (this.ownerId && this.ownerId !== ownerId)
            this.resetMemory();
        this.ownerId = ownerId;
        return this.initializing = (async () => { for (const data of await this.store.all()) {
            if (this.ownerId !== ownerId)
                return;
            if (data.ownerId !== ownerId)
                continue;
            if (this.entries.has(data.operationId))
                continue;
            data.files = data.files.map((file, index) => new File([file], file.name ?? `meal-${index}.jpg`, { type: file.type }));
            const entry = this.make(data);
            this.entries.set(data.operationId, entry);
            this.notify(entry, 'upload-started');
            if (data.state !== 'failed')
                void this.run(entry);
        } this.notify(); })();
    }
    private resetMemory() { for (const entry of this.entries.values()) {
        entry.deleted = true;
        if (entry.previewUrl)
            URL.revokeObjectURL(entry.previewUrl);
    } this.entries.clear(); this.notify(); }
    async clear() { const writes = [...this.entries.values()].map(entry => entry.writing.catch(() => { })); this.resetMemory(); this.ownerId = ''; this.initializing = null; await Promise.all(writes); await this.store.clear(); }
    stage(files: File[], fields: DraftFields, operationId?: string) {
        let entry = operationId ? this.entries.get(operationId) : undefined;
        if (!entry) {
            const id = crypto.randomUUID();
            const now = Date.now();
            entry = this.make({ operationId: id, ownerId: this.ownerId, createdAt: now, reservedAt: now, ...fields, files: [...files], snapshot: null, posted: false, state: 'uploading', sent: 0, total: files.reduce((sum, file) => sum + file.size, 0) });
            this.entries.set(id, entry);
        }
        else if (files.length !== entry.data.files.length || files.some((file, i) => file !== entry!.data.files[i])) {
            entry.data.files = [...files];
            entry.data.snapshot = null;
            entry.data.reservedAt = Date.now();
            entry.draft = this.makeDraft();
            entry.draft.setProgress((sent, total) => { entry!.data.sent = sent; entry!.data.total = total; this.notify(entry, 'upload-progress'); });
            if (entry.previewUrl)
                URL.revokeObjectURL(entry.previewUrl);
            entry.previewUrl = files[0] ? URL.createObjectURL(files[0]) : '';
            entry.version++;
        }
        this.attachSnapshot(entry);
        Object.assign(entry.data, fields);
        entry.data.state = 'uploading';
        entry.data.error = undefined;
        this.notify(entry, 'upload-started');
        void this.run(entry);
        return entry.data.operationId;
    }
    update(id: string, fields: Partial<DraftFields>) { const entry = this.entries.get(id); if (!entry || entry.deleted || entry.finished)
        return; Object.assign(entry.data, fields); void this.persist(entry); this.notify(entry, 'upload-progress'); }
    private persist(entry: Entry) { const snapshot = { ...entry.data, files: [...entry.data.files] }; const writing = entry.writing.catch(() => { }).then(() => { if (!entry.deleted && !entry.finished)
        return this.store.put(snapshot); }); entry.writing = writing; return writing; }
    post(id: string) { const entry = this.entries.get(id); if (!entry || entry.deleted)
        return; entry.data.posted = true; this.notify(entry, 'upload-started'); void this.run(entry); }
    retry(id: string) { const entry = this.entries.get(id); if (!entry || entry.deleted || entry.finished)
        return; entry.data.state = 'uploading'; entry.data.error = undefined; this.notify(entry, 'upload-progress'); void this.run(entry); }
    online = () => { for (const entry of this.entries.values())
        if (entry.data.state === 'failed')
            this.retry(entry.data.operationId); };
    async remove(id: string) { const entry = this.entries.get(id); if (!entry)
        return; entry.deleted = true; this.entries.delete(id); if (entry.previewUrl)
        URL.revokeObjectURL(entry.previewUrl); await entry.writing.catch(() => { }); await this.store.remove(id); this.notify(); if (typeof window !== 'undefined')
        window.dispatchEvent(new CustomEvent('upload-deleted', { detail: { operationId: id } })); }
    private run(entry: Entry): Promise<void> {
        if (entry.active)
            return entry.active;
        const task = this.process(entry);
        entry.active = task;
        const settled = () => { entry.active = null; const rerun = entry.rerun; entry.rerun = false; if (!entry.deleted && !entry.finished && (rerun || (entry.data.posted && entry.data.state === 'uploaded')))
            void this.run(entry); };
        void task.then(settled, settled);
        return task;
    }
    private async process(entry: Entry) {
        try {
            if (!this.ownerId) {
                const { data: { user } } = await createClient().auth.getUser();
                if (!user)
                    throw new Error('Sign in required.');
                this.ownerId = user.id;
            }
            entry.data.ownerId = this.ownerId;
            await this.persist(entry);
            if (entry.deleted)
                return;
            for (let attempt = 0; attempt < 3; attempt++) {
                const version = entry.version;
                try {
                    if (Date.now() - entry.data.reservedAt > UPLOAD_PARK_MS + UPLOAD_GRACE_MS && !entry.data.publishStarted) {
                        entry.draft = this.makeDraft();
                        entry.draft.setProgress((sent, total) => { entry.data.sent = sent; entry.data.total = total; this.notify(entry, 'upload-progress'); });
                        entry.data.snapshot = null;
                        entry.data.reservedAt = Date.now();
                        this.attachSnapshot(entry);
                    }
                    const d = entry.data;
                    if (d.files.length)
                        await entry.draft.stage(d.caption, d.files, d.location, d.eatenAt, d.options);
                    if (entry.deleted)
                        return;
                    d.snapshot = await entry.draft.snapshot();
                    await this.persist(entry);
                    if (entry.deleted)
                        return;
                    if (version !== entry.version) {
                        entry.rerun = true;
                        return;
                    }
                    if (!d.posted) {
                        d.state = 'uploaded';
                        d.sent = d.total;
                        await this.persist(entry);
                        this.notify(entry, 'upload-progress');
                        return;
                    }
                    // Re-reserve in submit to commit the latest caption/time/options, but each acknowledged PUT is skipped.
                    d.publishStarted = true;
                    await this.persist(entry);
                    if (entry.deleted)
                        return;
                    const result = await entry.draft.submit(d.caption, d.files, d.location, d.eatenAt, d.files.length ? 'photo' : 'text', d.options);
                    if (entry.deleted)
                        return;
                    d.snapshot = await entry.draft.snapshot();
                    entry.finished = true;
                    d.state = 'uploaded';
                    d.sent = d.total;
                    await entry.writing.catch(() => { });
                    await this.store.remove(d.operationId);
                    this.notify(entry, 'upload-finished');
                    if (typeof window !== 'undefined')
                        window.dispatchEvent(new CustomEvent('post-created', { detail: { id: result.postId } }));
                    return;
                }
                catch (error) {
                    if (entry.deleted)
                        return;
                    if (version !== entry.version) {
                        entry.rerun = true;
                        return;
                    }
                    if (attempt < 2) {
                        await this.delay(attempt === 0 ? 2000 : 6000);
                        continue;
                    }
                    entry.data.error = error instanceof PhotoUploadError ? error.code : (typeof navigator !== 'undefined' && !navigator.onLine ? 'dropped' : 'no_response');
                    throw error;
                }
            }
        }
        catch {
            if (entry.deleted)
                return;
            entry.data.state = 'failed';
            try {
                entry.data.snapshot = await entry.draft.snapshot();
                await this.persist(entry);
            }
            catch { /* Keep the original durable files even if a snapshot cannot be read. */ }
            this.notify(entry, 'upload-failed');
        }
    }
}
export const uploadManager = new UploadManager();

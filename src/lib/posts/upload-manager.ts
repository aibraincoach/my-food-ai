'use client';
import type {TileDrinkRequest,PhotoDrinksRequest} from './drink-request';
import {copyEndpoint,type CopyRequest} from './copy-request';

import type {FoodRequest} from './food-request';
import { createClient } from '@/lib/supabase/client';
import { PostUploadDraft, type PostOptions } from './create';
import { uploadStore, type PublishIntent, type StoredUpload } from './upload-store';
import { UPLOAD_PARK_MS, UPLOAD_GRACE_MS } from '@/lib/media/upload-window';
import type { CapturedLocation } from '@/lib/location/capture';
import { PhotoUploadError, type UploadError } from '@/lib/media/put-with-progress';
import { PackPhotoUpload } from '@/lib/media/pack-photo-upload';
import { reencodeShot } from '@/lib/media/reencode';

const RETAKE_ATTACHMENT_MESSAGE = 'This photo was not kept. Take it again.';
export interface UploadState {
    operationId: string;
    kind?: "food"|"copy"|"drink";

    removing?: boolean;
    drinkTile?: boolean;
    text?: boolean;
    attachment?: {postId: string; notEaten: boolean};
    photoLost?: boolean;
    message?: string;
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
    attachmentUpload?: PackPhotoUpload;
};
const pause = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
/** Each mutation is persisted before network work. Only post() permits publication. */
export class UploadManager {
    private entries = new Map<string, Entry>();
    private listeners = new Set<() => void>();
    private ownerId = '';
    private initializing: Promise<void> | null = null;
    private ownerEpoch = 0;
    private ownerPending: Promise<string> | null = null;
    constructor(private store = uploadStore, private makeDraft = () => new PostUploadDraft(), private delay = pause, private foodRequest: typeof fetch = (...args) => fetch(...args), private readOwner: () => Promise<string | null> = async () => (await createClient().auth.getSession()).data.session?.user.id ?? null, private encodeShot = reencodeShot) { }
    private resolveOwner(): Promise<string> {
        if (this.ownerId) return Promise.resolve(this.ownerId);
        if (this.ownerPending) return this.ownerPending;
        const epoch = this.ownerEpoch;
        const pending = this.readOwner().then(owner => {
            if (!owner || epoch !== this.ownerEpoch || (this.ownerId && this.ownerId !== owner)) throw new Error('Sign-in changed. Keep this screen open and try again.');
            this.ownerId = owner;
            return owner;
        });
        this.ownerPending = pending;
        const settled = () => { if (this.ownerPending === pending) this.ownerPending = null; };
        void pending.then(settled, settled);
        return pending;
    }
    subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
    private notify(entry?: Entry, event?: string) { for (const listener of this.listeners)
        listener(); if (entry && event && typeof window !== 'undefined')
        window.dispatchEvent(new CustomEvent(event, { detail: this.state(entry) })); }
    private state(entry: Entry): UploadState { const d = entry.data; const photoLost=Boolean(d.attachment&&!d.files.length&&d.message===RETAKE_ATTACHMENT_MESSAGE); return { operationId: d.operationId, uploadId:d.snapshot?.id, caption: d.caption, eatenAt: d.eatenAt ?? new Date(d.createdAt).toISOString(), previewUrl: entry.previewUrl, sent: d.sent, total: d.total, state: d.state, error: d.error, posted: d.posted, ...(d.attachment?{attachment:d.attachment,message:d.message,...(photoLost?{photoLost:true}:{})}:{}), ...((d.food||d.copy||d.drink||d.photoDrinks)?{kind:d.copy?"copy" as const:d.food?"food" as const:"drink" as const,removing:d.cancelRequested,message:d.message}:{}), ...(d.drink?{drinkTile:true}:{}), ...(!d.files.length&&!d.food&&!d.copy&&!d.drink&&!d.photoDrinks&&!d.attachment?{text:true}:{}), ...(entry.finished ? { postId: d.resultPostId??d.snapshot?.id } : {}) }; }
    private intentFor(entry: Entry, ownerId: string): PublishIntent { const d=entry.data,attachment=d.attachment; return {operationId:d.operationId,ownerId,createdAt:d.createdAt,postId:attachment?.postId??null,notEaten:attachment?.notEaten??false}; }
    private applyIntent(data: StoredUpload, intent: PublishIntent) { data.posted=true; data.ownerId=intent.ownerId; if(intent.postId&&!data.attachment)data.attachment={postId:intent.postId,notEaten:intent.notEaten}; if(data.attachment&&!data.files.length){data.state='failed';data.message=RETAKE_ATTACHMENT_MESSAGE;} }
    private attachmentFromIntent(intent: PublishIntent): StoredUpload { return {operationId:intent.operationId,ownerId:intent.ownerId,createdAt:intent.createdAt,reservedAt:intent.createdAt,caption:intent.notEaten?'Leftovers':'Added photo',eatenAt:null,location:null,options:{},files:[],snapshot:null,posted:true,attachment:{postId:intent.postId!,notEaten:intent.notEaten},state:'failed',message:RETAKE_ATTACHMENT_MESSAGE,sent:0,total:0}; }

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
        if(this.ownerId !== ownerId){this.ownerEpoch++;this.ownerPending=null;}
        this.ownerId = ownerId;
        return this.initializing = (async () => {
            const intents = await this.store.allIntents();
            const intentById = new Map(intents.filter(intent => intent.ownerId === ownerId).map(intent => [intent.operationId, intent]));
            for (const data of await this.store.all()) {
                if (this.ownerId !== ownerId)
                    return;
                if (data.ownerId !== ownerId)
                    continue;
                if (this.entries.has(data.operationId))
                    continue;
                const intent = intentById.get(data.operationId);
                if (intent)
                    this.applyIntent(data, intent);
                data.files = data.files.map((file, index) => new File([file], file.name ?? `meal-${index}.jpg`, { type: file.type }));
                const entry = this.make(data);
                this.entries.set(data.operationId, entry);
                intentById.delete(data.operationId);
                this.notify(entry, 'upload-started');
                if (data.state !== 'failed' && !(data.attachment && !data.files.length))
                    void this.run(entry);
            }
            for (const intent of intentById.values()) {
                if (this.ownerId !== ownerId || !intent.postId || this.entries.has(intent.operationId))
                    continue;
                const entry = this.make(this.attachmentFromIntent(intent));
                this.entries.set(intent.operationId, entry);
                this.notify(entry, 'upload-started');
            }
            this.notify();
        })();
    }
    private resetMemory() { for (const entry of this.entries.values()) {
        entry.deleted = true;
        if (entry.previewUrl)
            URL.revokeObjectURL(entry.previewUrl);
    } this.entries.clear(); this.notify(); }
    async clear() { const writes = [...this.entries.values()].map(entry => entry.writing.catch(() => { })); this.resetMemory(); this.ownerId = ''; this.ownerEpoch++; this.ownerPending=null; this.initializing = null; await Promise.all(writes); await this.store.clear(); }
    stage(files: File[], fields: DraftFields, operationId?: string) {
        let entry = operationId ? this.entries.get(operationId) : undefined;
        if(entry?.finished)return entry.data.operationId;
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
    /** Close only after the owner selection/files are durable, then publish in
     * the background. The same operation survives reload and a lost response. */
    async postFood(food: FoodRequest, label: string, files: File[] = [], stagedId?: string) {
        food={...food};
        if (!this.ownerId) {
            const {data:{user}}=await createClient().auth.getUser();
            if(!user)throw new Error('Sign in to keep this food selection.');
            this.ownerId=user.id;
        }
        let entry=stagedId?this.entries.get(stagedId):undefined;
        if(entry&&(entry.finished||entry.data.posted||entry.data.ownerId!==this.ownerId||entry.data.files.length!==files.length||files.some((file,index)=>entry!.data.files[index]!==file)))entry=undefined;
        if(!entry){
            const now=Date.now(),id=crypto.randomUUID();
            entry=this.make({operationId:id,ownerId:this.ownerId,createdAt:now,reservedAt:now,caption:label,eatenAt:food.eaten_at,location:null,options:{},files:[...files],snapshot:null,posted:true,food,state:'uploading',sent:0,total:'photo' in food?0:files.reduce((sum,file)=>sum+file.size,0)});
            this.entries.set(id,entry);
        }else{
            Object.assign(entry.data,{food,caption:label,eatenAt:food.eaten_at,posted:true,state:'uploading',message:undefined});
        }
        await this.persist(entry);
        if(entry.deleted||entry.data.ownerId!==this.ownerId)throw new Error('Sign-in changed. Your selection is kept for its original account.');
        this.notify(entry,'upload-started');
        if(entry.active)entry.rerun=true;
        void this.run(entry);
        return entry.data.operationId;
    }
    async postCaption(caption:string,eatenAt:string){
        if(!this.ownerId){const {data:{user}}=await createClient().auth.getUser();if(!user)throw new Error('Sign in to keep this caption.');this.ownerId=user.id;}
        const now=Date.now(),id=crypto.randomUUID();
        const entry=this.make({operationId:id,ownerId:this.ownerId,createdAt:now,reservedAt:now,caption,eatenAt,location:null,options:{},files:[],snapshot:null,posted:true,state:'uploading',sent:0,total:0});
        this.entries.set(id,entry);try{await this.persist(entry);}catch(error){entry.deleted=true;this.entries.delete(id);throw error;}
        if(entry.deleted||entry.data.ownerId!==this.ownerId)throw new Error('Sign-in changed. Your caption is kept for its original account.');
        this.notify(entry,'upload-started');void this.run(entry);return id;
    }
    async postDrink(drink:TileDrinkRequest,label:string){
        drink={...drink};
        if(!this.ownerId){const {data:{user}}=await createClient().auth.getUser();if(!user)throw new Error('Sign in to keep this drink.');this.ownerId=user.id;}
        const now=Date.now(),id=crypto.randomUUID();
        const entry=this.make({operationId:id,ownerId:this.ownerId,createdAt:now,reservedAt:now,caption:label,eatenAt:drink.eaten_at,location:null,options:{},files:[],snapshot:null,posted:true,drink,state:'uploading',sent:0,total:0});
        this.entries.set(id,entry);await this.persist(entry);
        if(entry.deleted||entry.data.ownerId!==this.ownerId)throw new Error('Sign-in changed. Your drink is kept for its original account.');
        this.notify(entry,'upload-started');void this.run(entry);return id;
    }
    async postPhotoDrinks(photoDrinks:PhotoDrinksRequest,label:string,id:string){
        const entry=this.entries.get(id);
        if(!entry||entry.deleted||entry.finished||entry.data.posted||entry.data.ownerId!==this.ownerId||entry.data.snapshot?.id!==photoDrinks.upload_id||!entry.data.files.length)throw new Error('Keep the uploaded drink photo and try again.');
        entry.data.photoDrinks=structuredClone(photoDrinks);entry.data.posted=true;entry.data.caption=label;entry.data.eatenAt=photoDrinks.eaten_at;entry.data.state='uploading';entry.data.message=undefined;
        await this.persist(entry);
        if(entry.deleted||entry.data.ownerId!==this.ownerId)throw new Error('Sign-in changed. Your photo is kept for its original account.');
        this.notify(entry,'upload-started');if(entry.active)entry.rerun=true;void this.run(entry);return id;
    }
    async discardDrink(id:string){
        const entry=this.entries.get(id);if(!entry||( !entry.data.drink&&!entry.data.photoDrinks)||entry.deleted||entry.finished)return;
        entry.data.cancelRequested=true;entry.data.state='uploading';entry.data.message=undefined;
        try{await this.persist(entry);}catch{entry.data.state='failed';entry.data.message='The removal could not be kept on this phone. Try again.';this.notify(entry,'upload-failed');return;}
        if(entry.deleted||entry.data.ownerId!==this.ownerId)return;
        this.notify(entry,'upload-progress');if(entry.active)entry.rerun=true;void this.run(entry);
    }
    async postCopy(copy:CopyRequest,label:string) {
        copy={...copy};
        if(!this.ownerId){const {data:{user}}=await createClient().auth.getUser();if(!user)throw new Error('Sign in to keep this copy.');this.ownerId=user.id;}
        const now=Date.now(),id=crypto.randomUUID();
        const entry=this.make({operationId:id,ownerId:this.ownerId,createdAt:now,reservedAt:now,caption:label,eatenAt:copy.eatenAt,location:null,options:{},files:[],snapshot:null,posted:true,copy,state:'uploading',sent:0,total:0});
        this.entries.set(id,entry);
        this.notify(entry,'upload-started');
        try{await this.persist(entry);}catch{entry.data.state='failed';entry.data.message='The copy could not be kept on this phone. Try again.';this.notify(entry,'upload-failed');return id;}
        if(entry.deleted||entry.data.ownerId!==this.ownerId)throw new Error('Sign-in changed. Your copy is kept for its original account.');
        void this.run(entry);return id;
    }

    /** The sheet closes once publish intent is durable; photo bytes and upload follow. */
    async postAttachment(file: File, attachment: {postId: string; notEaten: boolean}): Promise<string> {
        const owner = await this.resolveOwner();
        const now=Date.now(),id=crypto.randomUUID();
        const entry=this.make({operationId:id,ownerId:owner,createdAt:now,reservedAt:now,caption:attachment.notEaten?'Leftovers':'Added photo',eatenAt:null,location:null,options:{},files:[file],snapshot:null,posted:true,attachment:{...attachment},state:'uploading',sent:0,total:file.size});
        this.entries.set(id,entry);
        this.notify(entry,'upload-started');
        try{await this.store.putIntent(this.intentFor(entry,owner));}catch{
            await this.remove(id);
            throw new Error('The photo could not be kept on this phone. Try again.');
        }
        if(entry.deleted||this.ownerId!==owner)throw new Error('Sign-in changed. Your photo is kept for its original account.');
        void this.persist(entry);
        void this.run(entry);
        return id;
    }
    private async submitAttachment(entry:Entry):Promise<{postId:string}> {
        const d=entry.data,attachment=d.attachment!;
        if(!d.attachmentPhoto){
            entry.attachmentUpload??=new PackPhotoUpload(this.encodeShot,this.foodRequest);
            d.attachmentPhoto=await entry.attachmentUpload.prepare(d.files[0]);
        }
        // Persist before attach: the server deduplicates by this stage path, even after a lost response/reload.
        await this.persist(entry);
        if(entry.deleted||d.ownerId!==this.ownerId)throw new Error('Sign-in changed. Your photo is kept for its original account.');
        const response=await this.foodRequest(`/api/posts/${attachment.postId}/media`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({photo:d.attachmentPhoto,not_eaten:attachment.notEaten})});
        const result=await response.json().catch(()=>null) as {post_id?:string;error?:string;code?:string}|null;
        if(!response.ok&&result?.code==='attachment_stage_expired'){
            // Only the server can prove the old reservation cannot complete.
            // A lost response or a transient failure must keep its original path.
            d.attachmentPhoto=undefined;entry.attachmentUpload=undefined;
            await this.persist(entry);
        }
        if(!response.ok||!result?.post_id){d.message=typeof result?.error==='string'?result.error.slice(0,200):'The photo could not be attached. Your photo is kept.';throw new Error(d.message);}
        return {postId:result.post_id};
    }

    /** Acknowledge only an owner-bound recoverable draft, or confirmed publication.
     * Upload work keeps running when the durable acknowledgement fails. */
    async post(id: string): Promise<boolean> {
        const entry = this.entries.get(id);
        if (!entry || entry.deleted) return false;
        if (entry.finished) return Boolean(entry.data.resultPostId);
        entry.data.posted = true;
        this.notify(entry, 'upload-started');
        if (entry.active)
            entry.rerun = true;
        void this.run(entry);
        try {
            const owner = await this.resolveOwner();
            const current = () => !entry.deleted && this.entries.get(id) === entry && this.ownerId === owner && entry.data.ownerId === owner;
            if (entry.deleted || this.entries.get(id) !== entry || this.ownerId !== owner || (entry.data.ownerId && entry.data.ownerId !== owner)) return false;
            entry.data.ownerId = owner;
            await this.store.putIntent(this.intentFor(entry, owner));
            void this.persist(entry);
            return current();
        } catch {
            return !entry.deleted && this.entries.get(id) === entry && Boolean(this.ownerId) && entry.data.ownerId === this.ownerId && entry.finished && Boolean(entry.data.resultPostId);
        }
    }
    async discardFood(id:string){
        const entry=this.entries.get(id);
        if((!entry?.data.food&&!entry?.data.copy)||entry.deleted||entry.finished)return;
        entry.data.cancelRequested=true;entry.data.state='uploading';entry.data.message=undefined;
        try{await this.persist(entry);}catch{entry.data.state='failed';entry.data.message='The removal could not be kept on this phone. Try again.';this.notify(entry,'upload-failed');return;}
        if(entry.deleted||entry.data.ownerId!==this.ownerId)return;
        this.notify(entry,'upload-progress');if(entry.active)entry.rerun=true;void this.run(entry);
    }
    discardCopy(id:string){return this.discardFood(id);}
    retry(id: string) { const entry = this.entries.get(id); if (!entry || entry.deleted || entry.finished)
        return; entry.data.state = 'uploading'; entry.data.error = undefined; entry.data.message=undefined; this.notify(entry, 'upload-progress'); if(entry.active)entry.rerun=true; void this.run(entry); }
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
    private async submitFood(entry: Entry): Promise<{postId:string}> {
        const d=entry.data;
        const prepared=Boolean(d.food&&'photo' in d.food);
        const photo=prepared?null:d.files.length?d.snapshot?.images[0]:null;
        if(d.files.length&&!prepared&&(!photo||!d.snapshot))throw new Error('The pack photo is not ready. Your selection is kept.');
        const response=await this.foodRequest('/api/posts/food',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...d.food,operation_id:d.operationId,owner_id:d.ownerId,...(photo&&d.snapshot?{photo:{path:this.ownerId+'/'+d.snapshot.id+'/0.jpg',width:photo.width,height:photo.height}}:{})})});
        const result=await response.json().catch(()=>null) as {post_id?:string;error?:string}|null;
        if(!response.ok||!result?.post_id){
            d.message=typeof result?.error==='string'?result.error.slice(0,200):'The server did not respond. Your selection is kept.';
            throw new Error(d.message);
        }
        return {postId:result.post_id};
    }
    private async submitDrink(entry:Entry):Promise<{postId:string}>{
        const d=entry.data,photo=d.photoDrinks,tile=d.drink;
        const endpoint=photo?'/api/drinks/post':'/api/intake/post?tz='+encodeURIComponent(tile!.time_zone);
        const response=await this.foodRequest(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...photo??tile,operation_id:d.operationId,owner_id:d.ownerId})});
        const result=await response.json().catch(()=>null) as {post_id?:string;error?:string}|null;
        if(!response.ok||!result?.post_id){d.message=result?.error??'The drink save could not be confirmed. Your selection is kept.';throw new Error(d.message);}
        return{postId:result.post_id};
    }
    private async submitCopy(entry:Entry):Promise<{postId:string}> {
        const d=entry.data,copy=d.copy!;
        const response=await this.foodRequest(copyEndpoint(copy),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({operation_id:d.operationId,owner_id:d.ownerId,eaten_at:copy.eatenAt})});
        const result=await response.json().catch(()=>null) as {postId?:string;post_id?:string;error?:string}|null;
        const postId=result?.postId??result?.post_id;
        if(!response.ok||!postId){d.message=typeof result?.error==='string'?result.error.slice(0,200):'The copy could not be confirmed. Your selection is kept.';throw new Error(d.message);}
        return {postId};

    }
    private async process(entry: Entry) {
        try {
            if(entry.deleted||(entry.data.ownerId&&this.ownerId&&entry.data.ownerId!==this.ownerId))return;
            const owner = await this.resolveOwner();
            if (entry.deleted || this.entries.get(entry.data.operationId) !== entry || this.ownerId !== owner || (entry.data.ownerId && entry.data.ownerId !== owner)) return;
            entry.data.ownerId = owner;
            if (entry.data.attachment && !entry.data.files.length)
                return;
            await this.persist(entry);
            if (entry.deleted || this.ownerId !== owner || entry.data.ownerId !== owner)
                return;
            if((entry.data.food||entry.data.copy||entry.data.drink||entry.data.photoDrinks)&&entry.data.cancelRequested){
                const response=await this.foodRequest(entry.data.copy?copyEndpoint(entry.data.copy):entry.data.photoDrinks?'/api/drinks/post':entry.data.drink?'/api/intake/post':'/api/posts/food',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({operation_id:entry.data.operationId,owner_id:entry.data.ownerId,...(entry.data.copy?{eaten_at:entry.data.copy.eatenAt}:{}),...(entry.data.photoDrinks?{upload_id:entry.data.photoDrinks.upload_id}:{})})});

                const body=await response.json().catch(()=>null) as {post_id?:string;error?:string}|null;
                if(!response.ok){entry.data.message=body?.error??(entry.data.copy?'The pending copy could not be removed. Your selection is kept.':'The pending food could not be removed. Your selection is kept.');throw new Error(entry.data.message);}
                if(entry.deleted)return;
                await this.remove(entry.data.operationId);
                if(body?.post_id&&typeof window!=='undefined')window.dispatchEvent(new CustomEvent('post-deleted',{detail:{id:body.post_id}}));
                return;
            }
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
                    if (d.files.length&&!d.attachment&&!d.photoDrinks&&!(d.food&&'photo' in d.food))
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
                    const result = d.attachment?await this.submitAttachment(entry):d.copy?await this.submitCopy(entry):d.food ? await this.submitFood(entry) : (d.drink||d.photoDrinks)?await this.submitDrink(entry):await entry.draft.submit(d.caption, d.files, d.location, d.eatenAt, d.files.length ? 'photo' : 'text', d.options);

                    if (entry.deleted)
                        return;
                    if((d.copy||d.drink||d.photoDrinks)&&d.cancelRequested){d.resultPostId=result.postId;await this.persist(entry);entry.rerun=true;return;}
                    d.snapshot = await entry.draft.snapshot();
                    entry.finished = true;
                    d.resultPostId=result.postId;
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

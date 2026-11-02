import type { CapturedLocation } from "@/lib/location/capture";
import { reencodeShot } from "@/lib/media/reencode";
import { uploadedMatches } from "@/lib/media/pack-photo-upload";
import {putWithProgress} from "@/lib/media/put-with-progress";
import type {ReencodedShot} from "@/lib/media/reencode";
import type { SignedUpload } from "@/lib/media/storage";

export interface NewShot { file: File; previewUrl: string }
export interface CreatedPost { postId: string }
export interface PostOptions {not_eaten_position?:number|null;not_eaten_positions?:number[];save_as_meal?:boolean}

// The upload manager can stage this operation before Post. Repeated attempts
// keep its identifier, encoded bytes and acknowledged uploads, including lost responses.
export interface UploadSnapshot { id:string; images:ReencodedShot[]; completed:string[] }
export class PostUploadDraft {
  private prepareActive: Promise<CreatedPost> | null = null;
  private progress: (sent:number,total:number)=>void = ()=>{};
  private restored:UploadSnapshot|null=null;
  private snapshotChanged:(snapshot:UploadSnapshot)=>Promise<void>=async()=>{};
  setSnapshotListener(callback:(snapshot:UploadSnapshot)=>Promise<void>){this.snapshotChanged=callback;}
  private async persistSnapshot(){const snapshot=await this.snapshot();if(snapshot)await this.snapshotChanged(snapshot);}
  setProgress(callback:(sent:number,total:number)=>void){this.progress=callback;}
  restore(snapshot:UploadSnapshot){this.restored=snapshot;}
  async snapshot():Promise<UploadSnapshot|null>{const p=this.pending;return p?{id:p.id,images:await p.images,completed:[...p.completed]}:null;}
  async stage(caption:string,files:File[],location:CapturedLocation|null,eatenAt:string|null,options:PostOptions={}):Promise<CreatedPost>{
    if(this.prepareActive)await this.prepareActive.catch(()=>{});
    const operation=this.runSubmit(caption,files,location,eatenAt,"photo",options,false);this.prepareActive=operation;
    try{return await operation;}finally{if(this.prepareActive===operation)this.prepareActive=null;}
  }
  private pending: { id: string; files: File[]; images: Promise<Awaited<ReturnType<typeof reencodeShot>>[]>; completed: Set<string> } | null = null;
  private active: Promise<CreatedPost> | null = null;
  constructor(private encode = reencodeShot, private request: typeof fetch = (...args) => fetch(...args), private verify = uploadedMatches, private uuid = () => crypto.randomUUID()) {}

  submit(caption: string, files: File[], location: CapturedLocation | null, eatenAt: string | null, intent: "photo" | "text", options:PostOptions={}): Promise<CreatedPost> {
    if (this.active) return this.active;
    const operation = this.runSubmit(caption, files, location, eatenAt, intent, options);
    this.active = operation;
    const settled = () => { if (this.active === operation) this.active = null; };
    void operation.then(settled, settled);
    return operation;
  }

  private async runSubmit(caption: string, files: File[], location: CapturedLocation | null, eatenAt: string | null, intent: "photo" | "text", options:PostOptions={}, publish=true): Promise<CreatedPost> {
    if(this.prepareActive)await this.prepareActive.catch(()=>{});
    if (intent === "photo" && files.length === 0) throw new Error("The selected photo is not ready. Your draft was kept.");
    if (!this.pending || files.length !== this.pending.files.length || files.some((file, i) => file !== this.pending!.files[i])) {
      const restored=this.restored;this.restored=null;
      this.pending = { id: restored?.id??this.uuid(), files: [...files], images: restored?Promise.resolve(restored.images):Promise.all(files.map(file => this.encode(file))), completed: new Set(restored?.completed??[]) };
    }
    const pending = this.pending;
    let images: Awaited<ReturnType<typeof reencodeShot>>[];
    try { images = await pending.images; }
    catch { this.pending = null; throw new Error("The photo could not be prepared. Your selected files were kept."); }
    await this.persistSnapshot();
    const create = await this.request("/api/posts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ operation_id: pending.id, capture_intent: intent, ...options, caption, location, eaten_at: eatenAt ?? new Date().toISOString(), shots: images.map((image, position) => ({ position, width: image.width, height: image.height, phash: image.phash })) }) });
    if (!create.ok) {
      const detail = await create.json().catch(() => null);
      if (create.status === 410) this.pending = null;
      throw new Error(typeof detail?.error === "string" ? detail.error : "The post could not be prepared. Your draft was kept; try again.");
    }
    const result = await create.json() as { postId: string; uploads: SignedUpload[]; completed?: boolean };
    if (result.postId !== pending.id || !Array.isArray(result.uploads)) throw new Error("The post draft could not be confirmed. Try again.");
    if (result.completed) return { postId: result.postId };
    if (result.uploads.length !== images.length) throw new Error("The selected photos could not be confirmed. Your draft was kept.");
    const tasks: { url: string; path: string; blob: Blob }[] = [];
    for (const upload of result.uploads) {
      const image = images[upload.position];
      if (!image) throw new Error("The selected photos could not be confirmed.");
      for (const [url, path, blob] of [[upload.originalSignedUrl, upload.originalPath, image.original], [upload.feedSignedUrl, upload.feedPath, image.feed]] as const) {
        if (!pending.completed.has(path)) tasks.push({ url, path, blob });
      }
    }
    const total=images.reduce((sum,image)=>sum+image.original.size+image.feed.size,0);
    const sent=new Map(tasks.map(task=>[task.path,0]));
    const acknowledged=total-tasks.reduce((sum,task)=>sum+task.blob.size,0);
    const report=()=>this.progress(acknowledged+[...sent.values()].reduce((a,b)=>a+b,0),total);report();
    let cursor = 0;
    let failure: Error | null = null;
    const lane = async () => {
      while (!failure && cursor < tasks.length) {
        const { url, path, blob } = tasks[cursor++];
        try {
          let confirmed = false;let uploadError:unknown;
          try {
            if(typeof XMLHttpRequest!=="undefined"){await putWithProgress(url,blob,(loaded)=>{sent.set(path,loaded);report();});confirmed=true;}
            else confirmed = (await this.request(url, { method: "PUT", headers: { "Content-Type": "image/jpeg" }, body: blob })).ok;
          }
          catch(error) { uploadError=error; /* Reconcile an ambiguous upload through the owner's read policy. */ }
          if (!confirmed) confirmed = await this.verify(path, blob);
          if (!confirmed) throw uploadError??new Error("The photo upload failed. Your draft was kept; try again.");
          pending.completed.add(path);sent.set(path,blob.size);report();await this.persistSnapshot();
        } catch (error) { failure = error instanceof Error ? error : new Error("The photo upload failed. Your draft was kept; try again."); }
      }
    };
    // Drain both in-flight requests before rejecting. A retry can never race an
    // earlier lane, and successful copies remain acknowledged for that retry.
    await Promise.all(Array.from({ length: Math.min(2, tasks.length) }, lane));
    if (failure) throw failure;
    if(!publish)return {postId:pending.id};
    const complete = await this.request("/api/posts", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ postId: pending.id }) });
    if (!complete.ok) {
      if (complete.status === 410) this.pending = null;
      throw new Error(complete.status === 410 ? "The upload draft expired. Your photos were kept; try again." : "The post could not be completed. Your uploaded photos were kept; try again.");
    }
    return { postId: pending.id };
  }
}

export async function createPost(caption: string, shots: File[], location: CapturedLocation | null = null, eatenAt: string | null = null, draft = new PostUploadDraft(), intent: "photo" | "text" = shots.length ? "photo" : "text", options:PostOptions={}): Promise<CreatedPost> {
  return draft.submit(caption, shots, location, eatenAt, intent, options);
}

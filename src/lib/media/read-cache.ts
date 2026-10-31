// URLs remain bearer capabilities in memory only. Callers must first read the
// owned media row through RLS; the explicit owner keeps cache keys isolated.
export class PrivateMediaUrlCache {
  private entries = new Map<string,{expires:number;value:Promise<string>}>();
  constructor(private readonly lifetimeMs=300_000,private readonly maximum=512){}
  get(owner:string,path:string,load:()=>Promise<string>,now=Date.now()):Promise<string>{
    if(!owner||owner.includes('/')||!path.startsWith(owner+'/')||path.split('/').some(part=>part==='..'||part==='.'))
      return Promise.reject(new Error('Media path does not belong to the requested owner.'));
    const key=owner+'|'+path;const found=this.entries.get(key);
    if(found&&found.expires>now){this.entries.delete(key);this.entries.set(key,found);return found.value;}
    if(found)this.entries.delete(key);
    const entry={expires:now+this.lifetimeMs,value:Promise.resolve('').then(load)};
    this.entries.set(key,entry);
    // Failed signing is retryable and must not poison the cache.
    entry.value=entry.value.catch(error=>{if(this.entries.get(key)===entry)this.entries.delete(key);throw error;});
    while(this.entries.size>this.maximum)this.entries.delete(this.entries.keys().next().value!);
    return entry.value;
  }
}

import {validEvent,type DiagnosticEvent,type FreezeReport} from './schema';
let failed=false;
function open():Promise<IDBDatabase> {
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open('mfa-diagnostics',1);
    request.onupgradeneeded=()=>request.result.createObjectStore('events',{autoIncrement:true});
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error);
    request.onblocked=()=>reject(new Error('Diagnostics storage blocked'));
  });
}
async function write(event:DiagnosticEvent) {
  const db=await open();
  try {await new Promise<void>((resolve,reject)=>{
    const tx=db.transaction('events','readwrite');const store=tx.objectStore('events');store.add(event);
    const keys=store.getAllKeys();keys.onsuccess=()=>{for(const key of keys.result.slice(0,-20))store.delete(key);};
    tx.oncomplete=()=>resolve();tx.onerror=tx.onabort=()=>reject(tx.error);
  });}finally{db.close();}
}
let writes=Promise.resolve();
/** Validation is synchronous. No URL, exception message or arbitrary text enters storage. */
export function record(name:string,value?:string):Promise<void> {
  const event:DiagnosticEvent=value===undefined?{t:Date.now(),name}:{t:Date.now(),name,value};
  if(!validEvent(event)){
    if(process.env.NODE_ENV!=='production')throw new Error('Invalid diagnostic event');
    return Promise.resolve();
  }
  writes=writes.then(()=>write(event)).catch(()=>{failed=true;});
  return writes;
}
export async function readEvents():Promise<DiagnosticEvent[]> {
  await writes;
  if(failed)throw new Error('Diagnostics history unavailable');
  const db=await open();
  try{return await new Promise<DiagnosticEvent[]>((resolve,reject)=>{
    const tx=db.transaction('events','readonly');const request=tx.objectStore('events').getAll();
    tx.oncomplete=()=>{if(!request.result.every(validEvent)){reject(new Error('Invalid diagnostic history'));return;}resolve(request.result);};
    tx.onerror=tx.onabort=()=>reject(tx.error);
  });}finally{db.close();}
}
/** Called only by the report row. Freeze this snapshot while the sheet is open. */
export async function previewReport():Promise<FreezeReport> {
  const events=await readEvents();let permission:FreezeReport['camera_permission']='unknown';
  try {const result=await navigator.permissions.query({name:'camera' as PermissionName});if(['granted','denied','prompt'].includes(result.state))permission=result.state;}catch{}
  return {events,user_agent:navigator.userAgent.slice(0,300),build:(process.env.NEXT_PUBLIC_BUILD??'').slice(0,80),camera_permission:permission};
}

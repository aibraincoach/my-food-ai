// Invoked by load-test.mjs --recording-session. Twelve sequential real photo posts as test account 2 only.
// Private ledger survives interruptions; all run-created rows and Storage objects are removed in finally.
import {createClient} from '@supabase/supabase-js';
import {signInAsTestUser,signInTestClient} from './lib/session.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {setTimeout as sleep} from 'node:timers/promises';
import sharp from 'sharp';
const output='uploads/run14/recording-cap-private.json';await mkdir('uploads/run14',{recursive:true});
const {user}=await signInTestClient(2),cookie=await signInAsTestUser(2);
if(user.email!==process.env.TEST_USER2_EMAIL||user.email===process.env.TEST_USER_EMAIL)throw Error('Designated test account 2 required');
const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const base=process.env.APP_URL,run={startedAt:new Date().toISOString(),posts:[],cleanup:[]};
const save=()=>writeFile(output,JSON.stringify(run,null,2)+'\n',{mode:0o600});
const check=x=>{if(x.error)throw Error('Database operation failed');return x.data;};
const request=async(method,body)=>{const r=await fetch(new URL('/api/posts',base),{method,headers:{Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(60000)});if(!r.ok)throw Error(`Post request HTTP ${r.status}`);return r.json();};
async function paths(prefix){let out=[];for(let offset=0;;offset+=1000){const list=check(await admin.storage.from('media').list(prefix,{limit:1000,offset}));for(const o of list){const path=`${prefix}/${o.name}`;if(o.id)out.push(path);else out.push(...await paths(path));}if(list.length<1000)return out;}}
try{for(let number=1;number<=12;number++){
 const source=await readFile(new URL(`./fixtures/plate${(number-1)%3+1}.jpg`,import.meta.url));
 const original=await sharp(source).rotate().resize(4096,4096,{fit:'inside',withoutEnlargement:true}).jpeg({quality:85}).toBuffer({resolveWithObject:true});
 const feed=await sharp(source).rotate().resize(1080,1080,{fit:'inside',withoutEnlargement:true}).jpeg({quality:85}).toBuffer();
 const entry={number,startedAt:new Date().toISOString()};run.posts.push(entry);await save();
 const created=await request('POST',{caption:`Fleet 14 recording cap probe ${number}`,eaten_at:new Date().toISOString(),shots:[{position:0,width:original.info.width,height:original.info.height}]});
 entry.id=created.postId;await save();
 if(!entry.id||created.uploads?.length!==1)throw Error('Unexpected reservation');
 for(const [url,bytes] of [[created.uploads[0].originalSignedUrl,original.data],[created.uploads[0].feedSignedUrl,feed]]){const r=await fetch(url,{method:'PUT',headers:{'Content-Type':'image/jpeg'},body:bytes,signal:AbortSignal.timeout(60000)});if(!r.ok)throw Error(`Upload HTTP ${r.status}`);}
 await request('PUT',{postId:entry.id});
 const start=Date.now();while(Date.now()-start<600000){const state=check(await admin.from('posts').select('status').eq('id',entry.id).eq('user_id',user.id).single());entry.status=state.status;if(['ready','failed','needs_input'].includes(state.status))break;await sleep(2000);}
 if(!['ready','failed','needs_input'].includes(entry.status))throw Error('Post did not settle within ten minutes');
 entry.elapsedMs=Date.now()-Date.parse(entry.startedAt);entry.counts=check(await admin.from('user_call_hits').select('route,hour,hits').eq('user_id',user.id).gte('hour',new Date(Date.parse(entry.startedAt)).toISOString().slice(0,13)+':00:00.000Z'));
 await save();console.log(JSON.stringify({number,status:entry.status,elapsedMs:entry.elapsedMs,counts:entry.counts}));
 }}catch(error){run.error=error.message;await save();console.error(run.error);process.exitCode=1;}finally{
 for(const entry of run.posts.filter(p=>p.id)){
  try{const prefix=`${user.id}/${entry.id}`,objects=await paths(prefix);if(objects.length)check(await admin.storage.from('media').remove(objects));check(await admin.from('posts').delete().eq('id',entry.id).eq('user_id',user.id));const absent=check(await admin.from('posts').select('id').eq('id',entry.id));const remaining=await paths(prefix);if(absent.length||remaining.length)throw Error('Cleanup verification failed');run.cleanup.push({number:entry.number,removedObjects:objects.length,absent:true});}catch{run.cleanup.push({number:entry.number,absent:false});process.exitCode=1;}
  await save();
 }
 console.log(JSON.stringify({completed:run.posts.length,cleaned:run.cleanup.filter(x=>x.absent).length,error:run.error??null}));
}

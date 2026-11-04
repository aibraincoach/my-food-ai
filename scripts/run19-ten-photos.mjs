#!/usr/bin/env node
// #471 production proof: ten real photo posts on test account 2 within one hour, through every limited step
// a phone post makes. Exits 1 on any 429 ("a lot of requests this hour") or failed step; 2 when the run cannot be fair.
// timeout 20m node --env-file=.env.local scripts/run19-ten-photos.mjs --url=https://my-food-ai-ten.vercel.app --out=uploads/run19/ten-photos.json
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import {signInAsTestUser,signInTestClient} from './lib/session.mjs';
const arg=k=>process.argv.find(a=>a.startsWith(`--${k}=`))?.slice(k.length+3);
const url=new URL(arg('url')||process.env.APP_URL);process.env.APP_URL=url.origin;
const out=arg('out')||'uploads/run19/ten-photos.json';
const {user}=await signInTestClient(2);
if(user.email!==process.env.TEST_USER2_EMAIL||user.email===process.env.TEST_USER_EMAIL)throw Error('Designated account2 required');
const cookie=await signInAsTestUser(2),admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const checked=r=>{if(r.error)throw Error(r.error.message);return r.data;};
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const bucket=()=>{const h=new Date();h.setUTCMinutes(0,0,0);return h.toISOString();};
const hits=async hour=>Object.fromEntries(checked(await admin.from('user_call_hits').select('route,hits').eq('user_id',user.id).eq('hour',hour)).map(r=>[r.route,r.hits]));
async function storedPaths(prefix){const paths=[];for(let offset=0;;offset+=1000){const list=checked(await admin.storage.from('media').list(prefix,{limit:1000,offset}));for(const o of list){const path=prefix+'/'+o.name;if(o.id)paths.push(path);else paths.push(...await storedPaths(path));}if(list.length<1000)return paths;}}
const hour=bucket(),before=await hits(hour);
// Fair start: with the old per-request counting, ten photos alone spend 30 post hits, so a start above 30 proves nothing either way.
if((before.post??0)>30||(before.drink_identify??0)>110){console.log(JSON.stringify({pass:null,reason:'too many hits already this hour; run after the hour',before}));process.exit(2);}
if(new Date().getUTCMinutes()>40){console.log(JSON.stringify({pass:null,reason:'less than 20 minutes left in this hour; run after the hour'}));process.exit(2);}
const receipt={observedAt:new Date().toISOString(),url:url.origin,hour,before,calls:[],limited:[],posts:[]},ids=[],started=Date.now();
const call=async(label,path,method,body)=>{const r=await fetch(new URL(path,url),{method,headers:{Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify(body)});const text=await r.text();let json=null;try{json=JSON.parse(text);}catch{}receipt.calls.push({label,method,path,status:r.status});if(r.status===429)receipt.limited.push({label,path,body:json??text});return {status:r.status,json,text};};
let failed=null;
await mkdir('uploads/run19',{recursive:true});
try{
 for(let n=1;n<=10;n++){
  const id=randomUUID();ids.push(id);
  const bytes=await readFile(new URL(`../eval/photos/${String(n).padStart(2,'0')}.jpg`,import.meta.url));
  const body={operation_id:id,capture_intent:'photo',caption:'',eaten_at:new Date().toISOString(),shots:[{position:0,width:390,height:390}]};
  let reserved;
  for(let k=1;k<=3;k++){reserved=await call(`photo ${n} reserve ${k}`,'/api/posts','POST',body);if(reserved.status!==200)throw Error(`photo ${n} reserve ${k}: HTTP ${reserved.status} ${reserved.text}`);}
  for(const u of reserved.json.uploads)for(const signed of [u.originalSignedUrl,u.feedSignedUrl]){const r=await fetch(signed,{method:'PUT',headers:{'Content-Type':'image/jpeg'},body:bytes});if(!r.ok)throw Error(`photo ${n} upload: HTTP ${r.status}`);}
  // The composer retries 409 ("being checked") once a second; any other non-429 drink failure still lets the photo post.
  let drinks;for(let k=0;k<90;k++){drinks=await call(`photo ${n} drinks`,'/api/drinks/identify','POST',{upload_id:id,position:0});if(drinks.status!==409)break;await pause(1000);}
  if(drinks.status===429)throw Error(`photo ${n} drinks: limit message`);
  const published=await call(`photo ${n} publish`,'/api/posts','PUT',{postId:id});
  if(published.status!==200)throw Error(`photo ${n} publish: HTTP ${published.status} ${published.text}`);
  receipt.posts.push({n,id,drinks:drinks.status});
 }
 const deadline=Date.now()+12*60_000;
 for(const p of receipt.posts){for(;;){const post=checked(await admin.from('posts').select('status,fail_reason').eq('id',p.id).eq('user_id',user.id).maybeSingle());p.status=post?.status??'missing';p.fail_reason=post?.fail_reason??null;if(['ready','failed','needs_input','missing'].includes(p.status)||Date.now()>deadline)break;await pause(5000);}}
}catch(e){failed=e.message;}finally{
 receipt.seconds=Math.round((Date.now()-started)/1000);
 receipt.after=await hits(hour).catch(()=>null);
 receipt.cleanup=[];
 for(const id of ids){try{
  checked(await admin.from('posts').delete().eq('id',id).eq('user_id',user.id));
  checked(await admin.from('post_upload_drafts').delete().eq('id',id).eq('user_id',user.id));
  checked(await admin.from('composer_drink_readings').delete().eq('upload_id',id).eq('user_id',user.id));
  for(let pass=0;pass<2;pass++){const paths=await storedPaths(user.id+'/'+id);if(paths.length)checked(await admin.storage.from('media').remove(paths));await pause(300);}
  receipt.cleanup.push({id,absent:true});
 }catch(e){receipt.cleanup.push({id,error:e.message});failed??='cleanup incomplete';}}
}
if(bucket()!==hour){receipt.pass=null;receipt.reason='the hour changed during the run; run again';}
else receipt.pass=!failed&&receipt.limited.length===0&&receipt.posts.length===10&&receipt.seconds<3600&&(receipt.after?.post??0)-(before.post??0)===10;
receipt.error=failed;
await writeFile(out,JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify({pass:receipt.pass,limited:receipt.limited.length,posts:receipt.posts.map(p=>p.status),postHits:(receipt.after?.post??0)-(before.post??0),drinkHits:(receipt.after?.drink_identify??0)-(before.drink_identify??0),seconds:receipt.seconds,error:failed}));
process.exitCode=receipt.pass===null?2:receipt.pass?0:1;

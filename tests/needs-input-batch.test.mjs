// node --import tsx --test tests/needs-input-batch.test.mjs
import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {smallFeedPhotoUrl} from '../src/lib/posts/feed-photo-url.ts';
import {readNeedsInput} from '../src/lib/pipeline/needs-input.ts';
const source=ts.transpileModule(readFileSync(new URL('../src/components/NeedsInputStrip.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
const turn=()=>new Promise(resolve=>setImmediate(resolve));

test('questions share immutable thumbnail identities; media waits for events and account changes discard old reads',async()=>{
 const effects=[],states=[],reads=[];const events=new EventTarget();
 const timers=new Map();let timerId=0;let authChange,resolvePosts,hold=false,now=1700000000000,missingMedia=false;
 const question={short:'Clarification needed',question:'What did you eat?',options:[]};
 let session={user:{id:'11111111-1111-4111-8111-111111111111'},access_token:'fixture-token'};
 const posts=[{id:'33333333-3333-4333-8333-333333333333',eaten_at:'2026-11-03T00:00:00Z',status:'needs_input',needs_input:question},{id:'44444444-4444-4444-8444-444444444444',eaten_at:'2026-11-03T00:00:00Z',status:'needs_input',needs_input:question}];
 const media=[{id:'55555555-5555-4555-8555-555555555555',post_id:'33333333-3333-4333-8333-333333333333',storage_path:'owner-a/one/original.jpg',position:0},{id:'55555555-5555-4555-8555-555555555555',post_id:'33333333-3333-4333-8333-333333333333',storage_path:'owner-a/one/extra.jpg',position:1},{id:'55555555-5555-4555-8555-555555555555',post_id:'44444444-4444-4444-8444-444444444444',storage_path:'owner-a/two/original.jpg',position:0}];
 const db={auth:{getSession:async()=>({data:{session}}),onAuthStateChange(fn){authChange=fn;return{data:{subscription:{unsubscribe(){}}}};}},from(table){
  const filters=[];const q=new Proxy({}, {get(_,key){
   if(key==='then')return(resolve,reject)=>{reads.push({table,filters});if(table==='posts'&&hold)return new Promise(r=>{resolvePosts=r;}).then(resolve,reject);return Promise.resolve({data:table==='posts'?posts:(missingMedia?media.filter(row=>row.post_id!==posts[0].id):media),error:null}).then(resolve,reject);};
   if(['eq','in','or','is','order','abortSignal'].includes(key))return(...values)=>{filters.push(values);return q;};
   return()=>q;
  }});return q;
 }};
 const exports={};vm.runInNewContext(source,{exports,AbortSignal,Date:{now:()=>now},document:{hidden:false,visibilityState:'visible',addEventListener(){},removeEventListener(){}},window:events,process:{env:{NEXT_PUBLIC_SUPABASE_URL:'https://fixture.invalid',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'fixture-key'}},
  setTimeout(fn,ms=0){timers.set(++timerId,{fn,at:now+ms});return timerId;},clearTimeout:id=>timers.delete(id),queueMicrotask,fetch:async()=>{throw Error('strip must not sign or fetch full-size photos');},
  require(name){if(name==='react')return{useEffect:fn=>effects.push(fn),useState:initial=>[initial,value=>states.push(value)]};if(name==='react/jsx-runtime')return{jsx:()=>null,jsxs:()=>null};if(name==='@/lib/supabase/client')return{createClient:()=>db};if(name==='@/lib/posts/feed-photo-url')return{smallFeedPhotoUrl};if(name==='@/lib/pipeline/needs-input')return{readNeedsInput};if(name.startsWith('@/components/'))return{default:()=>null};throw Error(name);}
 });
 exports.default();const cleanup=effects[0]();await turn();await turn();
 assert.equal(reads.filter(x=>x.table==='post_media').length,1);
 assert.equal(states.at(-1).length,2,'all unanswered questions remain visible');
 assert.equal(states.at(-1)[0].photoUrl,smallFeedPhotoUrl(session.user.id,posts[0].id,media[0].id));
 const idleReads=reads.length;for(let elapsed=0;elapsed<600000;elapsed+=1000){now+=1000;for(const[id,timer]of[...timers])if(timer.at<=now){timers.delete(id);timer.fn();}await turn();}assert.equal(reads.length,idleReads,'ten simulated minutes with questions cause no timed reads');
 events.dispatchEvent(new Event('focus'));await turn();await turn();assert.equal(reads.filter(x=>x.table==='post_media').length,1,'unchanged identities need no renewed signatures');
 const beforeEvent=reads.filter(x=>x.table==='posts').length;const external={...posts[0],id:'66666666-6666-4666-8666-666666666666',needs_input:{...question,question:'Question inserted in another session'}};posts.push(external);events.dispatchEvent(new Event('post-readiness'));await turn();await turn();assert.equal(reads.filter(x=>x.table==='posts').length,beforeEvent+1);assert.equal(states.at(-1).find(p=>p.id===external.id)?.needs_input.question,'Question inserted in another session','external INSERT event updates the strip without advancing any timer');posts.pop();events.dispatchEvent(new Event('post-readiness'));await turn();await turn();
 posts[0].needs_input={...question,question:'New question'};missingMedia=true;events.dispatchEvent(new Event('post-readiness'));await turn();await turn();
 assert.equal(states.at(-1).length,2,'missing auxiliary photo never hides a question');
 assert.equal(states.at(-1)[0].photoUrl,null);
 const attempts=reads.filter(x=>x.table==='post_media').length;
 const failedReads=reads.length;now+=600000;for(const[id,timer]of[...timers])if(timer.at<=now){timers.delete(id);timer.fn();}await turn();await turn();assert.equal(reads.length,failedReads,'missing media has no timed retry');assert.equal(reads.filter(x=>x.table==='post_media').length,attempts);
 now+=2001;missingMedia=false;events.dispatchEvent(new Event('focus'));await turn();await turn();
 assert.equal(states.at(-1)[0].photoUrl,smallFeedPhotoUrl(session.user.id,posts[0].id,media[0].id),'unchanged question recovers a late photo');
 hold=true;events.dispatchEvent(new Event('focus'));await turn();session={user:{id:'22222222-2222-4222-8222-222222222222'},access_token:'other-fixture'};authChange('SIGNED_IN',session);
 resolvePosts({data:posts,error:null});await turn();await turn();
 assert.deepEqual(Array.from(states.at(-2)),[],'switching account immediately clears the old questions');
 assert.ok(states.every(value=>!Array.isArray(value)||value.every(post=>post.id==='33333333-3333-4333-8333-333333333333'||post.id==='44444444-4444-4444-8444-444444444444'||post.id===external.id)));
 assert.equal(states.at(-1),null,'selected old-account question is cleared and old async results cannot restore it');
 cleanup();
});

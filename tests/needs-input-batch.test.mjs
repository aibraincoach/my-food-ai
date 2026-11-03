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

test('questions share immutable thumbnail identities; missing media retries and account changes discard old reads',async()=>{
 const effects=[],states=[],reads=[];
 let tick,authChange,resolvePosts,hold=false,now=1700000000000,missingMedia=false;
 const question={short:'Clarification needed',question:'What did you eat?',options:[]};
 let session={user:{id:'11111111-1111-4111-8111-111111111111'},access_token:'fixture-token'};
 const posts=[{id:'33333333-3333-4333-8333-333333333333',eaten_at:'2026-11-03T00:00:00Z',needs_input:question},{id:'44444444-4444-4444-8444-444444444444',eaten_at:'2026-11-03T00:00:00Z',needs_input:question}];
 const media=[{id:'55555555-5555-4555-8555-555555555555',post_id:'33333333-3333-4333-8333-333333333333',storage_path:'owner-a/one/original.jpg',position:0},{id:'55555555-5555-4555-8555-555555555555',post_id:'33333333-3333-4333-8333-333333333333',storage_path:'owner-a/one/extra.jpg',position:1},{id:'55555555-5555-4555-8555-555555555555',post_id:'44444444-4444-4444-8444-444444444444',storage_path:'owner-a/two/original.jpg',position:0}];
 const db={auth:{getSession:async()=>({data:{session}}),onAuthStateChange(fn){authChange=fn;return{data:{subscription:{unsubscribe(){}}}};}},from(table){
  const filters=[];const q=new Proxy({}, {get(_,key){
   if(key==='then')return(resolve,reject)=>{reads.push({table,filters});if(table==='posts'&&hold)return new Promise(r=>{resolvePosts=r;}).then(resolve,reject);return Promise.resolve({data:table==='posts'?posts:(missingMedia?media.filter(row=>row.post_id!==posts[0].id):media),error:null}).then(resolve,reject);};
   if(['eq','in'].includes(key))return(...values)=>{filters.push(values);return q;};
   return()=>q;
  }});return q;
 }};
 const exports={};vm.runInNewContext(source,{exports,AbortSignal,Date:{now:()=>now},document:{hidden:false},process:{env:{NEXT_PUBLIC_SUPABASE_URL:'https://fixture.invalid',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'fixture-key'}},
  setInterval(fn){tick=fn;return 1;},clearInterval(){},fetch:async()=>{throw Error('strip must not sign or fetch full-size photos');},
  require(name){if(name==='react')return{useEffect:fn=>effects.push(fn),useState:initial=>[initial,value=>states.push(value)]};if(name==='react/jsx-runtime')return{jsx:()=>null,jsxs:()=>null};if(name==='@/lib/supabase/client')return{createClient:()=>db};if(name==='@/lib/posts/feed-photo-url')return{smallFeedPhotoUrl};if(name==='@/lib/pipeline/needs-input')return{readNeedsInput};if(name.startsWith('@/components/'))return{default:()=>null};throw Error(name);}
 });
 exports.default();const cleanup=effects[0]();await turn();await turn();
 assert.equal(reads.filter(x=>x.table==='post_media').length,1);
 assert.equal(states.at(-1).length,2,'all unanswered questions remain visible');
 assert.equal(states.at(-1)[0].photoUrl,smallFeedPhotoUrl(session.user.id,posts[0].id,media[0].id));
 tick();await turn();await turn();assert.equal(reads.filter(x=>x.table==='post_media').length,1,'unchanged identities need no renewed signatures');
 posts[0].needs_input={...question,question:'New question'};missingMedia=true;tick();await turn();await turn();
 assert.equal(states.at(-1).length,2,'missing auxiliary photo never hides a question');
 assert.equal(states.at(-1)[0].photoUrl,null);
 const attempts=reads.filter(x=>x.table==='post_media').length;
 tick();await turn();await turn();assert.equal(reads.filter(x=>x.table==='post_media').length,attempts,'missing media backs off');
 now+=2001;missingMedia=false;tick();await turn();await turn();
 assert.equal(states.at(-1)[0].photoUrl,smallFeedPhotoUrl(session.user.id,posts[0].id,media[0].id),'unchanged question recovers a late photo');
 hold=true;tick();await turn();session={user:{id:'22222222-2222-4222-8222-222222222222'},access_token:'other-fixture'};authChange('SIGNED_IN',session);
 resolvePosts({data:posts,error:null});await turn();await turn();
 assert.deepEqual(Array.from(states.at(-2)),[],'switching account immediately clears the old questions');
 assert.ok(states.every(value=>!Array.isArray(value)||value.every(post=>post.id==='33333333-3333-4333-8333-333333333333'||post.id==='44444444-4444-4444-8444-444444444444')));
 assert.equal(states.at(-1),null,'selected old-account question is cleared and old async results cannot restore it');
 cleanup();
});

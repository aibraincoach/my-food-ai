// node --import tsx --test tests/needs-input-batch.test.mjs
import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {readNeedsInput} from '../src/lib/pipeline/needs-input.ts';
const source=ts.transpileModule(readFileSync(new URL('../src/components/NeedsInputStrip.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
const turn=()=>new Promise(resolve=>setImmediate(resolve));

test('questions share one media/signing batch and unchanged polls do not resign; account changes discard old reads',async()=>{
 const effects=[],states=[],reads=[],signs=[];
 let tick,authChange,resolvePosts,hold=false,now=1700000000000,failedSign=false;
 const question={short:'Clarification needed',question:'What did you eat?',options:[]};
 let session={user:{id:'owner-a'},access_token:'fixture-token'};
 const posts=[{id:'one',eaten_at:'2026-11-03T00:00:00Z',needs_input:question},{id:'two',eaten_at:'2026-11-03T00:00:00Z',needs_input:question}];
 const media=[{post_id:'one',storage_path:'owner-a/one/original.jpg',position:0},{post_id:'one',storage_path:'owner-a/one/extra.jpg',position:1},{post_id:'two',storage_path:'owner-a/two/original.jpg',position:0}];
 const db={auth:{getSession:async()=>({data:{session}}),onAuthStateChange(fn){authChange=fn;return{data:{subscription:{unsubscribe(){}}}};}},from(table){
  const filters=[];const q=new Proxy({}, {get(_,key){
   if(key==='then')return(resolve,reject)=>{reads.push({table,filters});if(table==='posts'&&hold)return new Promise(r=>{resolvePosts=r;}).then(resolve,reject);return Promise.resolve({data:table==='posts'?posts:media,error:null}).then(resolve,reject);};
   if(['eq','in'].includes(key))return(...values)=>{filters.push(values);return q;};
   return()=>q;
  }});return q;
 }};
 const exports={};vm.runInNewContext(source,{exports,AbortSignal,Date:{now:()=>now},document:{hidden:false},process:{env:{NEXT_PUBLIC_SUPABASE_URL:'https://fixture.invalid',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'fixture-key'}},
  setInterval(fn){tick=fn;return 1;},clearInterval(){},fetch:async(url,init)=>{assert.equal(init.method,'POST');assert.ok(init.signal);const body=JSON.parse(init.body);signs.push(body.paths);return{ok:true,json:async()=>body.paths.map((path,index)=>failedSign&&index===0?{path,error:'missing object'}:{path,signedURL:'/object/sign/media/'+path+'?token=fixture'})};},
  require(name){if(name==='react')return{useEffect:fn=>effects.push(fn),useState:initial=>[initial,value=>states.push(value)]};if(name==='react/jsx-runtime')return{jsx:()=>null,jsxs:()=>null};if(name==='@/lib/supabase/client')return{createClient:()=>db};if(name==='@/lib/pipeline/needs-input')return{readNeedsInput};if(name.startsWith('@/components/'))return{default:()=>null};throw Error(name);}
 });
 exports.default();const cleanup=effects[0]();await turn();await turn();
 assert.equal(reads.filter(x=>x.table==='post_media').length,1);
 assert.equal(signs.length,1);assert.deepEqual(Array.from(signs[0]),['owner-a/one/original.feed.jpg','owner-a/two/original.feed.jpg']);
 assert.equal(states.at(-1).length,2,'all unanswered questions remain visible');
 tick();await turn();await turn();assert.equal(signs.length,1);assert.equal(reads.filter(x=>x.table==='post_media').length,1,'unchanged questions retain their media capabilities');
 now+=300001;tick();await turn();await turn();assert.equal(signs.length,2,'unchanged questions renew expired signatures');
 now+=300001;failedSign=true;tick();await turn();await turn();assert.equal(signs.length,3);
 assert.equal(states.at(-1).length,2,'per-object signing errors never hide unanswered questions');
 assert.equal(states.at(-1)[0].photoUrl,null,'an expired capability is not left on the image');
 tick();await turn();assert.equal(signs.length,3,'sign failures back off rather than firing on every poll');
 now+=2001;failedSign=false;tick();await turn();await turn();assert.equal(signs.length,4,'a per-object failure is retried and can recover without changing the question');
 hold=true;tick();await turn();session={user:{id:'owner-b'},access_token:'other-fixture'};authChange('SIGNED_IN',session);
 resolvePosts({data:posts,error:null});await turn();await turn();
 assert.deepEqual(Array.from(states.at(-2)),[],'switching account immediately clears the old questions');
 assert.ok(states.every(value=>!Array.isArray(value)||value.every(post=>post.id==='one'||post.id==='two')));
 assert.equal(states.at(-1),null,'selected old-account question is cleared and old async results cannot restore it');
 cleanup();
});

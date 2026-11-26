import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import ts from 'typescript';import{readFileSync}from'node:fs';import{tabReturnModule,returnToTab}from'./fixtures/tab-return-module.mjs';
test('thumbs returns use the current revision and discard an older response without rereading on render',async()=>{
 const window=new EventTarget(),document=Object.assign(new EventTarget(),{visibilityState:'visible'}),exports={},slots=[],effects=[],pending=[];let cursor=0,tree;
 const code=ts.transpileModule(readFileSync(new URL('../src/components/ThumbsFeedback.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const effect=(run,deps)=>{const i=cursor++,old=slots[i];if(!old||deps.some((v,n)=>v!==old.deps[n])){effects.push(()=>{old?.cleanup?.();slots[i]={deps,cleanup:run()};});}};
 const react={useRef(value){const i=cursor++;return(slots[i]??={current:value});},useState(value){const i=cursor++;if(!(i in slots))slots[i]=value;return[slots[i],v=>{slots[i]=typeof v==='function'?v(slots[i]):v;}];},useEffect:effect,useLayoutEffect:effect,useSyncExternalStore(_subscribe,get){cursor++;return get();}};
 const batch={requestFeedback(){return new Promise((resolve,reject)=>pending.push(value=>value.error?reject(value.error):resolve(value.data)));}};
 const jsx=(type,props)=>({type,props});vm.runInNewContext(code,{exports,window,document,Event,CustomEvent,require(name){if(name==='react')return react;if(name==='react/jsx-runtime')return{jsx,jsxs:jsx};if(name==='next-intl')return{useTranslations:()=>key=>key};if(name==='next/navigation')return{useRouter:()=>({refresh(){}})};if(name==='@/lib/client/tab-return')return tabReturnModule(window,document);if(name==='@/lib/client/feedback-batch')return batch;if(name==='@/lib/posts/feedback-errors')return{subscribeFeedbackErrors(){},feedbackSavePending:()=>false,hasFeedbackError:()=>false};if(name.startsWith('@/lib/'))return{};if(name.startsWith('@/components/'))return{default:()=>null,Icon:()=>null};throw Error(name);}});
 const render=props=>{cursor=0;tree=exports.default(props);while(effects.length)effects.shift()();};
 const buttons=()=>{const found=[];function visit(v){if(Array.isArray(v)){for(const child of v)visit(child);return;}if(!v||typeof v!=='object')return;if(v.type==='button')found.push(v);for(const c of [v.props?.children].flat())visit(c);}visit(tree);return found;};
 const old={postId:'meal',modelCommentId:'old-model',fingerprint:'old-foods'},current={...old,modelCommentId:'new-model',fingerprint:'new-foods'};
 try{render(old);assert.equal(pending.length,1);render(current);assert.equal(pending.length,1,'revision or translation rerender does not initiate another read');pending[0]({data:{verdict:'up',model_comment_id:'old-model',item_fingerprint:'old-foods'}});await new Promise(r=>setImmediate(r));render(current);assert.equal(buttons()[0].props['aria-pressed'],false,'old revision response is discarded');returnToTab(document);assert.equal(pending.length,2);pending[1]({data:{verdict:'up',model_comment_id:'new-model',item_fingerprint:'new-foods'}});await new Promise(r=>setImmediate(r));render(current);assert.equal(buttons()[0].props['aria-pressed'],true,'current revision return response is displayed');render({...current});assert.equal(pending.length,2,'ordinary render alone performs no read');window.dispatchEvent(new CustomEvent('post-feedback',{detail:{postId:'meal',modelCommentId:'new-model',fingerprint:'new-foods',verdict:'down'}}));render(current);assert.equal(buttons()[1].props['aria-pressed'],true,'own event updates without reading');assert.equal(pending.length,2);returnToTab(document);assert.equal(pending.length,3);pending[2]({error:Error('read failed')});await new Promise(r=>setImmediate(r));render(current);assert.equal(buttons().some(b=>b.props['aria-pressed']),false,'a failed read clears to the prior guarded null state');await new Promise(r=>setImmediate(r));assert.equal(pending.length,3,'no retry after a read error');returnToTab(document);assert.equal(pending.length,4);const third={...current,fingerprint:'third-foods'};render(third);returnToTab(document);assert.equal(pending.length,5);pending[4]({data:{verdict:'up',model_comment_id:'new-model',item_fingerprint:'third-foods'}});await new Promise(r=>setImmediate(r));render(third);assert.equal(buttons()[0].props['aria-pressed'],true);pending[3]({data:{verdict:'down',model_comment_id:'new-model',item_fingerprint:'new-foods'}});await new Promise(r=>setImmediate(r));render(third);assert.equal(buttons()[0].props['aria-pressed'],true,'a stale late response cannot erase the current selection');}finally{for(const slot of slots)slot?.cleanup?.();}
});

test('five real thumbs effects share the batch reader on mount and tab return, and own events do not read',async()=>{
 const {feedbackBatchModule}=await import('./fixtures/feedback-batch-module.mjs');
 const window=new EventTarget(),document=Object.assign(new EventTarget(),{visibilityState:'visible'}),timers=[],effects=[],calls=[];
 const db={from(table){assert.equal(table,'post_feedback');return{select(){return{in(_column,ids){calls.push([...ids]);return Promise.resolve({data:[],error:null});}};}};}};
 const batch=feedbackBatchModule(db,fn=>timers.push(fn)),exports={};
 const code=ts.transpileModule(readFileSync(new URL('../src/components/ThumbsFeedback.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 vm.runInNewContext(code,{exports,window,document,Event,CustomEvent,require(name){
  if(name==='react')return{useRef:current=>({current}),useState:value=>[value,()=>{}],useEffect:fn=>effects.push(fn),useLayoutEffect:fn=>effects.push(fn),useSyncExternalStore:()=>false};
  if(name==='react/jsx-runtime')return{jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})};
  if(name==='next-intl')return{useTranslations:()=>key=>key};if(name==='next/navigation')return{useRouter:()=>({refresh(){}})};
  if(name==='@/lib/client/tab-return')return tabReturnModule(window,document);if(name==='@/lib/client/feedback-batch')return batch;
  if(name==='@/lib/posts/feedback-errors')return{subscribeFeedbackErrors(){},feedbackSavePending:()=>false,hasFeedbackError:()=>false};
  if(name.startsWith('@/lib/'))return{};if(name.startsWith('@/components/'))return{default:()=>null,Icon:()=>null};throw Error(name);
 }});
 for(let n=0;n<5;n++)exports.default({postId:'meal'+n,modelCommentId:'model',fingerprint:'foods'});
 const cleanup=effects.map(fn=>fn()),flush=async()=>{assert.equal(timers.length,1);timers.shift()();await new Promise(r=>setImmediate(r));};
 try{
  await flush();assert.equal(calls.length,1);assert.equal(calls[0].length,5);
  window.dispatchEvent(new CustomEvent('post-feedback',{detail:{postId:'meal0',modelCommentId:'model',fingerprint:'foods',verdict:'up'}}));assert.equal(timers.length,0);assert.equal(calls.length,1);
  returnToTab(document);await flush();assert.equal(calls.length,2);assert.equal(calls[1].length,5);
 }finally{for(const fn of cleanup)fn?.();}
});

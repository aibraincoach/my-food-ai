import {tabReturnModule,returnToTab} from './fixtures/tab-return-module.mjs';
import {failureMessageKey} from '../src/lib/worker/failure-message.ts';
import * as readingFormat from '../src/i18n/format.ts';
import {servingsMessageValues} from '../src/i18n/servings.ts';
import {englishIntl,englishIntlServer} from './fixtures/english-intl.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {getPostDetail} from '../src/lib/posts/items.ts';
import {correctionFeedback} from '../src/lib/posts/correction-feedback.ts';

const post={id:'10000000-0000-4000-8000-000000000001',user_id:'owner',caption:'Rice',eaten_at:'2026-11-03T00:00:00Z',status:'ready',analysis_initialized_at:'2026-11-03T00:00:01Z',servings:1,source_post_id:null,created_at:'2026-11-03T00:00:00Z',identify_model:null,identify_host:null};
test('a meal detail keeps its before/after revision fence and shares it with the card',async()=>{
 let revisions=0;const db={rpc(name){assert.equal(name,'feedback_revision');revisions++;return{abortSignal:async()=>({data:{modelCommentId:'model',fingerprint:'same'},error:null,status:200})};},from(table){let chain;chain=new Proxy({}, {get(_target,key){if(key==='then')return resolve=>Promise.resolve({data:[],error:null,status:200}).then(resolve);if(key==='maybeSingle'||key==='single')return async()=>({data:table==='posts'?post:table==='profiles'?{handle:'owner',avatar_media_id:null}:null,error:null,status:200});return()=>chain;}});return chain;}};
 const detail=await getPostDetail(db,post.id);assert.ok(detail);assert.equal(detail.card.analysisFingerprint,'same');assert.equal(revisions,2);
});

test('a thread uses the supplied fingerprint and makes no revision RPC on load',async()=>{
 const effects=[],states=[],stateWrites=[];let revisionReads=0,refreshes=0,feedbackError=false,feedbackFingerprint='same';const comments=[{id:'model',author:'model',body:'Existing reply',created_at:'2026-11-03T00:00:00Z'}];const window=new EventTarget(),document=Object.assign(new EventTarget(),{visibilityState:'visible'});
 const client={rpc(){revisionReads++;return Promise.resolve({data:{fingerprint:'same'}});},from(table){const q={select(){return q;},eq(){return q;},maybeSingle:async()=>({data:table==='post_feedback'?{verdict:'up',model_comment_id:'model',item_fingerprint:feedbackFingerprint}:{status:'ready',analysis_initialized_at:'done'},error:null})};return q;},channel(){const c={on(){return c;},subscribe(){return c;}};return c;},removeChannel(){}};
 const code=ts.transpileModule(readFileSync(new URL('../src/components/Thread.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const exports={};vm.runInNewContext(code,{exports,window,document,Event,CustomEvent,setTimeout,clearTimeout,require(name){if(name==='@/lib/client/tab-return')return tabReturnModule(window,document);
 if(name==='next-intl')return englishIntl;
 if(name==='next-intl/server')return englishIntlServer;
 if(name==='@/i18n/format')return readingFormat;
 if(name==='@/i18n/servings')return {servingsMessageValues};

  if(name==='react')return{useEffect:fn=>effects.push(fn),useCallback:fn=>fn,useRef:current=>({current}),useState:initial=>{const i=states.length;states.push(initial);return[initial,next=>{states[i]=typeof next==='function'?next(states[i]):next;stateWrites.push([i,states[i]]);}];}};
  if(name==='react/jsx-runtime')return{jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})};
  if(name==='next/navigation')return{useRouter:()=>({refresh(){refreshes++;}})};
  if(name==='@/lib/client/feedback-batch')return{requestFeedback:async()=>{if(feedbackError)throw Error('feedback read failed');const r=await client.from('post_feedback').select().eq().maybeSingle();if(r.error)throw r.error;return r.data;}};if(name==='@/lib/supabase/client')return{createClient:()=>client};
  if(name==='@/lib/posts/timeline')return{readPostComments:async()=>comments};
  if(name==='@/lib/posts/correction-feedback')return{correctionFeedback};
  if(name==='@/components/PostHandle')return{usePostHandle:()=> 'owner'};
  if(name==='@/components/useRemovalMenus')return{useRemovalMenus(){}};
  if(name==='@/lib/worker/failure-message')return{failureMessageKey};
  if(name==='@/lib/posts/delayed-action')return{delayAction(){throw Error('not used');}};
  if(name.startsWith('@/components/'))return{default:()=>null,LocalTime:()=>null};throw Error(name);
 }});
 exports.default({postId:post.id,fingerprint:'same'});const cleanup=effects.map(fn=>fn());await new Promise(resolve=>setImmediate(resolve));assert.equal(revisionReads,0);assert.equal(states[0],'model');assert.equal(refreshes,0,'initial comments must not force a second detail revision read');comments.push({id:'new-model',author:'model',body:'New reply',created_at:'2026-11-03T01:00:00Z'});returnToTab(document);await new Promise(resolve=>setImmediate(resolve));assert.equal(refreshes,1,'a newly arrived reply still refreshes the detail');feedbackFingerprint='another revision';returnToTab(document);await new Promise(resolve=>setImmediate(resolve));assert.equal(states[0],null,'a mismatched fingerprint cannot show accepted');feedbackFingerprint='same';returnToTab(document);await new Promise(resolve=>setImmediate(resolve));assert.equal(states[0],'model');feedbackError=true;returnToTab(document);await new Promise(resolve=>setImmediate(resolve));assert.ok(stateWrites.some(([i,value])=>i===2&&value?.key==='loadFailed'),'a rejected batch preserves the feedback loadFailed path');assert.equal(states[0],'model','failed read does not overwrite accepted marker');for(const fn of cleanup)fn?.();
});

test('a correction committing between revision and item reads fences the rendered card',async()=>{
 let revisions=0;
 const changed={id:'20000000-0000-4000-8000-000000000001',post_id:post.id,name:'Corrected rice',portion_text:'200 g',portion_grams:200,source:'user',not_eaten_calories:null};
 const db={rpc(name){assert.equal(name,'feedback_revision');const data={modelCommentId:revisions++?'new-model':'old-model',fingerprint:revisions===1?'old':'new'};return{abortSignal:async()=>({data,error:null,status:200})};},from(table){let chain;chain=new Proxy({}, {get(_target,key){if(key==='then')return resolve=>Promise.resolve({data:table==='current_post_items'?[changed]:table==='item_nutrition'?[{post_item_id:changed.id,calories:260,micronutrients:[]}]:[],error:null,status:200}).then(resolve);if(key==='maybeSingle'||key==='single')return async()=>({data:table==='posts'?post:table==='profiles'?{handle:'owner',avatar_media_id:null}:null,error:null,status:200});return()=>chain;}});return chain;}};
 const detail=await getPostDetail(db,post.id);assert.equal(detail.card.items[0].name,'Corrected rice');assert.equal(detail.card.revisionUnavailable,true,'changed mid-read must not present a stable revision');assert.equal(detail.card.analysisFingerprint,null,'new items must not carry the old fingerprint');assert.equal(detail.card.modelCommentId,null,'new items must not carry the old accepted revision');assert.equal(revisions,2);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {captureEnglish} from './fixtures/capture-wording.mjs';
import * as captureFailure from '../src/lib/posts/capture-failure.ts';

const failure={code:'serverFailed'};
const jsx=(type,props)=>({type,props:props??{}});
function fixture(){
 const photo={operationId:'attachment',posted:true,state:'failed',caption:'Added photo',failure,attachment:{postId:'meal',notEaten:false},previewUrl:'blob:kept-photo'};
 const rows=new Map([[photo.operationId,photo],['completed',{operationId:'completed',postId:'meal'}]]),events=new EventTarget(),effects=[];
 const manager={list:()=>[...rows.values()],initialize:async()=>{},online(){},remove:async id=>{rows.delete(id);}};
 const window={addEventListener:(...args)=>events.addEventListener(...args),removeEventListener:(...args)=>events.removeEventListener(...args),matchMedia:()=>({matches:false,addEventListener(){},removeEventListener(){}})};
 const db={auth:{getSession:async()=>({data:{session:{user:{id:'owner'}}}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})}};
 const dependencies={
  '@/i18n/failure-messages':{useFailureMessages:()=>captureEnglish},'next-intl':{useTranslations:()=>captureEnglish},'@/lib/posts/capture-failure':captureFailure,
  'react':{useEffect:fn=>effects.push(fn),useState:value=>[value,()=>{}]},
  'react/jsx-runtime':{jsx,jsxs:jsx},'react-dom':{createPortal:x=>x},
  'next/navigation':{usePathname:()=> '/',useRouter:()=>({push(){}})},
  '@/lib/supabase/client':{createClient:()=>db},'@/lib/posts/upload-manager':{uploadManager:manager},
  '@/lib/posts/upload-target':{uploadTargetsPost:(upload,id)=>upload.postId===id||upload.attachment?.postId===id},
  './useUploads':{useUploads:()=>manager.list()},'./UploadBar':{default:()=>null},
 };
 const source=ts.transpileModule(readFileSync(new URL('../src/components/UploadChip.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
 const exports={};vm.runInNewContext(source,{exports,require:name=>{assert.ok(name in dependencies,name);return dependencies[name]},window,document:{getElementById:()=>null},setTimeout});
 const tree=exports.default({});for(const effect of effects)effect();
 return{rows,tree,emit:type=>events.dispatchEvent(new CustomEvent(type,{detail:{id:'meal',reason:'deleted'}}))};
}
function buttons(node){if(!node||typeof node!=='object')return[];if(Array.isArray(node))return node.flatMap(buttons);return[...(node.type==='button'?[node]:[]),...buttons(node.props?.children)];}
for(const event of ['post-deleted','post-unavailable'])test(`${event} keeps a pending attachment's refusal until the person removes it`,async()=>{
 const app=fixture();app.emit(event);await new Promise(r=>setImmediate(r));
 assert.ok(app.rows.has('attachment'),'the selected photo and refusal must survive meal retirement');
 assert.deepEqual(app.rows.get('attachment').failure,failure);
 assert.equal(app.rows.has('completed'),false,'ordinary completed upload retirement is unchanged');
 const remove=buttons(app.tree).find(x=>x.props.children==='Remove');assert.ok(remove,'the retained photo has a Remove action');remove.props.onClick();await new Promise(r=>setImmediate(r));assert.equal(app.rows.has('attachment'),false,'explicit Remove dismisses the pending photo');
});

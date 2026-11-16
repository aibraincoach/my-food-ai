// Recording/transcription guards protect meal data. No microphone, model or DB calls.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function harness(component,{desktop=false,reject=false}={}){
 const instances=new Map(),worklets=[],requests=[],posted=[],timers=[];
 let current,cursor,caption='Typed meal',done,fail;
 const response=new Promise((resolve,reject)=>{done=resolve;fail=reject;});
 const hooks={useState(initial){const i=cursor++,slot=current;slot[i]??={value:typeof initial==='function'?initial():initial};return[slot[i].value,value=>{slot[i].value=typeof value==='function'?value(slot[i].value):value;}];},useRef(value){const i=cursor++;return current[i]??={current:value};},useCallback(fn){cursor++;return fn;},useEffect(fn,deps){const i=cursor++,slot=current;if(!slot[i]||deps.some((d,j)=>d!==slot[i].deps[j])){slot[i]={deps,cleanup:fn()};}},useMemo(fn){cursor++;return fn();}};
 const jsx=(type,props)=>({type,props});
 const cache={};
 function load(name){
  if(cache[name])return cache[name];const exports={};cache[name]=exports;
  const code=ts.transpileModule(readFileSync(new URL('../src/components/'+name+'.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
  const fallback=new Proxy({},{get:(_,key)=>key==='__esModule'?true:key==='DRINK_TILES'?[]:key==='TILE_SIZES'?[]:()=>null});
  vm.runInNewContext(code,{exports,console,Blob,FormData,AbortController,AbortSignal,Float32Array,crypto,Date,Intl,Event,CustomEvent,requestAnimationFrame:()=>1,cancelAnimationFrame(){},setTimeout:fn=>{timers.push(fn);return timers.length;},clearTimeout(){},window:{AudioContext:true,addEventListener(){},removeEventListener(){},dispatchEvent(){},setTimeout:()=>1,clearTimeout(){}},navigator:{mediaDevices:{getUserMedia:async()=>({getTracks:()=>[{stop(){}}]})}},AudioContext:class{sampleRate=16000;audioWorklet={addModule:async()=>{}};destination={};async resume(){}async close(){}createMediaStreamSource(){return{connect(){}};}},AudioWorkletNode:class{constructor(){worklets.push(this);}port={postMessage(){}};connect(){}disconnect(){}},fetch:async(url,init)=>{if(url==='/api/transcribe'){requests.push(init);return response;}return Response.json({rows:[],counts:[],usualMl:[]});},Response,require(id){
   if(id==='react')return hooks;if(id==='react/jsx-runtime')return{jsx,jsxs:jsx};
   if(id==='@/components/VoiceButton')return load('VoiceButton');if(id==='@/components/VoiceRecorder')return load('VoiceRecorder');
   if(id==='@/lib/audio/wav-encoder')return{encodeWav:()=>new Uint8Array(100)};
   if(id==='@/lib/audio/limits')return{MAX_RECORDING_SECONDS:120};
   if(id==='@/lib/ui/use-desktop')return{useDesktop:()=>desktop};
   if(id==='./ComposerDrinks')return{useComposerDrinks:()=>({saving:false,active:false})};
   if(id==='@/components/PostHandle')return{usePostHandle:()=> 'owner'};
   if(id==='@/lib/posts/upload-manager')return{uploadManager:{postCaption:async text=>{posted.push(text);}}};
   if(id==='@/components/ui/Button')return{Button:'button'};if(id==='@/components/ui/Field')return{Field:'input'};
   return fallback;
  }});return exports;
 }
 const Root=load(component).default;
 const props=component==='IntakeSheet'?{embedded:true}:{shots:[],caption,setCaption:value=>{caption=value;},index:0,notEaten:[],when:null,pending:0,onPost:()=>posted.push(caption)};
 function render(){
  const expand=(node,path)=>{
   if(!node)return node;if(Array.isArray(node))return node.flatMap((child,i)=>expand(child,path+'.'+i));
   if(typeof node!=='object')return node;
   if(typeof node.type==='function'){const previous=current,previousCursor=cursor;current=instances.get(path)??[];instances.set(path,current);cursor=0;const tree=node.type(node.props);current=previous;cursor=previousCursor;return expand(tree,path+'.child');}
   return{...node,props:{...node.props,children:expand(node.props?.children,path+'.children')}};
  };
  return expand({type:Root,props:{...props,...(component==='IntakeSheet'?{}:{caption})}},'root');
 }
 function nodes(tree){if(!tree)return[];if(Array.isArray(tree))return tree.flatMap(nodes);if(typeof tree!=='object')return[];return[tree,...nodes(tree.props?.children)];}
 const find=(tree,predicate)=>nodes(tree).find(predicate);
 const post=tree=>find(tree,n=>n.type==='button'&&(n.props.type==='submit'||n.props.children==='Post'));
 const speak=tree=>find(tree,n=>n.props?.['aria-label']==='Speak'||n.props?.['aria-label']==='Stop recording');
 const form=tree=>find(tree,n=>n.type==='form');
 return{render,posted,requests,worklets,speak,post,form,done,fail,setDrink(tree){find(tree,n=>n.props?.['aria-label']==='Drink description').props.onChange({target:{value:'Typed drink'}});},settle:()=>new Promise(resolve=>setImmediate(resolve)),reject};
}
for(const component of ['LightComposer','IntakeSheet'])for(const desktop of component==='LightComposer'?[false,true]:[false])test(`${component} ${desktop?'desktop':'phone'} preserves speech through recording and transcription, then submits combined text`,async()=>{
 const h=harness(component,{desktop});let tree=h.render();if(component==='IntakeSheet'){h.setDrink(tree);tree=h.render();}
 // Keep the original callback to exercise submit before React has committed disabled.
 const earlySubmit=component==='IntakeSheet'?()=>h.form(tree).props.onSubmit({preventDefault(){}}):h.post(tree).props.onClick;
 h.speak(tree).props.onClick();earlySubmit();assert.deepEqual(h.posted,[],'same-event submit is refused');await h.settle();
 tree=h.render();assert.equal(h.post(tree).props.disabled,true);assert.equal(h.speak(tree).props.disabled,false,'Stop stays enabled');
 h.post(tree).props.onClick?.();if(component==='IntakeSheet')h.form(tree).props.onSubmit({preventDefault(){}});assert.equal(h.posted.length,0);
 h.speak(tree).props.onClick();const sent=h.worklets[0].port.onmessage({data:{samples:new Float32Array([.1]),stopped:true}});await h.settle();tree=h.render();assert.equal(h.requests.length,1);assert.equal(h.post(tree).props.disabled,true);assert.equal(h.requests[0].signal.aborted,false);
 h.done(Response.json({transcript:'spoken words'}));await sent;tree=h.render();assert.equal(h.post(tree).props.disabled,false);
 if(component==='IntakeSheet')await h.form(tree).props.onSubmit({preventDefault(){}});else h.post(tree).props.onClick();await h.settle();
 assert.deepEqual(h.posted,[component==='IntakeSheet'?'Typed drink spoken words':'Typed meal spoken words']);
});
test('a failed transcription releases the guard and preserves typed text',async()=>{
 const h=harness('LightComposer');let tree=h.render();h.speak(tree).props.onClick();await h.settle();tree=h.render();h.speak(tree).props.onClick();const sent=h.worklets[0].port.onmessage({data:{samples:new Float32Array([.1]),stopped:true}});h.fail(Error('fixture failure'));await sent;tree=h.render();assert.equal(h.post(tree).props.disabled,false);h.post(tree).props.onClick();assert.deepEqual(h.posted,['Typed meal']);
});

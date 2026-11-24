import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {captureEnglish} from './fixtures/capture-wording.mjs';
import {createTranslator} from 'next-intl';

function mount(desktop=false,locale='en'){
 const translate=locale==='en'?captureEnglish:createTranslator({locale,messages:JSON.parse(readFileSync(new URL('../messages/ja.json',import.meta.url),'utf8')),namespace:'capture',onError(e){throw e;}});
 const source=readFileSync(new URL('../src/components/LightComposer.tsx',import.meta.url),'utf8');
 const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
 let cursor=0,active=false,identity='photo-1',voiceActive=false;
 const slots=[],exports={},jsx=(type,props)=>({type,props});
 vm.runInNewContext(code,{exports,Date,Intl,Array,requestAnimationFrame:()=>1,cancelAnimationFrame(){},setTimeout:()=>1,clearTimeout(){},require(name){
  if(name==='react')return{useState(initial){const i=cursor++;if(!(i in slots))slots[i]=initial;return[slots[i],value=>{slots[i]=typeof value==='function'?value(slots[i]):value;}];},useRef(initial){const i=cursor++;return slots[i]??={current:initial};},useEffect(){cursor++;}};
  if(name==='next-intl')return{useTranslations:()=>translate,useLocale:()=>locale,useFormatter:()=>({dateTime:date=>date.toISOString()})};
  if(name==='react/jsx-runtime')return{jsx,jsxs:jsx};
  if(name==='@/lib/ui/use-desktop')return{useDesktop:()=>desktop};
  if(name==='./ComposerDrinks')return{useComposerDrinks:()=>({identity,active,saving:false,disabled:false,card:active?jsx('section',{'aria-label':'Drinks in this photo'}):null,post(){},button:'Post 2 drinks'})};
  if(name==='@/components/VoiceButton')return{default:'VoiceButton',useVoiceActivity:()=>({active:voiceActive,activeRef:{current:voiceActive}})};
  if(name==='@/components/PostHandle')return{usePostHandle:()=> 'test user'};
  if(name==='@/lib/posts/eaten-at')return{toLocalInput:()=> ''};
  return new Proxy({},{get:(_,key)=>key==='__esModule'?true:key});
 }});
 const props={shots:[{previewUrl:'blob:test'}],caption:'A drink while typing',setCaption(value){props.caption=value;},index:0,notEaten:[],when:null,pending:0};
 const render=()=>{cursor=0;return exports.default(props);};
 const nodes=(tree,path='root')=>!tree?[]:Array.isArray(tree)?tree.flatMap((n,i)=>nodes(n,path+'.'+i)):typeof tree==='object'?[{...tree,path},...nodes(tree.props?.children,path+'.children')]:[];
 return{render,nodes,props,detect(){active=true;},replace(){identity='photo-2';},voice(value){voiceActive=value;}};
}
for(const desktop of [false,true])test(`${desktop?'desktop':'phone'} drink arrival preserves the caption surface until an explicit review`,()=>{
 const h=mount(desktop),before=h.nodes(h.render()).find(n=>n.type==='textarea');
 assert.ok(before);h.detect();let tree=h.render(),nodes=h.nodes(tree);
 const after=nodes.find(n=>n.type==='textarea');
 assert.ok(after,'identification cannot replace the focused caption');
 assert.equal(after.path,before.path,'same React position and type preserve the mounted input');
 assert.equal(after.props.value,before.props.value);
 assert.equal(nodes.some(n=>n.props?.['aria-label']==='Drinks in this photo'),false);
 const review=nodes.find(n=>n.type==='button'&&n.props.children==='Review drinks');assert.ok(review);
 review.props.onClick();nodes=h.nodes(h.render());
 assert.ok(nodes.find(n=>n.props?.['aria-label']==='Drinks in this photo'));
 if(!desktop){nodes.find(n=>n.type==='button'&&n.props.children==='Post details').props.onClick();nodes=h.nodes(h.render());assert.equal(nodes.find(n=>n.type==='textarea').props.value,before.props.value);}
});
test('a new photo identity never inherits an open drink review',()=>{
 const h=mount();h.detect();h.nodes(h.render()).find(n=>n.props?.children==='Review drinks').props.onClick();
 assert.ok(h.nodes(h.render()).find(n=>n.props?.['aria-label']==='Drinks in this photo'));
 h.replace();const nodes=h.nodes(h.render());assert.ok(nodes.find(n=>n.type==='textarea'));assert.equal(nodes.some(n=>n.props?.['aria-label']==='Drinks in this photo'),false);
});
test('drink arrival during speech keeps the caption and review cannot interrupt the recorder',()=>{
 const h=mount();h.voice(true);h.detect();const nodes=h.nodes(h.render());
 assert.ok(nodes.find(n=>n.type==='textarea'));assert.equal(nodes.find(n=>n.props?.children==='Review drinks')?.props.disabled,true);
 h.voice(false);assert.ok(h.nodes(h.render()).find(n=>n.type==='textarea'),'finishing speech must not open the review automatically');
});
test('pressing Review drinks retains caption focus until the explicit click opens the result',()=>{
 const h=mount();h.detect();const review=h.nodes(h.render()).find(n=>n.props?.children==='Review drinks');
 let prevented=false;
 assert.equal(typeof review.props.onPointerDown,'function','blur must not move the button between pointer down and click');
 review.props.onPointerDown({preventDefault(){prevented=true;}});
 assert.equal(prevented,true);
 review.props.onClick();assert.ok(h.nodes(h.render()).find(n=>n.props?.['aria-label']==='Drinks in this photo'));
});

for(const locale of ['en','ja'])test(locale+' three-photo heading renders the whole translated message',()=>{
 const h=mount(false,locale);h.props.shots=[1,2,3].map(n=>({previewUrl:'blob:'+n}));
 const headings=h.nodes(h.render()).filter(n=>n.type==='h2').map(n=>n.props.children);
 assert.ok(headings.includes(locale==='en'?'Photos 1, 2':'写真 1, 2'));
 assert.ok(headings.includes(locale==='en'?'Photo 3':'写真 3'));
});

import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import ts from 'typescript';import{readFileSync}from'node:fs';import{execFileSync}from'node:child_process';
import{barcodePhotoOutcome,barcodeDecoderOutcome}from'../src/lib/media/barcode-photo.ts';
const revision=process.env.MFA_BARCODE_SOURCE_REV;if(revision)assert.match(revision,/^[a-f0-9]{40}$/);
const read=path=>revision?execFileSync('git',['show',revision+':'+path],{encoding:'utf8'}):readFileSync(new URL('../'+path,import.meta.url),'utf8');
const flush=async()=>{for(let i=0;i<5;i++)await new Promise(r=>setImmediate(r));};
const capture=read('src/components/CaptureSheet.tsx'),ast=ts.createSourceFile('CaptureSheet.tsx',capture,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
function initializer(name,required=true){let found;function visit(n){if(ts.isVariableDeclaration(n)&&ts.isIdentifier(n.name)&&n.name.text===name)found=n.initializer?.getText(ast);ts.forEachChild(n,visit);}visit(ast);if(required)assert.ok(found,'actual '+name+' handler exists');return found;}
function effect(preload){let found;function visit(n){if(ts.isCallExpression(n)&&ts.isIdentifier(n.expression)&&n.expression.text==='useEffect'){const s=n.arguments[0]?.getText(ast);if(s?.includes(preload?'loadBarcodeDecoder':'window.setInterval')&&(!preload||!s.includes('window.setInterval')))found=s;}ts.forEachChild(n,visit);}visit(ast);assert.ok(found,'actual scanner effect');return found;}
function fixture(outcomes){
 let requests=0,decodes=0,nextTimer=0;const scanner={},exports={},intervals=new Map(),found=[],errors=[],state={current:'idle'};class Video{videoWidth=0;videoHeight=0;}
 const transpile=code=>ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 // The real loader/module cache and real capture handlers run. Only the import
 // boundary and zero-size video/image transport are scripted, never the policy.
 vm.runInNewContext(transpile(read('src/components/BarcodeScanner.tsx')),{exports:scanner,HTMLVideoElement:Video,require:n=>{if(n==='@/lib/fdc/gtin')return{expandUpcE:v=>v};assert.equal(n,'@zxing/library');const action=outcomes[requests++]??'fail';if(action==='fail')throw Error('Scripted decoder chunk failure');if(typeof action==='function')return action();return{};}});
 const shotsRef={current:[]},environment={exports,File,Array,Promise,Event,MAX_SHOTS:8,useEffectEvent:fn=>fn,URL:{createObjectURL:()=> 'blob:synthetic',revokeObjectURL(){}},
 mode:'barcode',stream:{},decoderFailedRef:{current:null},postingRef:{current:false},mountedRef:{current:true},videoRef:{current:new Video()},scanBusy:{current:false},rejectedCode:{current:null},lookupRef:{current:0},barcodeStateRef:state,
 packOperationRef:{current:null},packPhotoRef:{current:null},selectedPhotoRef:{current:false},pendingFilesRef:{current:[]},operationRef:{current:null},shotsRef,
 forPost:null,labelForCode:null,caption:'',when:null,locationEnabled:false,location:null,notEaten:[],saveAsMeal:false,
 t:key=>JSON.parse(readFileSync(new URL('../messages/en.json',import.meta.url))).capture[key],setBarcodeState:value=>state.current=value,setError:value=>errors.push(value),
 setComposer(){},setProduct(){},setPackPhoto(){},setLabelState(){},setLabelReading(){},setLabelForCode(){},setPendingCount(){},setCameraBusy(){},setOperationId(){},setShots(){},setPhotoIndex(){},
 window:{setInterval:fn=>{intervals.set(++nextTimer,fn);return nextTimer;},clearInterval:id=>intervals.delete(id),dispatchEvent(){}},requestAnimationFrame:fn=>fn(),
 loadBarcodeDecoder:options=>scanner.loadBarcodeDecoder(options),decodeBarcode:async source=>{decodes++;return scanner.decodeBarcode(source);},barcodePhotoOutcome,barcodeDecoderOutcome,
 uploadManager:{stage:()=> 'synthetic-operation'},decodeBarcodeFile:async()=>{await scanner.loadBarcodeDecoder();return'9591234567892';},findBarcode:code=>{found.push(code);state.current='looking';},removeShot:index=>shotsRef.current.splice(index,1),
 };
 vm.runInNewContext(transpile('exports.dismiss='+initializer('dismissBarcode')),environment);environment.dismissBarcode=exports.dismiss;
 const event=initializer('showDecoderLoadFailure',false);if(event){vm.runInNewContext(transpile('exports.loadFailure='+event),environment);environment.showDecoderLoadFailure=exports.loadFailure;}
 vm.runInNewContext(transpile('exports.back='+initializer('backToBarcodeCamera')+';exports.add='+initializer('addFiles')+';exports.preload='+effect(true)+';exports.live='+effect(false)),environment);
 // Both actual visible dismissal controls must reach the tested retry handler.
 assert.match(capture,/aria-label=\{t\('dismiss_scanned_product'\)\}[^>]*onClick=\{backToBarcodeCamera\}/);
 assert.match(capture,/onClick=\{backToBarcodeCamera\}[^>]*>\{t\('back_to_camera'\)\}/);
 let preloadCleanup,liveCleanup;
 return{environment,state,found,errors,get requests(){return requests;},get decodes(){return decodes;},rawLoad:()=>scanner.loadBarcodeDecoder(),mount(preload=true){if(preload)preloadCleanup=exports.preload();liveCleanup=exports.live();},
 back:()=>exports.back(),x:()=>exports.back(),add:()=>exports.add([new File(['synthetic'],'barcode.png',{type:'image/png'})]),tick:async()=>{for(const fn of [...intervals.values()])await fn();},
 mode(next){preloadCleanup?.();liveCleanup?.();exports.dismiss();environment.mode=next;preloadCleanup=exports.preload();liveCleanup=exports.live();}};
}
function deferred(){let reject,resolve;const promise=new Promise((ok,r)=>{resolve=ok;reject=r;});return{load:()=>promise,resolve:()=>resolve({}),reject:()=>reject(Error('Late decoder chunk failure'))};}
const rows=[
 {name:'mode preload fast failure',actions:['fail'],prepare:async f=>{f.mount();await flush();}},
 {name:'explicit photo fast failure',actions:['fail','fail'],prepare:async f=>{f.mount();await flush();await f.add();await flush();}},
 {name:'photo timeout then late failure',pending:true,prepare:async(f,t,d)=>{f.mount();await flush();await f.add();await flush();t.mock.timers.tick(10000);await flush();assert.equal(f.state.current,'decoderSlow');d.reject();await flush();}},
 {name:'X during photo loading then late failure',pending:true,prepare:async(f,_t,d)=>{f.mount();await flush();await f.add();await flush();assert.equal(f.state.current,'decoderLoading');f.x();d.reject();await flush();}},
 {name:'Back during photo loading then late failure',pending:true,prepare:async(f,_t,d)=>{f.mount();await flush();await f.add();await flush();f.back();d.reject();await flush();}},
 {name:'explicit Back fast failure',actions:['fail','fail'],prepare:async f=>{f.mount();await flush();f.back();await flush();}},
 {name:'Back timeout then late failure',pending:true,prepare:async(f,t,d)=>{f.mount();await flush();f.back();await flush();t.mock.timers.tick(10000);await flush();assert.equal(f.state.current,'decoderSlow');d.reject();await flush();}},
 {name:'live interval first observes failure',actions:['fail'],prepare:async f=>{f.mount(false);await f.tick();await flush();}},
];
for(const row of rows)test('no automatic decoder retry: '+row.name,async t=>{
 t.mock.timers.enable({apis:['setTimeout']});const d=row.pending?deferred():null,f=fixture(row.pending?['fail',d.load]:row.actions);await row.prepare(f,t,d);const attempts=f.requests;
 for(let tick=0;tick<100;tick++){t.mock.timers.tick(300);await f.tick();}await flush();assert.equal(f.requests,attempts,'30 s/100 live ticks cannot start a new import');
 assert.ok(['error','decoderSlow'].includes(f.state.current),'failure/timeout stays visible, never idle Looking');if(f.state.current==='error')assert.equal(f.errors.at(-1),'The scanner could not be loaded. Choose the photo again.');
 await assert.rejects(f.rawLoad());assert.equal(f.requests,attempts,'default loader also retains the failure, independently of caller latch');
});
for(const action of['Back','photo','leave and re-enter Barcode'])test('one explicit decoder retry: '+action,async()=>{
 const f=fixture(['fail','ok']);f.mount();await flush();assert.equal(f.requests,1);assert.equal(f.state.current,'error');
 if(action==='Back')f.back();else if(action==='photo')await f.add();else{f.mode('text');await flush();assert.equal(f.requests,1);f.mode('barcode');}await flush();assert.equal(f.requests,2,'exactly one import per person action');
 if(action==='photo')assert.deepEqual(f.found,['9591234567892']);else{assert.equal(f.state.current,'idle');for(let i=0;i<5;i++)await f.tick();assert.equal(f.decodes,5,'actual video decoder resumes');}assert.equal(f.requests,2);
});

for(const scenario of ['Back shares a still-pending first load','late live-load success waits for Back'])test('pending decoder cache: '+scenario,async t=>{
 t.mock.timers.enable({apis:['setTimeout']});const d=deferred(),f=fixture([d.load]);f.mount(false);
 const polling=f.tick();await flush();assert.equal(f.requests,1);t.mock.timers.tick(10000);await polling;await flush();assert.equal(f.state.current,'decoderSlow');
 if(scenario==='Back shares a still-pending first load'){
  f.back();await flush();assert.equal(f.state.current,'decoderLoading');assert.equal(f.requests,1,'retry:true shares the pending import');d.resolve();await flush();
 }else{
  d.resolve();await flush();for(let i=0;i<5;i++)await f.tick();assert.equal(f.state.current,'decoderSlow','late success cannot resume scanning without a person');assert.equal(f.decodes,0);assert.equal(f.requests,1);
  f.back();await flush();
 }
 assert.equal(f.state.current,'idle');for(let i=0;i<5;i++)await f.tick();assert.equal(f.decodes,5,'scanning resumes with the cached success');assert.equal(f.requests,1,'Back reuses the same import');
});

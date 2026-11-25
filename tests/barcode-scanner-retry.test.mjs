import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import ts from 'typescript';import{readFileSync}from'node:fs';
import{barcodePhotoOutcome,barcodeDecoderOutcome}from'../src/lib/media/barcode-photo.ts';
const flush=async()=>{for(let i=0;i<5;i++)await new Promise(r=>setImmediate(r));};
const capture=readFileSync(new URL('../src/components/CaptureSheet.tsx',import.meta.url),'utf8'),ast=ts.createSourceFile('CaptureSheet.tsx',capture,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
function initializer(name){let found;function visit(n){if(ts.isVariableDeclaration(n)&&ts.isIdentifier(n.name)&&n.name.text===name)found=n.initializer?.getText(ast);ts.forEachChild(n,visit);}visit(ast);assert.ok(found,'actual '+name+' handler exists');return found;}
function effect(term){let found;function visit(n){if(ts.isCallExpression(n)&&ts.isIdentifier(n.expression)&&n.expression.text==='useEffect'&&n.arguments[0]?.getText(ast).includes(term))found=n.arguments[0].getText(ast);ts.forEachChild(n,visit);}visit(ast);assert.ok(found,'actual scanner effect '+term);return found;}
function fixture(outcomes){
 let requests=0,decodes=0;const scanner={},exports={},intervals=[],found=[],errors=[],state={current:'idle'};class Video{videoWidth=0;videoHeight=0;}
 const transpile=code=>ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 // Execute the real cached dynamic-import loader. Only the network/module
 // boundary is scripted; the caller's preload, polling and retry handlers run.
 vm.runInNewContext(transpile(readFileSync(new URL('../src/components/BarcodeScanner.tsx',import.meta.url),'utf8')),{exports:scanner,HTMLVideoElement:Video,require:n=>{if(n==='@/lib/fdc/gtin')return{expandUpcE:v=>v};assert.equal(n,'@zxing/library');const action=outcomes[requests++];if(action==='fail')throw Error('Scripted decoder chunk failure');if(action==='pending')return new Promise(()=>{});if(typeof action==='function')return action();return{};}});
 const shotsRef={current:[]},environment={exports,File,Array,Promise,Event,MAX_SHOTS:8,URL:{createObjectURL:()=> 'blob:synthetic',revokeObjectURL(){}},
 mode:'barcode',stream:{},decoderFailedRef:{current:false},postingRef:{current:false},mountedRef:{current:true},videoRef:{current:new Video()},scanBusy:{current:false},rejectedCode:{current:null},lookupRef:{current:0},barcodeStateRef:state,
 packOperationRef:{current:null},packPhotoRef:{current:null},selectedPhotoRef:{current:false},pendingFilesRef:{current:[]},operationRef:{current:null},shotsRef,
 forPost:null,labelForCode:null,caption:'',when:null,locationEnabled:false,location:null,notEaten:[],saveAsMeal:false,
 t:key=>JSON.parse(readFileSync(new URL('../messages/en.json',import.meta.url))).capture[key],setBarcodeState:value=>state.current=value,setError:value=>errors.push(value),
 setComposer(){},setProduct(){},setPackPhoto(){},setLabelState(){},setLabelReading(){},setLabelForCode(){},setPendingCount(){},setCameraBusy(){},setOperationId(){},setShots(){},setPhotoIndex(){},
 window:{setInterval:fn=>{intervals.push(fn);return intervals.length;},clearInterval(){},dispatchEvent(){}},requestAnimationFrame:fn=>fn(),
 loadBarcodeDecoder:()=>scanner.loadBarcodeDecoder(),decodeBarcode:async source=>{decodes++;return scanner.decodeBarcode(source);},barcodePhotoOutcome,barcodeDecoderOutcome,
 uploadManager:{stage:()=> 'synthetic-operation'},decodeBarcodeFile:async()=>{await scanner.loadBarcodeDecoder();return'9591234567892';},findBarcode:code=>{found.push(code);state.current='looking';},removeShot:index=>shotsRef.current.splice(index,1),
 };
 vm.runInNewContext(transpile('exports.dismiss='+initializer('dismissBarcode')),environment);environment.dismissBarcode=exports.dismiss;
 vm.runInNewContext(transpile('exports.back='+initializer('backToBarcodeCamera')+';exports.add='+initializer('addFiles')+';exports.preload='+effect('void loadBarcodeDecoder().catch')+';exports.live='+effect('window.setInterval')),environment);
 return{environment,state,found,errors,get requests(){return requests;},get decodes(){return decodes;},mount(){exports.preload();exports.live();},back:()=>exports.back(),add:()=>exports.add([new File(['synthetic'],'barcode.png',{type:'image/png'})]),frames:async()=>{for(let i=0;i<5;i++)await intervals[0]();}};
}
test('BarcodeScanner failure never retries from live ticks; explicit Back failure stays visible, then photo choice reloads once',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});const f=fixture(['fail','fail','ok']);f.mount();await flush();assert.equal(f.requests,1);assert.equal(f.state.current,'error');await f.frames();t.mock.timers.tick(30000);await flush();assert.equal(f.requests,1);assert.equal(f.decodes,0);
 f.back();await flush();assert.equal(f.requests,2);assert.equal(f.state.current,'error');assert.equal(f.errors.at(-1),'The scanner could not be loaded. Choose the photo again.');await f.frames();t.mock.timers.tick(30000);await flush();assert.equal(f.requests,2);assert.equal(f.decodes,0);
 await f.add();await flush();assert.equal(f.requests,3);assert.deepEqual(f.found,['9591234567892']);
});
test('a successful explicit Back retry releases the latch and actual live decoding resumes',async()=>{
 const f=fixture(['fail','ok']);f.mount();await flush();f.back();await flush();assert.equal(f.requests,2);assert.equal(f.environment.decoderFailedRef.current,false);assert.equal(f.state.current,'idle');await f.frames();assert.equal(f.decodes,5);assert.equal(f.requests,2);assert.equal(f.errors.at(-1),null);
});
test('explicit Back retry has the same 10-second load bound and does not silently restart polling',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});const f=fixture(['fail','pending']);f.mount();await flush();f.back();await flush();assert.equal(f.state.current,'decoderLoading');t.mock.timers.tick(10000);await flush();assert.equal(f.state.current,'decoderSlow');assert.equal(f.environment.decoderFailedRef.current,true);await f.frames();assert.equal(f.requests,2);assert.equal(f.decodes,0);
});

test('a photo load timeout stays latched after the import rejects; only an explicit Back starts one new load',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});let rejectImport;const f=fixture(['fail',()=>new Promise((_,reject)=>rejectImport=reject),'ok']);
 f.mount();await flush();assert.equal(f.requests,1);assert.equal(f.state.current,'error');
 await f.add();await flush();assert.equal(f.requests,2);assert.equal(f.state.current,'decoderLoading');t.mock.timers.tick(10000);await flush();assert.equal(f.state.current,'decoderSlow');
 rejectImport(Error('Late decoder download failure'));await flush();await f.frames();t.mock.timers.tick(30000);await flush();await f.frames();assert.equal(f.requests,2,'no new import after timeout, late rejection and ten live ticks');assert.equal(f.decodes,0);
 f.back();await flush();assert.equal(f.requests,3,'one new load only after the person taps Back');assert.equal(f.state.current,'idle');assert.equal(f.environment.decoderFailedRef.current,false);
});

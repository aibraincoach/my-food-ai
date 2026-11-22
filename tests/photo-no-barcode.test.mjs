import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const flush=async()=>{for(let i=0;i<6;i++)await new Promise(resolve=>setImmediate(resolve));};
function fixture(mode='photo',answer='9591234567892'){
 const source=readFileSync(new URL('../src/components/CaptureSheet.tsx',import.meta.url),'utf8');
 const start=source.indexOf('const addFiles = async'),end=source.indexOf('\n  const takePhoto',start);
 assert.ok(start>0&&end>start,'execute the actual photo queue');
 const code=ts.transpileModule(source.slice(start,end)+'\nexport {addFiles};',{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
 const file=new File(['synthetic EAN 9591234567892'],'ean-photo.jpg',{type:'image/jpeg'}),shotsRef={current:[]},pendingFilesRef={current:[]},operationRef={current:null},scanBusy={current:false};
 const seen={decoded:0,lookups:0,removed:0,composer:false,staged:null,errors:[],deadline:null,states:[]};const barcodeStateRef={current:'idle'},exports={};
 const environment={exports,File,Array,Promise,URL:{createObjectURL:()=> 'blob:ean-photo'},
  postingRef:{current:false},selectedPhotoRef:{current:false},pendingFilesRef,shotsRef,scanBusy,mountedRef:{current:true},operationRef,packOperationRef:{current:null},
  lookupRef:{current:0},packPhotoRef:{current:null},setProduct(){},setPackPhoto(){},setLabelState(){},setLabelReading(){},setLabelForCode(){},barcodeStateRef,setBarcodeState:value=>{barcodeStateRef.current=value;seen.states.push(value);},window:{dispatchEvent(){}},Event,mode,MAX_SHOTS:6,forPost:null,labelForCode:null,caption:'Keep this photo',when:null,locationEnabled:false,location:null,notEaten:[],saveAsMeal:false,
  setPendingCount(){},setCameraBusy(){},setOperationId(){},setShots(){},setPhotoIndex(){},setComposer:value=>{seen.composer=value;},setError:message=>seen.errors.push(message),
  uploadManager:{stage(files){seen.staged=files;return 'operation';}},
  decodeBarcodeFile:async file=>{seen.decoded++;if(typeof answer==='function')return answer(file);if(answer==='reject')throw Error('decoder failed');return answer==='pending'?new Promise(()=>{}):answer;},findBarcode:async()=>{seen.lookups++;environment.setBarcodeState('looking');},removeShot(index){seen.removed++;shotsRef.current.splice(index,1);},
  requestAnimationFrame:callback=>{callback();return 1;},setTimeout:callback=>{seen.deadline=callback;return 1;},clearTimeout(){},
 };
 vm.runInNewContext(code,environment);vm.runInNewContext(ts.transpileModule('exports.dismiss='+initializer('dismissBarcode'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,environment);return{dismiss:()=>exports.dismiss(),seen,file,shotsRef,scanBusy,environment,barcodeStateRef,add:files=>exports.addFiles(files)};
}

test('Photo retains a selected file even when a decoder would report its EAN',async()=>{
 const f=fixture();await f.add([f.file]);await flush();
 assert.equal(f.seen.decoded,0);assert.equal(f.seen.lookups,0);assert.equal(f.seen.removed,0);
 assert.equal(f.shotsRef.current[0].file,f.file);assert.equal(f.seen.staged[0],f.file);assert.equal(f.seen.composer,true);assert.deepEqual(f.seen.errors,[]);
});
test('Barcode still decodes a chosen EAN photo and finds its product',async()=>{
 const f=fixture('barcode');await f.add([f.file]);await flush();
 assert.equal(f.seen.decoded,1);assert.equal(f.seen.lookups,1);assert.equal(f.seen.removed,1);assert.equal(f.shotsRef.current.length,0);
});
test('a queued Photo file does not become a barcode pick after a mode change',async()=>{
 const f=fixture();f.scanBusy.current=true;await f.add([f.file]);f.environment.mode='barcode';f.scanBusy.current=false;await f.add([]);await flush();
 assert.equal(f.seen.decoded,0);assert.equal(f.seen.lookups,0);assert.equal(f.shotsRef.current[0].file,f.file);
});
test('a queued Barcode file keeps its pick-time intent after a mode change',async()=>{
 const f=fixture('barcode');f.scanBusy.current=true;await f.add([f.file]);f.environment.mode='photo';f.scanBusy.current=false;await f.add([]);await flush();
 assert.equal(f.seen.decoded,1);assert.equal(f.seen.lookups,1);
});
for(const answer of [null,'pending'])test(`Barcode ${answer===null?'no-code':'timeout'} shows unread and retains the file`,async()=>{
 const f=fixture('barcode',answer);await f.add([f.file]);await flush();if(answer==='pending'){assert.equal(typeof f.seen.deadline,'function');f.seen.deadline();await flush();}
 assert.equal(f.seen.decoded,1);assert.equal(f.seen.lookups,0);assert.equal(f.seen.removed,0);assert.equal(f.shotsRef.current[0].file,f.file);assert.deepEqual(f.seen.errors,[]);assert.equal(f.barcodeStateRef.current,'unread');
});

test('Barcode decoder rejection shows unread instead of being swallowed',async()=>{
 const f=fixture('barcode','reject');await f.add([f.file]);await flush();assert.equal(f.barcodeStateRef.current,'unread');assert.equal(f.shotsRef.current[0].file,f.file);assert.equal(f.seen.lookups,0);
});
test('a code-bearing file wins over a later null in the same pick',async()=>{
 let codeDone,emptyDone;const code=new Promise(r=>codeDone=r),empty=new Promise(r=>emptyDone=r);
 const f=fixture('barcode',file=>file.name==='with-code.jpg'?code:empty),withCode=new File(['code'],'with-code.jpg'),withoutCode=new File(['empty'],'without-code.jpg');
 await f.add([withCode,withoutCode]);await flush();codeDone('9591234567892');await flush();emptyDone(null);await flush();
 assert.equal(f.seen.lookups,1);assert.equal(f.barcodeStateRef.current,'looking');assert.ok(!f.seen.states.includes('unread'));assert.equal(f.shotsRef.current[0].file,withoutCode);
});
function initializer(name){
 const source=readFileSync(new URL('../src/components/CaptureSheet.tsx',import.meta.url),'utf8'),ast=ts.createSourceFile('CaptureSheet.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);let found;
 const visit=node=>{if(ts.isVariableDeclaration(node)&&ts.isIdentifier(node.name)&&node.name.text===name)found=node.initializer?.getText(ast);ts.forEachChild(node,visit);};visit(ast);assert.ok(found,'real '+name+' initializer');return found;
}
test('Barcode state setter updates its ref before React can render',()=>{
 const barcodeStateRef={current:'idle'},exports={};const code=ts.transpileModule('export const update='+initializer('setBarcodeState'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 vm.runInNewContext(code,{exports,useCallback:fn=>fn,barcodeStateRef,setBarcodeStateValue:value=>assert.equal(barcodeStateRef.current,value)});exports.update('looking');assert.equal(barcodeStateRef.current,'looking');
});
test('Back from unread restores camera mode while retaining the selected photo',()=>{
 const exports={},composer=[],barcodeStateRef={current:'unread'},shotsRef={current:[{file:'kept'}]};const code=ts.transpileModule('export const dismiss='+initializer('dismissBarcode'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 vm.runInNewContext(code,{exports,postingRef:{current:false},lookupRef:{current:0},packOperationRef:{current:null},packPhotoRef:{current:null},shotsRef,pendingFilesRef:{current:[]},selectedPhotoRef:{current:true},barcodeStateRef,setComposer:value=>composer.push(value),setProduct(){},setBarcodeState:value=>barcodeStateRef.current=value,setPackPhoto(){},setError(){},setLabelState(){},setLabelReading(){},setLabelForCode(){}});exports.dismiss();assert.deepEqual(composer,[false]);assert.equal(barcodeStateRef.current,'idle');assert.equal(shotsRef.current.length,1);
});

test('blank plus delayed EAN finds the product without first showing unread',async()=>{
 let finish;const delayed=new Promise(r=>finish=r),f=fixture('barcode',file=>file.name==='late-code.jpg'?delayed:null);
 await f.add([f.file,new File(['code'],'late-code.jpg')]);await flush();assert.equal(f.barcodeStateRef.current,'idle');finish('9591234567892');await flush();assert.equal(f.seen.lookups,1);assert.ok(!f.seen.states.includes('unread'));
});
test('two blank files show unread once when the pick is complete',async()=>{
 const f=fixture('barcode',null);await f.add([f.file,new File(['blank'],'blank.jpg')]);await flush();assert.deepEqual(f.seen.states,['unread']);assert.equal(f.shotsRef.current.length,2);
});
test('Back after a timed-out pick cannot be reopened by a late decode',async()=>{
 let finish;const delayed=new Promise(r=>finish=r),f=fixture('barcode',file=>file.name==='late-code.jpg'?delayed:null);
 await f.add([f.file,new File(['code'],'late-code.jpg')]);await flush();assert.equal(f.barcodeStateRef.current,'idle');f.seen.deadline();await flush();assert.equal(f.barcodeStateRef.current,'unread');f.dismiss();finish('9591234567892');await flush();assert.equal(f.seen.lookups,0);assert.equal(f.barcodeStateRef.current,'idle');assert.equal(f.shotsRef.current.length,2);
});

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
 const seen={decoded:0,lookups:0,removed:0,composer:false,staged:null,errors:[],deadline:null};const exports={};
 const environment={exports,File,Array,Promise,URL:{createObjectURL:()=> 'blob:ean-photo'},
  postingRef:{current:false},selectedPhotoRef:{current:false},pendingFilesRef,shotsRef,scanBusy,mountedRef:{current:true},operationRef,packOperationRef:{current:null},
  window:{dispatchEvent(){}},Event,mode,MAX_SHOTS:6,forPost:null,labelForCode:null,caption:'Keep this photo',when:null,locationEnabled:false,location:null,notEaten:[],saveAsMeal:false,
  setPendingCount(){},setCameraBusy(){},setOperationId(){},setShots(){},setPhotoIndex(){},setComposer:value=>{seen.composer=value;},setError:message=>seen.errors.push(message),
  uploadManager:{stage(files){seen.staged=files;return 'operation';}},
  decodeBarcodeFile:async()=>{seen.decoded++;return answer==='pending'?new Promise(()=>{}):answer;},findBarcode:async()=>{seen.lookups++;},removeShot(index){seen.removed++;shotsRef.current.splice(index,1);},
  requestAnimationFrame:callback=>{callback();return 1;},setTimeout:callback=>{seen.deadline=callback;return 1;},clearTimeout(){},
 };
 vm.runInNewContext(code,environment);return{seen,file,shotsRef,scanBusy,environment,add:files=>exports.addFiles(files)};
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
for(const answer of [null,'pending'])test(`existing Barcode ${answer===null?'no-code':'timeout'} outcome silently retains the file`,async()=>{
 const f=fixture('barcode',answer);await f.add([f.file]);await flush();if(answer==='pending'){assert.equal(typeof f.seen.deadline,'function');f.seen.deadline();await flush();}
 assert.equal(f.seen.decoded,1);assert.equal(f.seen.lookups,0);assert.equal(f.seen.removed,0);assert.equal(f.shotsRef.current[0].file,f.file);assert.deepEqual(f.seen.errors,[]);
});

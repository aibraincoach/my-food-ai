// Real canvas + IndexedDB measurement on deterministic synthetic images only.
import fs from'node:fs/promises';import assert from'node:assert/strict';import{execFileSync}from'node:child_process';import ts from'typescript';
const app=process.env.APP_URL,out=process.env.PHOTO_BYTES_OUT,label=process.env.CHECK_LABEL;
if(process.env.MFA_TEST_DISPOSABLE!=='1'||new URL(app).hostname!=='127.0.0.1'||!out||!['base','head'].includes(label))throw Error('Local synthetic byte proof only');
const read=async path=>label==='base'?execFileSync('git',['show','b23a52c71a7ee9d125af2d14df138c93a455e366:'+path],{encoding:'utf8'}):await fs.readFile(path,'utf8');
const modules={};for(const [name,path]of Object.entries({store:'src/lib/posts/upload-store.ts',encode:'src/lib/media/reencode.ts'}))modules[name]='data:text/javascript;base64,'+Buffer.from(ts.transpileModule(await read(path),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64');
const{chromium}=await import(process.env.MFA_PLAYWRIGHT_MODULE??'/tmp/mfa-f62-browser/node_modules/playwright/index.mjs');const browser=await chromium.launch({executablePath:process.env.TEST_CHROMIUM_EXECUTABLE??'/usr/bin/chromium-browser',args:['--no-sandbox']});const result={label,fixture:'deterministic synthetic canvas JPEG with a synthetic APP1 marker; not a phone measurement or the original issue fixture',rows:[],errors:[]};
try{
 for(const [width,height]of [[1280,854],[4032,2690]]){
  const c=await browser.newContext(),p=await c.newPage();p.on('pageerror',e=>result.errors.push(e.message));await p.goto(app);
  const row=await p.evaluate(async({modules,width,height})=>{
   const {uploadStore}=await import(modules.store),{reencodeShot}=await import(modules.encode);const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d');
   const pixels=ctx.createImageData(width,height);let seed=7391;for(let i=0;i<pixels.data.length;i+=4){seed=(seed*1664525+1013904223)>>>0;const noise=seed>>>24,x=(i/4)%width,y=Math.floor(i/4/width);pixels.data[i]=(x/width*160+noise*.25)|0;pixels.data[i+1]=(y/height*150+noise*.3)|0;pixels.data[i+2]=70+(noise>>2);pixels.data[i+3]=255;}ctx.putImageData(pixels,0,0);
   const jpeg=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.92)),source=new Uint8Array(await jpeg.arrayBuffer()),marker=new TextEncoder().encode('1292-synthetic-metadata-marker'),segment=new Uint8Array(marker.length+4);segment.set([255,225,0,marker.length+2]);segment.set(marker,4);const file=new File([source.slice(0,2),segment,source.slice(2)],'synthetic-'+width+'.jpg',{type:'image/jpeg',lastModified:17});
   const image=await reencodeShot(file);const original=new Uint8Array(await image.original.arrayBuffer()),feed=new Uint8Array(await image.feed.arrayBuffer());
   const binary=(value,seen=new Set())=>{if(value instanceof ArrayBuffer){if(seen.has(value))return 0;seen.add(value);return value.byteLength;}if(value&&typeof value==='object')return Object.values(value).reduce((n,v)=>n+binary(v,seen),0);return 0;};
   const originalRead=Blob.prototype.arrayBuffer,originalPut=IDBObjectStore.prototype.put;let reads=0,photoWrites=0,written=0;Blob.prototype.arrayBuffer=function(){reads++;return originalRead.call(this);};IDBObjectStore.prototype.put=function(value,...args){if(this.name==='photos')photoWrites++;written+=binary(value);return originalPut.call(this,value,...args);};
   const draft={operationId:'bytes-'+width,ownerId:'synthetic',createdAt:1,reservedAt:1,caption:'first',eatenAt:null,location:null,options:{},files:[file],snapshot:{id:'stage',images:[image],completed:[]},posted:false,state:'uploading',sent:0,total:file.size};
   try{
    await uploadStore.put(draft);
    const raw=await new Promise((resolve,reject)=>{const r=indexedDB.open('mfa-uploads');r.onerror=()=>reject(r.error);r.onsuccess=()=>{const db=r.result,names=[...db.objectStoreNames],tx=db.transaction(names),data={version:db.version};for(const name of names){const q=tx.objectStore(name).getAll();q.onsuccess=()=>data[name]=q.result;}tx.oncomplete=()=>{db.close();resolve(data);};};});
    const storedBytes=binary(raw),firstReads=reads,firstPhotoWrites=photoWrites;reads=0;written=0;photoWrites=0;draft.caption='caption changed';draft.sent=3;await uploadStore.put(draft);
    const storedMarker=JSON.stringify(raw).includes('1292-synthetic-metadata-marker')||Object.values(raw).some(rows=>Array.isArray(rows)&&rows.some(v=>JSON.stringify(v).includes('1292-synthetic-metadata-marker'))); // ArrayBuffers are checked separately below.
    const buffers=[];const collect=v=>{if(v instanceof ArrayBuffer)buffers.push(new Uint8Array(v));else if(v&&typeof v==='object')Object.values(v).forEach(collect);};collect(raw);
    const hasMarker=buffers.some(bytes=>new TextDecoder().decode(bytes).includes('1292-synthetic-metadata-marker'))||storedMarker;
    return{width,height,input:file.size,encodedOriginal:image.original.size,encodedFeed:image.feed.size,copiesIdentical:original.length===feed.length&&original.every((n,i)=>n===feed[i]),sameBlob:image.original===image.feed,storedBytes,expectedBytes:image.original.size+(width>1920?image.feed.size:0),metadataBytesWritten:written,metadataBlobReads:reads,metadataPhotoWrites:photoWrites,firstBlobReads:firstReads,firstPhotoWrites,version:raw.version,sourceMarkerRetained:hasMarker,desiredPass:storedBytes===image.original.size+(width>1920?image.feed.size:0)&&written===0&&reads===0&&!hasMarker};
   }finally{Blob.prototype.arrayBuffer=originalRead;IDBObjectStore.prototype.put=originalPut;await uploadStore.clear();}
  },{modules,width,height});result.rows.push(row);await c.close();
 }
 assert.deepEqual(result.errors,[]);for(const row of result.rows)assert.equal(row.desiredPass,label==='head',label+' byte footprint classification');result.pass=true;
}catch(e){result.pass=false;result.failure=e.stack??e.message;process.exitCode=1;}finally{await browser.close();await fs.mkdir(out,{recursive:true});await fs.writeFile(out+'/bytes.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));}

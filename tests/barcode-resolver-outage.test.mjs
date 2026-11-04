import test from 'node:test';
import assert from 'node:assert/strict';
process.env.NEXT_PUBLIC_SUPABASE_URL ||= 'http://127.0.0.1:54321';
process.env.SUPABASE_SECRET_KEY ||= 'offline';
process.env.FDC_API_KEY ||= 'offline';
const {resolveProduct}=await import('../src/lib/fdc/barcode-resolver.ts');
test('provider outage rejects incomplete labels but a complete own label still makes a card',async()=>{
 const original=globalThis.fetch;
 let ownRow={source:'label',per_100:{calories:100},name:null,serving_unit:'g'};
 globalThis.fetch=async(input)=>{const url=new URL(input);if(url.pathname.endsWith('/rest/v1/barcode_corrections'))return Response.json(ownRow);if(url.pathname.endsWith('/rest/v1/rpc/barcode_shared_name'))return Response.json(null);return new Response(null,{status:500});};
 try{await assert.rejects(()=>resolveProduct('7622300761363','user-1'));ownRow={...ownRow,name:'Oreo',per_100:{calories:null,protein_g:null,carbs_g:null,fat_g:null,fibre_g:null,sugar_g:null,sodium_mg:null}};await assert.rejects(()=>resolveProduct('7622300761363','user-1'));ownRow={...ownRow,per_100:{calories:0}};const result=await resolveProduct('7622300761363','user-1');assert.equal(result.name,'Oreo');assert.equal(result.source,'own');}
 finally{globalThis.fetch=original;}
});

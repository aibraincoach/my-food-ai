import test from'node:test';import assert from'node:assert/strict';
import {parseItemEdit} from'../src/lib/posts/items.ts';
import {parseBarcodeCorrection} from'../src/lib/posts/barcode-correction.ts';
import {readCopyOperation,copyOperation} from'../src/lib/posts/copy-operation.ts';
import {readDrinkReceipt} from'../src/lib/intake/drink-operation.ts';
import {reserveUpload} from'../src/lib/posts/upload-draft.ts';
import {captureEnglish} from'./fixtures/capture-wording.mjs';
const id='00000000-0000-4000-8000-000000000001';
const shown=e=>captureEnglish(e.failure.code,e.failure.values);
test('item validation keeps each specific English sentence and its numeric bounds',()=>{
 for(const [body,line]of[
  [null,'An item edit is required.'],
  [{action:'add',portion_unit:'kg'},'Invalid portion unit.'],
  [{action:'add',portion_unit:'g',portion_amount:100001},'Enter an amount between 0 and 100000.'],
  [{action:'other'},'Invalid item action.'],
  [{action:'rename'},'An item ID is required.'],
  [{action:'add',item_id:id},'A new item cannot replace an existing ID.'],
  [{action:'add',name:'x'.repeat(161)},'Enter a name up to 160 characters.'],
  [{action:'add'},'A name is required.'],
  [{action:'add',name:'rice',portion_grams:100001},'Enter a portion between 0 and 100000 grams.'],
  [{action:'add',name:'rice'},'A portion in grams is required.'],
  [{action:'add',name:'rice',portion_grams:1,fdc_selection:{}},'Invalid food selection.'],
  [{action:'add',name:'rice',portion_grams:1,box:{}},'A valid box can be supplied for a new item only.'],
 ])assert.throws(()=>parseItemEdit(body),e=>shown(e)===line,line);
});
test('barcode validation keeps its choices, amount and nutrition messages',()=>{
 for(const[body,line]of[
  [null,'Enter the product details.'],[{name:'x'.repeat(81)},'Enter a name up to 80 characters.'],
  [{name:'rice',pack_amount:0},'Enter a valid pack and serving amount.'],[{name:'rice',pack_unit:'kg'},'Choose grams or millilitres.'],
  [{name:'rice',pack_amount:10},"Choose the amount's unit."],[{name:'rice',per_100:[]},'Enter valid nutrition values.'],[{name:'rice',per_100:{calories:-1}},'Nutrition must be a non-negative number.'],
 ])assert.throws(()=>parseBarcodeCorrection(body),e=>shown(e)===line,line);
});
test('copy ownership/operation refusals keep status and original English',async()=>{
 for(const[body,status,line]of[
  [{owner_id:'other'},403,'Sign-in changed. The selection belongs to its original account.'],
  [{owner_id:id,operation_id:'bad'},400,'Invalid copy operation.'],[{operation_id:id},403,'The copy owner is required.'],
 ])assert.throws(()=>readCopyOperation(body,id),e=>e.status===status&&shown(e)===line,line);
 for(const[code,status,line]of[
  ['PT409',409,'The copy selection changed. Start a new copy.'],['PT410',410,'This pending copy was removed.'],['42501',404,'Meal not found.'],['22023',400,'Choose a valid time eaten.'],['other',503,'The copy could not be confirmed. Your selection is kept.'],
 ])await assert.rejects(copyOperation({rpc:async()=>({data:null,error:{code}})},id,id,false,'2026-11-01T12:00:00Z'),e=>e.status===status&&shown(e)===line,line);
});
test('reservation refusals preserve expiry status and kept-photo promises',async()=>{
 for(const[message,status,line]of[
  ['expired',410,'The upload draft expired. Your photos were kept; try again.'],['refused',409,'The post draft could not be reserved. Your photos were kept; try again.'],
 ])await assert.rejects(reserveUpload({rpc:async()=>({data:null,error:{message}})},null,id,{operationId:id}),e=>e.status===status&&shown(e)===line);
});
test('drink receipt failure responses carry a code with unchanged English, never raw error text',async()=>{
 const base={user_id:id,kind:'tile',request_key:'key',post_id:null,cancelled:false};
 for(const[data,error,status,line]of[
  [null,{},503,'The drink operation could not be confirmed. Your selection is kept.'],
  [{...base,user_id:'other'},null,404,'Drink operation not found.'],[{...base,kind:'photo'},null,409,'This drink intent changed.'],
  [{...base,cancelled:true},null,410,'This pending drink was removed.'],[{...base,request_key:'other'},null,409,'This drink selection changed. Start a new drink post.'],
  [base,null,410,'This drink post was removed.'],
 ]){
  const chain={select(){return this},eq(){return this},maybeSingle:async()=>({data,error})};const result=await readDrinkReceipt({from:()=>chain},id,id,'key','tile');
  assert.equal(result.status,status);assert.equal(captureEnglish(result.message_code),line);assert.equal(Object.hasOwn(result,'error'),false);
 }
});

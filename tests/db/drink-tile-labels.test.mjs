// npm run test:db (apply migration 0037 on a disposable database first).
import test from 'node:test';
import assert from 'node:assert/strict';
import {admin,user,checked} from './helpers.mjs';
import {tsImport} from 'tsx/esm/api';
const {parseDrinkInput}=await tsImport('../../src/lib/intake/post-drink.ts',import.meta.url);

const nutrition = caffeine => ({calories:0,protein_g:0,carbs_g:0,fat_g:0,fibre_g:0,sugar_g:0,sodium_mg:0,micronutrients:[{nutrientId:1057,value:caffeine,unitName:'MG',basis:'portion'}]});
const args = (owner,input) => ({p_user_id:owner,p_eaten_at:new Date().toISOString(),p_kind:input.kind,p_ml:input.ml,p_label:input.label,p_caffeine_mg:input.caffeineMg,p_nutrition:nutrition(input.caffeineMg)});

test('all six server drink tiles and legacy Water commit matching posts and intake rows atomically',async()=>{
 const db=admin(),one=await user(1),two=await user(2),ids=[];
 try{
  for(const input of [...Array.from({length:6},(_,tile)=>parseDrinkInput({tile})),parseDrinkInput({kind:'water',ml:330})]){
   const id=checked(await db.rpc('create_drink_post',args(one.user.id,input)));ids.push(id);
   const post=checked(await db.from('posts').select('id,user_id,status,caption').eq('id',id).single());
   assert.equal(post.user_id,one.user.id);assert.equal(post.status,'ready');assert.equal(post.caption,input.label);
   const intake=checked(await db.from('intake_logs').select('user_id,kind,ml,amount,label').eq('post_id',id).single());
   assert.deepEqual(intake,{user_id:one.user.id,kind:input.kind,ml:input.ml,amount:input.kind==='water'?input.ml:input.caffeineMg,label:input.label});
   const items=checked(await db.from('post_items').select('id').eq('post_id',id));assert.equal(items.length,1);
   const n=checked(await db.from('item_nutrition').select('micronutrients').eq('post_item_id',items[0].id).single());
   assert.equal(n.micronutrients.find(row=>row.nutrientId===1057).value,input.caffeineMg);
   assert.equal(checked(await one.client.from('posts').select('id').eq('id',id)).length,1);
   assert.deepEqual(checked(await two.client.from('posts').select('id').eq('id',id)),[]);
   assert.deepEqual(checked(await two.client.from('intake_logs').select('id').eq('post_id',id)),[]);
  }
 }finally{if(ids.length)checked(await db.from('posts').delete().in('id',ids));}
});

test('water guard rejects arbitrary or null labels, caffeine and out-of-bounds inputs before any write',async()=>{
 const db=admin(),one=await user(1);const good=args(one.user.id,parseDrinkInput({kind:'water',ml:330}));
 const beforePosts=checked(await db.from('posts').select('id').eq('user_id',one.user.id));
 const beforeIntake=checked(await db.from('intake_logs').select('id').eq('user_id',one.user.id));
 for(const change of [{p_label:null},{p_label:'Water, bucket'},{p_label:'water'},{p_label:''},{p_label:'Coffee, cup'},{p_caffeine_mg:1},{p_caffeine_mg:null},{p_ml:0},{p_ml:5001},{p_ml:null},{p_kind:null},{p_kind:'juice'}]){
  const result=await db.rpc('create_drink_post',{...good,...change});assert.equal(result.error?.code,'22023',JSON.stringify(change));
 }
 assert.deepEqual(checked(await db.from('posts').select('id').eq('user_id',one.user.id)),beforePosts);
 assert.deepEqual(checked(await db.from('intake_logs').select('id').eq('user_id',one.user.id)),beforeIntake);
 const forbidden=await one.client.rpc('create_drink_post',good);assert.equal(forbidden.error?.code,'42501');
});

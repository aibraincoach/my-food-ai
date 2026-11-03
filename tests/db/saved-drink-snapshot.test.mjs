import test from 'node:test';
import assert from 'node:assert/strict';
import {admin,user,checked} from './helpers.mjs';
test('saved Coffee preserves original intake after source deletion and rejects another owner',async()=>{
 for(const endpoint of [process.env.NEXT_PUBLIC_SUPABASE_URL])assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(endpoint).hostname),'Disposable local stack required.');
 const db=admin(),owner=await user(1),other=await user(2);let source,saved,copy,again;
 try{
  source=checked(await db.rpc('create_drink_post',{p_user_id:owner.user.id,p_eaten_at:new Date().toISOString(),p_kind:'caffeine',p_ml:240,p_label:'Coffee, cup',p_caffeine_mg:95,p_nutrition:{calories:2.4,protein_g:0,carbs_g:0,fat_g:0,fibre_g:0,sugar_g:0,sodium_mg:0,micronutrients:[{nutrientId:1057,value:95,basis:'portion',unitName:'MG'}],source_ref:'171890'}}));
  saved=checked(await owner.client.rpc('save_meal_from_post',{p_post_id:source,p_name:'Saved Coffee fixture'}));
  const snapshot=checked(await owner.client.from('saved_meals').select('drinks').eq('id',saved).single());
  assert.equal(snapshot.drinks.length,1);assert.equal(snapshot.drinks[0].ml,240);assert.equal(snapshot.drinks[0].amount,95);
  const denied=await other.client.rpc('log_saved_meal',{p_id:saved,p_eaten_at:new Date().toISOString()});assert.equal(denied.error?.code,'42501');
  again=checked(await owner.client.rpc('log_post_again',{p_post_id:source,p_eaten_at:new Date().toISOString()}));
  assert.equal(checked(await db.from('jobs').select('id').eq('post_id',again)).length,0,'atomic direct sheet copy needs no item repair');
  checked(await db.from('posts').delete().eq('id',source));
  const detached=checked(await owner.client.from('saved_meals').select('source_post_id,drinks').eq('id',saved).single());assert.equal(detached.source_post_id,null);assert.deepEqual(detached.drinks,snapshot.drinks);
  copy=checked(await owner.client.rpc('log_saved_meal',{p_id:saved,p_eaten_at:new Date().toISOString()}));
  assert.equal(checked(await db.from('jobs').select('id').eq('post_id',copy)).length,0,'atomic saved sheet copy needs no item repair');
  const intake=checked(await db.from('intake_logs').select('kind,amount,ml,label,source').eq('post_id',copy));
  assert.deepEqual(intake,[{kind:'caffeine',amount:95,ml:240,label:'Coffee, cup',source:'sheet'}]);
  const item=checked(await db.from('post_items').select('id').eq('post_id',copy).single());
  const nutrition=checked(await db.from('item_nutrition').select('micronutrients').eq('post_item_id',item.id).single());
  assert.equal(nutrition.micronutrients.find(row=>row.nutrientId===1057).value,95);
 }finally{
  if(saved)checked(await db.from('saved_meals').delete().eq('id',saved));
  if(again)checked(await db.from('posts').delete().eq('id',again));
  if(copy)checked(await db.from('posts').delete().eq('id',copy));
  if(source)checked(await db.from('posts').delete().eq('id',source));
 }
});

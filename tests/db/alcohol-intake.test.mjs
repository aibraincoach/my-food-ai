import test from 'node:test';
import assert from 'node:assert/strict';
import {admin,user,checked} from './helpers.mjs';
import {drinksFromItems} from '../../src/lib/intake/drinks-from-items.ts';
import {getPostHydrationData,itemWaterMl} from '../../src/lib/intake/hydration.ts';
import {summaryLine} from '../../src/lib/posts/summary-line.ts';
test('alcohol sync accepts 16 g, rejects 600 g, and never contributes hydration',async()=>{
 assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(process.env.SUPABASE_DB_URL).hostname),'Disposable local DB only');
 const db=admin(),account=await user(1);let id;
 const alcohol={nutrientId:1018,nutrientName:'Alcohol, ethyl',unitName:'G',basis:'portion',value:13.9};
 const water={nutrientId:1051,nutrientName:'Water',unitName:'G',basis:'portion',value:200};
 const item={id:crypto.randomUUID(),name:'Bintang',food_category:'Beer',portion_text:'220 ml',portion_grams:220,micronutrients:[alcohol,water]};
 const [drink]=drinksFromItems([item]);assert.equal(drink.kind,'alcohol');assert.equal(drink.amount,14);assert.equal(drink.alcoholG,13.9);assert.equal(itemWaterMl(item),0);
 try{
  const eaten_at='2026-10-20T12:00:00Z';
  id=checked(await db.from('posts').insert({user_id:account.user.id,caption:'Alcohol integration fixture',status:'ready',eaten_at}).select('id').single()).id;
  checked(await db.from('post_items').insert({id:item.id,post_id:id,name:item.name,portion_text:item.portion_text,portion_grams:220,source:'model'}));
  checked(await db.from('item_nutrition').insert({post_item_id:item.id,food_category:'Beer',micronutrients:[alcohol,water],calories:150}));
  checked(await db.rpc('sync_item_drinks',{p_post_id:id,p_rows:[{...drink,amount:16}]}));
  const bad=await db.rpc('sync_item_drinks',{p_post_id:id,p_rows:[{...drink,amount:600}]});assert.ok(bad.error);assert.equal(bad.error.code,'23514');
  const data=(await getPostHydrationData(db,account.user.id,[{id,eaten_at,items:[item]}],'UTC'))[id];
  assert.equal(data.dayHydration.drinksMl,0);assert.equal(data.foodWaterMl,0);assert.equal(data.kind,'drink');
  assert.match(summaryLine({id,eaten_at,items:[{...item,calories:150,protein_g:0,carbs_g:0,fat_g:0}],...data}),/14 g alcohol · 1.0 standard drinks · 150 kcal/);
  const rum={...item,id:crypto.randomUUID(),name:'Rum and coke',food_category:'Liquor and cocktails',micronutrients:[alcohol,water,{nutrientId:1057,nutrientName:'Caffeine',unitName:'MG',basis:'portion',value:20}]};
  checked(await db.from('post_items').insert({id:rum.id,post_id:id,name:rum.name,portion_text:'220 ml',portion_grams:220,source:'model'}));
  checked(await db.from('item_nutrition').insert({post_item_id:rum.id,food_category:rum.food_category,micronutrients:rum.micronutrients,calories:150}));
  checked(await db.rpc('sync_item_drinks',{p_post_id:id,p_rows:drinksFromItems([item,rum])}));
  const mixed=(await getPostHydrationData(db,account.user.id,[{id,eaten_at,items:[item,rum]}],'UTC'))[id];
  assert.equal(mixed.dayHydration.drinksMl,0);assert.equal(mixed.dayHydration.caffeineMg,20);assert.equal(mixed.itemDrinks.find(row=>row.post_item_id===rum.id).caffeineMg,20);
  const unknown=drinksFromItems([{...item,micronutrients:[]}])[0];assert.equal(unknown.amount,1);assert.equal(unknown.alcoholG,0);
 }finally{if(id)checked(await db.from('posts').delete().eq('id',id));await account.client.auth.signOut({scope:'local'});}
});

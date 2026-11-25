import {parseUnavailable} from '../src/lib/fdc/unavailable.ts';
import {foodApproximation} from '../src/lib/fdc/approximation-metadata.ts';
import {drinksFromItems} from '../src/lib/intake/drinks-from-items.ts';
import {itemWaterMl} from '../src/lib/intake/hydration.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {excludeSharedItem,sharedNutrition,sharedPotMarker,thinPotPortion,thinPotRecordReason,SHABU_SLICE_SOURCE} from '../src/lib/nutrition/hot-pot.ts';
import {sittingGroups} from '../src/lib/posts/sitting-groups.ts';
import {dayReview} from '../src/lib/nutrition/day-review.ts';
import {sumNutrition,nutritionGaps,sumMicronutrients} from '../src/lib/nutrition/totals.ts';
import {nutritionUnavailable} from '../src/lib/nutrition/available.ts';
import {unavailableSentence} from '../src/lib/fdc/unavailable.ts';
const context={caption:'A shared hot pot',names:['Pork','Broth','Shabu sauce','Dipping sauce']};
test('explicit partial and full shared intake counts, while unmentioned shared items stay excluded',()=>{
 for(const quantity of ['some of the','all of the','some','all','half the']){
  assert.equal(excludeSharedItem('Broth',{...context,caption:'Hot pot. I drank '+quantity+' broth'}),false,quantity);
  assert.equal(excludeSharedItem('Shabu sauce',{...context,caption:'Hot pot. I had '+quantity+' sauce'}),false,quantity);
 }
 for(const verb of ['had','finished','sipped'])assert.equal(excludeSharedItem('Broth',{...context,caption:'Hot pot. I '+verb+' some broth'}),false,verb);
 assert.equal(excludeSharedItem('Broth',context),true);
 for(const body of ["I didn't drink some of the broth",'I did not have any of the sauce']){
  assert.equal(excludeSharedItem(body.includes('sauce')?'Shabu sauce':'Broth',{...context,caption:'Hot pot. '+body}),true);
 }
});
test('a food with sauce or in broth remains counted; only a broth or sauce item is excluded',()=>{
 for(const name of ['Pork slices with dipping sauce','Beef shabu with sesame dipping sauce','Udon noodles in broth','Pork over hot-pot sauce','Rice and dipping sauce','Broth-flavoured noodles'])assert.equal(excludeSharedItem(name,context),false,name);
 for(const name of ['Dipping sauce','Broth','Shabu-shabu broth','Shabu sauce','Chicken stock'])assert.equal(excludeSharedItem(name,context),true,name);
});
test('shared-pot broth and named dipping sauces remain named but contribute measured zero',()=>{
 for(const name of['Broth','Stock','Soup base','Dipping sauce','Shabu sauce','Hot-pot sauce']){
  assert.equal(excludeSharedItem(name,context),true,name);
  const original={calories:30,protein_g:1,carbs_g:2,fat_g:2,fibre_g:0,sugar_g:0,sodium_mg:50,micronutrients:[{nutrientId:1051,value:100,basis:'portion'}],source_ref:'123'};
  const nutrition=sharedNutrition(name.includes('sauce')?'sauce':'broth',original);
  assert.equal(sumNutrition([nutrition]).calories,0);assert.deepEqual(nutritionGaps(sumNutrition([nutrition])),[]);
  assert.equal(nutritionUnavailable(nutrition),false);assert.equal(unavailableSentence(name,nutrition.source_ref),null);
  assert.deepEqual(nutrition.micronutrients,[]);
  assert.deepEqual(sumMicronutrients([{name:'other',micronutrients:[{nutrientId:1089,nutrientName:'Iron',unitName:'mg',value:2}]},{name,...nutrition}]),[{name:'Iron',unit:'mg',value:2}]);
  assert.equal(itemWaterMl({...nutrition,portion_grams:100,portion_text:'100 ml'}),0);
  assert.deepEqual(drinksFromItems([{id:'shared',name,...nutrition,food_category:'water',portion_grams:100,portion_text:'100 ml'}]),[]);assert.deepEqual(sharedPotMarker(nutrition.source_ref).original,original);
  assert.equal(JSON.parse(JSON.stringify(nutrition)).source_ref,nutrition.source_ref,'saved/copy JSON keeps marker bytes');
 }
});
test('whole-word and non-shared meals stay counted; future or negative consumption is not explicit intake',()=>{
 for(const name of['Stockfish','Brothy vegetables','Curry sauce','Salad dressing'])assert.equal(excludeSharedItem(name,context),false);
 assert.equal(excludeSharedItem('Shabu sauce',{caption:'Bottle of shabu sauce',names:['Shabu sauce']}),false);
 for(const name of['Soup','Curry sauce','Salad dressing','Shabu sauce'])assert.equal(excludeSharedItem(name,{caption:'Bottle photographed alone',names:[name]}),false);
 for(const caption of["I didn't drink the broth",'I will drink the broth','Do not count the sauce'])assert.equal(excludeSharedItem(caption.includes('sauce')?'Shabu sauce':'Broth',{...context,caption:context.caption+'. '+caption}),true);
});
test('explicit captions and ordered corrections count only the named shared item',()=>{
 assert.equal(excludeSharedItem('Broth',{...context,caption:'Hot pot. I drank the broth'}),false);
 assert.equal(excludeSharedItem('Shabu sauce',{...context,corrections:['count the sauce']}),false);
 assert.equal(excludeSharedItem('Broth',{...context,corrections:['count the sauce']}),true);
 assert.equal(excludeSharedItem('Shabu sauce',{...context,corrections:['count the sauce',"don't count the sauce"]}),true);
});
test('thin shabu meat uses cited15g per counted slice, retaining model guess; explicit mass wins',()=>{
 const item={name:'Pork for shabu',portionText:'2 thin slices',portionGrams:70};
 const n=thinPotPortion(item,context);assert.equal(n.grams,30);assert.equal(n.modelGrams,70);assert.equal(n.source,SHABU_SLICE_SOURCE);
 assert.equal(thinPotPortion({...item,portionText:'thin slices'},context).grams,70);
 assert.equal(thinPotPortion(item,{...context,caption:'Pork shabu, weighed 50 g'}).grams,50);
 for(const name of['Ham','Bacon','Toast'])assert.equal(thinPotPortion({...item,name},context).grams,70);
 assert.match(thinPotRecordReason(item,context,'Pork, fresh, belly, raw'),/^hot-pot:/);
 assert.equal(thinPotRecordReason(item,context,'Pork, loin, raw'),null);
 assert.equal(thinPotRecordReason(item,{...context,caption:'Hot pot with pork belly'},'Pork, fresh, belly, raw'),null);
 assert.match(thinPotRecordReason({...item,name:'Beef for shabu'},context,'Beef, short plate, raw'),/^hot-pot:/);
});
test('sittings chain consecutive20minute gaps without crossing owners and without mutating input',()=>{
 const posts=[['c','one',41],['b','one',20],['a','one',0],['d','two',1]].map(([id,ownerId,min])=>({id,ownerId,eatenAt:new Date(Date.UTC(2026,10,24,12,min)).toISOString()}));
 const before=JSON.stringify(posts);assert.deepEqual(sittingGroups(posts).map(g=>g.map(p=>p.id)),[['a','b'],['c'],['d']]);assert.equal(JSON.stringify(posts),before);
 assert.throws(()=>sittingGroups([{id:'a',ownerId:'one',eatenAt:'bad'}]));
});
test('one strict4000day threshold leaves totals unchanged and links the three greatest meals',()=>{
 for(const kcal of[3999,4000,null,undefined,'bad'])assert.equal(dayReview(kcal).high,false);
 const posts=[{id:'b',kcal:10},{id:'a',kcal:10},{id:'c',kcal:200},{id:'d',kcal:null}],before=JSON.stringify(posts);
 assert.equal(dayReview(4001,posts).high,true);assert.deepEqual(dayReview('4001',posts).meals.map(p=>p.id),['c','a','b']);assert.equal(JSON.stringify(posts),before);
});

test('the approved named-sauce plus separate thin-meat conjunction is narrow',()=>{
 for(const meat of['Pork','Beef']){
  const items=[{name:meat,portionText:'2 thin slices'},{name:'Shabu sauce'}],c={caption:'',names:items.map(i=>i.name),items};
  assert.equal(excludeSharedItem('Shabu sauce',c),true);
  assert.equal(thinPotPortion(items[0],c).grams,30);
 }
 for(const name of['Rice','Ham','Bacon','Pork bacon']){
  const items=[{name,portionText:'2 thin slices'},{name:'Shabu sauce'}];
  assert.equal(excludeSharedItem('Shabu sauce',{caption:'',names:items.map(i=>i.name),items}),false);
 }
 assert.equal(thinPotRecordReason({name:'Thin beef for shabu'}, {caption:'Short plate',names:['Thin beef for shabu']},'Beef, short plate, raw'),null);
});
test('existing unavailable/approximation references retain their original parsing',()=>{
 for(const ref of['777','off:fixture','label','user:fixture','estimate:plain rice','unavailable:no_match:No compatible food','unavailable:not_food:Not food','unavailable:no_estimate:No usable estimate',null]){
  assert.equal(sharedPotMarker(ref),null);
 }
 assert.deepEqual(parseUnavailable('unavailable:no_match:No compatible food'),{code:'no_match',detail:'No compatible food'});
 const row={source_ref:'estimate:plain rice',micronutrients:[{nutrientId:1008,value:10,approximation:{kind:'estimate',basis:'plain rice',sourceRef:'estimate:plain rice'}}]};
 assert.deepEqual(foodApproximation(row),{kind:'estimate',basis:'plain rice'});
 assert.equal(sharedPotMarker('shared-pot:v1:malformed'),null);
});

test('repeated ambiguous rematches retain original references once without nesting marker history',()=>{
 const a={source_ref:'111',calories:10},b={source_ref:'222',calories:20};
 const first=sharedNutrition('sauce',{source_ref:null,candidates:[a,b]});
 const again=sharedNutrition('sauce',{source_ref:null,candidates:[first,first]});
 assert.equal(again.source_ref,first.source_ref);
 assert.deepEqual(sharedPotMarker(again.source_ref).original.candidates,[a,b]);
});

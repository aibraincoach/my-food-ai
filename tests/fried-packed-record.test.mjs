import test from 'node:test';import assert from 'node:assert/strict';
import {checkRecord} from '../src/lib/fdc/record-kind.ts';
const packed=(name,description)=>checkRecord(name,{description}).strong.filter(signal=>signal.startsWith('packed:'));
test('explicit frying names reject syrup or juice packs without guessing fat',()=>{
 for(const name of ['fried cempedak','deep-fried jackfruit','pisang goreng','battered pineapple','banana fritter','banana fritters','banana tempura'])
  for(const description of ['Jackfruit, canned, syrup pack','Pineapple, canned, juice pack','Bananas in syrup','Peaches in light syrup','Peaches in heavy syrup','Peaches in extra light syrup'])assert.equal(packed(name,description).length,1,`${name}: ${description}`);
});
test('canned foods, non-frying names and generic crispy labels keep their prior eligibility',()=>{
 for(const [name,description] of [
  ['pineapple','Pineapple, canned, juice pack'],['tuna fried rice','Fish, tuna, light, canned in water'],
  ['fruit cocktail','Fruit cocktail, canned, heavy syrup'],['peaches in syrup','Peaches, canned, heavy syrup pack'],
  ['crispy jackfruit','Jackfruit, canned, syrup pack'],['crunchy jackfruit','Jackfruit, canned, syrup pack'],
  ['fried beans','Beans, canned'],['fried tuna','Fish, tuna, canned in oil'],
 ])assert.deepEqual(packed(name,description),[],name);
});
test('a fried or explicitly named syrup-served dish keeps its own preparation record',()=>{
 for(const [name,description] of [
  ['fried banana','FRIED BANANA IN SYRUP'],
  ['gulab jamun fried','Gulab jamun, in syrup'],
 ])assert.deepEqual(packed(name,description),[],name);
 assert.equal(packed('fried jackfruit','Jackfruit, canned, syrup pack').length,1);
});
test('unlisted fried fruit cannot be mistaken for a syrup dish',()=>{
 for(const fruit of ['cempedak','nangka','pisang','plantain'])assert.equal(packed(`fried ${fruit}`,`${fruit}, in syrup`).length,1,fruit);
});

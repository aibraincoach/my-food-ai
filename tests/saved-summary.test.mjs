import test from 'node:test';
import assert from 'node:assert/strict';
import {savedItemsLine} from '../src/lib/posts/saved-summary.ts';
const coffee={name:'Coffee, cup',portion_grams:240,portion_text:'240 g',nutrition:{calories:2.4,protein_g:0,carbs_g:0,fat_g:0}};
const drinks=[{kind:'caffeine',amount:95,ml:240,label:'Coffee, cup',source:'sheet'}];
test('saved sheet intake supplies volume and caffeine independently of item mass',()=>{
 assert.equal(savedItemsLine([coffee],drinks),'Coffee, cup · 240 ml · 95 mg caffeine · 2 kcal');
 assert.equal(savedItemsLine([{...coffee,portion_grams:999}],drinks),'Coffee, cup · 240 ml · 95 mg caffeine · 2 kcal');
});
test('no intake snapshot means no guessed ml or caffeine; missing calories stay unavailable',()=>{
 assert.equal(savedItemsLine([coffee]),'Coffee, cup 240 g · 2 kcal');
 assert.equal(savedItemsLine([{...coffee,nutrition:{...coffee.nutrition,calories:null}}],drinks),'Coffee, cup · 240 ml · 95 mg caffeine · calories unavailable');
});

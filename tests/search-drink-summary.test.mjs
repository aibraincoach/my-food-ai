import test from 'node:test';
import assert from 'node:assert/strict';
import {summaryLine} from '../src/lib/posts/summary-line.ts';
import {cardDataFromRow} from '../src/lib/pipeline/card-data.ts';
test('search summaries use the post’s resolved drink rather than losing its volume and caffeine',()=>{
 const post={kind:'drink',items:[],drink:{ml:240,caffeineMg:95,totalMl:690,dayCaffeineMg:158,drinksMl:440,foodMl:250,label:'Coffee, cup'}};
 assert.equal(summaryLine(post),'Drank: 240 ml · 95 mg caffeine · Consumed today: 690 ml · 158 mg caffeine today');
 assert.match(summaryLine({...post,drink:null}),/^Drank: unavailable ml/);
 assert.match(summaryLine(post,{...post.drink,ml:350,caffeineMg:138}),/^Drank: 350 ml · 138 mg caffeine/);
});

test('feed alcohol summaries use the same hydrated grams as their result card',()=>{
 const item={id:'cocktail',name:'Cocktail with lime',portion_grams:220,calories:160,protein_g:0,carbs_g:0,fat_g:0,micronutrients:[{nutrientId:1051,basis:'portion',value:180}]};
 const row={post_item_id:'cocktail',kind:'alcohol',alcoholG:15,ml:220,caffeineMg:0,label:item.name};
 const post={kind:'drink',items:[item],itemDrinks:[row],drinkSource:'item',drink:{kind:'alcohol',source:'item',alcoholG:15,ml:0,label:item.name,caffeineMg:0,totalMl:0,drinksMl:0,foodMl:0}};
 assert.equal(summaryLine(post),'Drank: 15 g alcohol · 1.1 standard drinks · 160 kcal');
 assert.equal(cardDataFromRow(post).drinkDetail,'15 g alcohol · 1.1 standard drinks');
 assert.equal(summaryLine({...post,drink:null}),'Drank: 15 g alcohol · 1.1 standard drinks · 160 kcal');
 assert.equal(summaryLine({...post,drink:null,itemDrinks:[{...row,alcoholG:0}]}),'Drank: alcohol unavailable · 160 kcal');
});

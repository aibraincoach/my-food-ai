import test from 'node:test';
import assert from 'node:assert/strict';
import {nutritionTranslator} from '../src/i18n/nutrition.ts';
import {commentText,mealSummaryMessage,formatCommentMessage,parseCommentMessage} from '../src/lib/posts/comment-message.ts';
import {plainConsumed} from '../src/lib/pipeline/wording.ts';
const totals={calories:203.4,protein_g:5.2,carbs_g:null,fat_g:2.7,missing:{carbs_g:['Iron food']}};
const labels=[{name:'A',basis:'typical recipe',kind:'estimate'},{name:'B',basis:'nearest record',kind:'closest'}];
const reasons=[{name:'Not food',sourceRef:'unavailable:not_food:data'}];
const en=nutritionTranslator('en'),ja=nutritionTranslator('ja');
test('new structured summary is byte-identical to the existing English formatter, including gaps and provenance',()=>{
 const message=mealSummaryMessage(totals,labels,reasons);
 assert.equal(formatCommentMessage(message,en,'en'),plainConsumed(totals,labels,reasons));
 assert.match(formatCommentMessage(message,ja,'ja'),/摂取/);
 assert.doesNotMatch(formatCommentMessage(message,ja,'ja'),/Consumed:/);
});
test('old model sentences and user quotes stay byte-for-byte text, never template parsed',()=>{
 for(const body of ['Consumed: a question?','Removed x.','日本語の質問'])assert.equal(commentText({body},ja,'ja'),body);
 assert.throws(()=>commentText({body:'old',message:mealSummaryMessage(totals)},en,'en'),/Ambiguous/);
});
test('unknown codes, invalid numeric payloads and missing content fail visibly',()=>{
 for(const raw of [{code:'future',values:{}},{code:'mealSummary',values:{kind:'consumed',totals:{...totals,calories:'3'},approximations:[],unavailable:[]}},{code:'editAdded',values:{name:'x',before:null,grams:NaN,amount:null,unit:'g'}}])assert.throws(()=>parseCommentMessage(raw));
 assert.throws(()=>commentText({body:null},ja,'ja'));
});
test('edit notes keep existing English punctuation, amount units and person names as data',()=>{
 const values={name:'rice',before:'bread',grams:120,amount:2,unit:'cup'};
 assert.equal(formatCommentMessage({code:'editRenamed',values},en,'en'),'Renamed bread to rice, 2 cups (120 g).');
 assert.equal(formatCommentMessage({code:'editRemoved',values:{name:null}},en,'en'),'Removed an item.');
 assert.equal(formatCommentMessage({code:'editPortion',values:{...values,name:null,unit:'g'}},en,'en'),'An item set to 120 g.');
 assert.match(formatCommentMessage({code:'editAdded',values},ja,'ja'),/追加/);
});
test('removal remains the old brief English form; Japanese has no doubled full stop',()=>{
 const message=mealSummaryMessage({calories:100,protein_g:2,carbs_g:4,fat_g:1});
 message.values={...message.values,kind:'removal',removal:{kind:'removedCorrection',text:'my "rice"'}};
 assert.equal(formatCommentMessage(message,en,'en'),'Removed the correction "my "rice"". Consumed: 100 kcal.');
 assert.doesNotMatch(formatCommentMessage(message,ja,'ja'),/。。/);
});
test('leftover quantities are facts, not an English-string parse',()=>{
 const message={code:'mealSummary',values:{kind:'leftovers',leftovers:[{grams:50,count:1,total:3,unit:'pieces'}],consumed:[{grams:100,count:2,total:3,unit:'pieces'}],omitted:50,calories:100}};
 assert.equal(formatCommentMessage(message,en,'en'),'Leftovers: 1 pieces · 50 kcal. Consumed: 2 of 3 pieces · 100 kcal.');
 assert.match(formatCommentMessage(message,ja,'ja'),/食べ残し/);
 assert.throws(()=>formatCommentMessage({...message,values:{...message.values,consumed:[{grams:100,count:4,total:3,unit:'pieces'}]}},en,'en'));
});

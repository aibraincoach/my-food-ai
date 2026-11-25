import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {auditClientDictionaries} from '../scripts/check-client-dictionaries.mjs';
const read=file=>fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
test('every browser entry excludes dictionaries and server factories',()=>{
 const result=auditClientDictionaries();assert.ok(result.roots>50);assert.deepEqual(result.failures,[]);
});
for(const [name,file,addition,target] of [
 ['old ResultsCard factory path','src/components/ResultsCard.tsx',"import {cardTranslator} from '@/i18n/card';",'src/i18n/card.ts'],
 ['card-data factory path','src/lib/pipeline/card-data.ts',"import {nutritionTranslator} from '@/i18n/nutrition';",'src/i18n/nutrition.ts'],
 ['table factory path','src/lib/nutrition/table.ts',"import {nutrientsTranslator} from '@/i18n/nutrients';",'src/i18n/nutrients.ts'],
 ['direct JSON','src/components/ResultsCard.tsx',"import messages from '../../messages/ja.json';",'messages/ja.json'],
 ['re-export','src/components/ResultsCard.tsx',"export {default as messages} from '../../messages/en.json';",'messages/en.json'],
 ['dynamic JSON','src/components/ResultsCard.tsx',"const load=()=>import('../../messages/ja.json');",'messages/ja.json'],
 ['server reader','src/lib/pipeline/card-data.ts',"export {readCardData} from './read-card-data';",'server-only'],
])test('guard is red for '+name,()=>{
 const result=auditClientDictionaries(undefined,{overrides:{[file]:addition+'\n'+read(file)}});
 assert.ok(result.failures.some(row=>row.chain.includes(target)),target);
});
test('type-only imports are erased and server actions stop the browser walk',()=>{
 const file='src/components/ResultsCard.tsx';
 const result=auditClientDictionaries(undefined,{overrides:{[file]:"import type messages from '../../messages/ja.json';\nimport {type CardTranslator} from '@/i18n/card';\n"+read(file)}});
 assert.deepEqual(result.failures,[]);
 // Existing client entries import server actions; those actions may read factories.
 const action='src/lib/auth/actions.ts';
 const server=auditClientDictionaries(undefined,{overrides:{[action]:"'use server';\nimport {cardTranslator} from '@/i18n/card';\n"+read(action)}});
 assert.deepEqual(server.failures,[]);
});

import fs from 'node:fs';import path from 'node:path';import test from 'node:test';import assert from 'node:assert/strict';
import {effectiveFunctions,nutritionWriters} from './fixtures/sql-functions.mjs';
const dir=new URL('../supabase/migrations/',import.meta.url).pathname;
const expected=JSON.parse(fs.readFileSync(new URL('./fixtures/item-record-writers.json',import.meta.url)));
function audit(read){const writers=nutritionWriters(effectiveFunctions(dir,read));assert.deepEqual(writers.map(x=>x.key),expected.map(x=>x.signature));for(const row of writers){const inserts=[...row.body.matchAll(/\binsert\s+into\s+(?:public\.)?item_nutrition\s*\(([^)]*)\)/gi)];assert.ok(inserts.length,row.key+' requires explicit nutrition columns');assert.equal(inserts.length,[...row.body.matchAll(/\binsert\s+into\s+(?:public\.)?item_nutrition\b/gi)].length,row.key+' has an implicit nutrition insert');for(const insert of inserts){const cols=insert[1].split(',').map(x=>x.trim());assert.ok(cols.includes('record_description'),row.key+' missing record_description');assert.ok(cols.includes('record_data_type'),row.key+' missing record_data_type');}}return writers;}
test('every effective SQL nutrition writer declares both record fields, including retained overloads',()=>{const rows=audit();assert.ok(rows.every(x=>x.file==='0087_item_record_description.sql'));});
test('a future nutrition writer without the pair fails the CI inventory',()=>{assert.throws(()=>audit(file=>fs.readFileSync(file,'utf8')+(path.basename(file)==='0087_item_record_description.sql'?"\ncreate function public.unreviewed_writer() returns void language sql as $$ insert into public.item_nutrition(post_item_id) values(null); $$;":'')));});
test('omitting either field from an existing writer fails the CI inventory',()=>{for(const column of ['record_description','record_data_type'])assert.throws(()=>audit(file=>{const text=fs.readFileSync(file,'utf8');if(path.basename(file)!=='0087_item_record_description.sql')return text;return text.replace(/(insert into public\.item_nutrition\([^)]*)\)/i,part=>part.replace(','+column,''));}),new RegExp('missing '+column));});
test('0087 preserves every prior writer body outside its nutrition insert',()=>{
 const before=nutritionWriters(effectiveFunctions(dir,file=>path.basename(file)==='0087_item_record_description.sql'?'':fs.readFileSync(file,'utf8')));
 const after=nutritionWriters(effectiveFunctions(dir));
 const withoutInsert=body=>body.replace(/\binsert\s+into\s+public\.item_nutrition\b[^;]*;/gi,'NUTRITION_INSERT');
 for(const row of after)assert.equal(withoutInsert(row.body),withoutInsert(before.find(x=>x.key===row.key).body),row.key+' changed unrelated behavior');
});

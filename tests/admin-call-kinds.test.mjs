import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const strings=text=>[...text.matchAll(/'([^']+)'/g)].map(m=>m[1]).sort();
const app=fs.readFileSync('src/lib/admin/error-code.ts','utf8').match(/const callKinds\s*=\s*new Set\(\[([^\]]+)\]/)?.[1];
// Historical migrations are immutable; follow the latest aggregate projection.
const sql=fs.readdirSync('supabase/migrations').filter(file=>file.endsWith('.sql')).sort().flatMap(file=>[...fs.readFileSync('supabase/migrations/'+file,'utf8').matchAll(/case when c\.kind in \(([^)]+)\)/g)].map(match=>match[1])).at(-1);
// Follow migrations in order: the latest added named constraint is authoritative.
const constraints=fs.readdirSync('supabase/migrations').filter(f=>f.endsWith('.sql')).sort().flatMap(file=>[...fs.readFileSync('supabase/migrations/'+file,'utf8').matchAll(/add constraint model_calls_kind_check check\s*\(kind in\s*\(([^)]+)\)/gi)].map(m=>m[1]));
const constraint=constraints.at(-1);
function agree(appList,sqlList,dbList){assert.ok(appList&&sqlList&&dbList,'all three lists must be found');assert.deepEqual(strings(appList),strings(dbList),'TypeScript kinds differ from the latest model_calls check constraint');assert.deepEqual(strings(sqlList),strings(dbList),'SQL kinds differ from the latest model_calls check constraint');}
test('admin call kinds match the authoritative database constraint in both projections',()=>agree(app,sql,constraint));
test('a kind added only to the database makes the guard fail',()=>assert.throws(()=>agree(app,sql,constraint+",'future_kind'"),/kinds differ/));
test('a kind removed only from either projection makes the guard fail',()=>{assert.throws(()=>agree(app.replace("'fdc',",''),sql,constraint),/kinds differ/);assert.throws(()=>agree(app,sql.replace("'fdc',",''),constraint),/kinds differ/);});

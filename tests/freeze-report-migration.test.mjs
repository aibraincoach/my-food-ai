import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {VALUES} from '../src/lib/diagnostics/schema.ts';
test('direct-insert database whitelist stays aligned with endpoint and recorder',()=>{
 const sql=fs.readFileSync(new URL('../supabase/migrations/0077_freeze_reports.sql',import.meta.url),'utf8');
 const whitelist=sql.match(/allowed constant jsonb := '([^']+)'::jsonb/);assert.ok(whitelist);
 assert.deepEqual(JSON.parse(whitelist[1]),VALUES);
});

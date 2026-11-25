import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import ts from 'typescript';import vm from 'node:vm';
const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(process.env.ADMIN_ERROR_CODE_SOURCE??'src/lib/admin/error-code.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports});
const corpus=JSON.parse(fs.readFileSync('tests/fixtures/admin-error-codes.json','utf8'));
for(const row of corpus)test(row.source,()=>assert.equal(exports.adminErrorCode(row.value,row.kind),row.expected));

test('invalid structured call kind is never reflected',()=>assert.equal(exports.adminErrorCode('MetaApiError (status 503)','PRIVATE_KIND'),null));

test('post/job projections contain only a fixed service and optional recorded status',()=>{for(const row of corpus.filter(r=>r.kind===null)){const code=exports.adminErrorCode(row.value);if(code!==null)assert.match(code,/^(fdc|meta|worker)( [0-9]{3})?$/);}});

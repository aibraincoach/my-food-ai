import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {machineMessage} from '../src/i18n/machine-messages.ts';
import {AGENT_TOOLS} from '../src/lib/agents/mcp-tools.ts';
import {API_MESSAGE_CODES,FAILURE_MESSAGE_NAMESPACES} from '../src/i18n/api-codes.ts';
const golden=JSON.parse(fs.readFileSync(new URL('./fixtures/machine-english.json',import.meta.url),'utf8'));
test('all fixed machine messages retain their original English contract, including status interpolation',()=>{
 for(const row of golden.messages){const values=row.english.includes('{v0}')?{v0:503}:undefined;assert.equal(machineMessage(row.code,values),row.english.replaceAll('{v0}','503'));}
});
test('MCP tool metadata is byte-for-byte equivalent to its pre-conversion object',()=>assert.deepEqual(AGENT_TOOLS,golden.tools));
test('generated code/namespace metadata covers both strict dictionaries without text values',()=>{
 const en=JSON.parse(fs.readFileSync(new URL('../messages/en.json',import.meta.url),'utf8')),ja=JSON.parse(fs.readFileSync(new URL('../messages/ja.json',import.meta.url),'utf8'));
 assert.deepEqual([...API_MESSAGE_CODES].sort(),Object.keys(en.api).sort());assert.deepEqual(Object.keys(en.api).sort(),Object.keys(ja.api).sort());
 for(const ns of['api','capture'])for(const key of Object.keys(en[ns]))assert.equal(FAILURE_MESSAGE_NAMESPACES[key],ns);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {checkCaptureNamespaces} from '../scripts/check-capture-namespaces.mjs';

test('capture routes, the offline shell and their imported client components have all message namespaces',()=>{
 const result=checkCaptureNamespaces();
 assert.ok(result.files>0);
 assert.ok(result.namespaces.includes('capture'));
});

test('a missing provider namespace fails before a client reaches strict runtime formatting',()=>{
 assert.throws(()=>checkCaptureNamespaces(undefined,undefined,['navigation','errors','card']),/Missing capture-provider namespace capture/);
});

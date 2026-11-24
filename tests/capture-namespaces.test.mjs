import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {checkCaptureNamespaces,checkRootSiblingNamespaces} from '../scripts/check-capture-namespaces.mjs';

test('capture routes, the offline shell and their imported client components have all message namespaces',()=>{
 const result=checkCaptureNamespaces();
 assert.ok(result.files>0);
 assert.ok(result.namespaces.includes('capture'));
});

test('a missing provider namespace fails before a client reaches strict runtime formatting',()=>{
 assert.throws(()=>checkCaptureNamespaces(undefined,undefined,['navigation','errors','card','feed','post','postMenu','thread','hints']),/Missing capture-provider namespace capture/);
});


test('root sibling consumers have their own namespace scope',()=>{
 assert.ok(checkRootSiblingNamespaces().files>1);
 const threeNamespaces=fs.readFileSync(new URL('../src/app/layout.tsx',import.meta.url),'utf8').replace(',hints:messages.hints','');
 assert.throws(()=>checkRootSiblingNamespaces(undefined,threeNamespaces),/Missing root-provider namespace hints/);
 const unscoped=`import DeletePostSheet from '@/components/DeletePostSheet';
 import PostOpenTransition from '@/components/PostOpenTransition';
 export default function Root(){return <><DeletePostSheet/><PostOpenTransition/></>;}`;
 assert.throws(()=>checkRootSiblingNamespaces(undefined,unscoped),/Missing root-provider namespace/);
});

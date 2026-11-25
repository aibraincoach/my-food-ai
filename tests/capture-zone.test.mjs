import test from 'node:test';import assert from 'node:assert/strict';
import {captureZone} from '../src/lib/posts/capture-zone.ts';
for(const input of [undefined,null,0,true,{},[], '', 'Not/AZone','UTC\0','+01:00','-0530','GMT+1','EST','CET','Etc/GMT+5'])test('capture rejects '+JSON.stringify(input)+' without a display default',()=>assert.equal(captureZone(input),null));
for(const input of ['asia/tokyo','Asia/Calcutta','UTC','America/Edmonton'])test('capture stores the canonical name for '+input,()=>assert.equal(captureZone(input),new Intl.DateTimeFormat('en',{timeZone:input}).resolvedOptions().timeZone));

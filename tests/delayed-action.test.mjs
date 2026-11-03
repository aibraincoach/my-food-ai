import test from 'node:test';
import assert from 'node:assert/strict';
import {delayAction} from '../src/lib/posts/delayed-action.ts';

test('delayed action waits, undo cancels, and pagehide commits once', t=>{
 t.mock.timers.enable({apis:['setTimeout']});
 const prior=globalThis.window;globalThis.window=new EventTarget();
 try {
  const calls=[];delayAction(6000,keepalive=>calls.push(keepalive));
  t.mock.timers.tick(5999);assert.deepEqual(calls,[]);
  t.mock.timers.tick(1);assert.deepEqual(calls,[false]);
  window.dispatchEvent(new Event('pagehide'));assert.deepEqual(calls,[false]);
  const cancelled=delayAction(6000,()=>calls.push('cancelled'));cancelled.undo();cancelled.undo();
  t.mock.timers.tick(6000);window.dispatchEvent(new Event('pagehide'));assert.deepEqual(calls,[false]);
  delayAction(6000,keepalive=>calls.push(keepalive));
  window.dispatchEvent(new Event('pagehide'));window.dispatchEvent(new Event('pagehide'));
  t.mock.timers.tick(6000);assert.deepEqual(calls,[false,true]);
 }finally{if(prior===undefined)delete globalThis.window;else globalThis.window=prior;}
});

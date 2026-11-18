// node --test tests/camera-recovery.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// #999: a phone's Photo screen never stays black and silent. An ended or paused camera is answered once per return
// to the app, and a camera that did not open says so with its Allow camera button.
const sheet=readFileSync(new URL('../src/components/CaptureSheet.tsx',import.meta.url),'utf8');
const effect=sheet.slice(sheet.indexOf('// #999: iOS can stop the camera'),sheet.indexOf('}, [stream]);')+13);
test('an ended or paused camera is answered once per return to the app, with no timer',()=>{
  assert.ok(effect.length>100,'the recovery effect exists');
  for(const event of ['"ended"','"visibilitychange"','"pageshow"'])assert.ok(effect.includes(event),event);
  assert.match(effect,/if \(reopened\.current\) \{ setCameraRecoveryFailed\(true\); setCameraUnavailable\(true\); return; \}/);
  assert.match(effect,/document\.visibilityState === "hidden"\) \{ reopened\.current = false;/);
  assert.match(effect,/video\?\.paused\) void video\.play\(\)\.catch/);
  assert.doesNotMatch(effect,/setTimeout|setInterval/);
});
test('a phone in Photo mode shows that the camera did not open, with Allow camera',()=>{
  assert.match(sheet,/\{\(cameraUnavailable\|\|desktop&&forPost&&!stream&&!latest\)&&<div/);
  assert.match(sheet,/!desktop&&cameraUnavailable&&mode==="photo"&&<p role="status"[^>]*>\{CAMERA_NOT_OPENED\}<\/p>/);
  assert.match(sheet,/onClick=\{retryCamera\}/);
  assert.match(sheet,/reopened\.current=false;setCameraAttempt\(value=>value\+1\)/);
  assert.doesNotMatch(sheet,/\{desktop&&\(cameraUnavailable\|\|/);
});
test('the live barcode scan still runs only on the Barcode screen',()=>{
  assert.match(sheet,/if \(mode !== "barcode" \|\| !stream\) return;/);
});

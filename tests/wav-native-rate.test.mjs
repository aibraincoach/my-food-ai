// node --import tsx --test tests/wav-native-rate.test.mjs
import assert from 'node:assert/strict';
import test from 'node:test';
import {encodeWav} from '../src/lib/audio/wav-encoder.ts';

for (const rate of [44100,48000]) {
  test(`native ${rate} Hz capture becomes one second of mono PCM16 at 16 kHz`,()=>{
    const input=new Float32Array(rate).fill(0.5);
    const wav=encodeWav([input.subarray(0,4096),input.subarray(4096)],rate);
    const view=new DataView(wav);
    assert.equal(wav.byteLength,44+16000*2);
    assert.equal(view.getUint16(22,true),1);
    assert.equal(view.getUint32(24,true),16000);
    assert.equal(view.getUint32(28,true),32000);
    assert.equal(view.getUint16(34,true),16);
    assert.equal(view.getUint32(40,true),32000);
    assert.equal(view.getInt16(44,true),16384);
    assert.equal(view.getInt16(wav.byteLength-2,true),16384);
  });
}

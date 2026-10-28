import test from 'node:test';
import assert from 'node:assert/strict';
import {encodeWav} from '../src/lib/audio/wav-encoder.ts';
import {MAX_RECORDING_SECONDS,MAX_WAV_BYTES,MAX_AUDIO_REQUEST_BYTES} from '../src/lib/audio/limits.ts';
test('late stop still produces a capped WAV and multipart body below deployment limit',async()=>{
 const wav=encodeWav([new Float32Array(16000*(MAX_RECORDING_SECONDS+1))],16000);
 assert.equal(wav.byteLength,MAX_WAV_BYTES);
 const form=new FormData();form.append('audio',new Blob([wav],{type:'audio/wav'}),'correction.wav');form.append('draftId',crypto.randomUUID());
 const body=await new Response(form).arrayBuffer();assert.ok(body.byteLength<MAX_AUDIO_REQUEST_BYTES);assert.ok(MAX_AUDIO_REQUEST_BYTES<4_500_000);
});

import {metaFetch,MetaApiError} from './client';
// Verified against https://dev.meta.ai/docs/api-reference/voice/transcribe.
export async function transcribe(audio:Blob,draftId:string):Promise<string>{
 const form=new FormData();
 form.append('request',new Blob([JSON.stringify({model:'muse-voice-transcribe-1.0',audioEncoding:'WAV',mode:'PUSH_TO_TALK'})],{type:'application/json'}));
 form.append('audio',audio,'correction.wav');
 const response=await metaFetch(`/asr/transcribe?sessionId=${encodeURIComponent(draftId)}`,{method:'POST',headers:{Accept:'application/json'},body:form,signal:AbortSignal.timeout(30000)});
 const result=await response.json();
 if(typeof result.transcript!=='string')throw new MetaApiError(502,'Transcription response was invalid.');
 return result.transcript;
}

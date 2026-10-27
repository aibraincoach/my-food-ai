// Canonical 44-byte RIFF header, mono signed PCM16 at 16 kHz.
export function encodeWav(chunks:Float32Array[],sampleRate:number):ArrayBuffer {
 if(!Number.isFinite(sampleRate)||sampleRate<=0)throw new Error('Invalid recording sample rate.');
 const count=Math.min(chunks.reduce((n,c)=>n+c.length,0),Math.floor(sampleRate*600));const samples=new Float32Array(count);
 let cursor=0;for(const chunk of chunks){const take=Math.min(chunk.length,count-cursor);samples.set(chunk.subarray(0,take),cursor);cursor+=take;if(cursor===count)break;}
 const targetRate=16000;const frames=Math.floor(count*targetRate/sampleRate);const buffer=new ArrayBuffer(44+frames*2);const view=new DataView(buffer);
 const text=(offset:number,value:string)=>{for(let i=0;i<value.length;i++)view.setUint8(offset+i,value.charCodeAt(i));};
 text(0,'RIFF');view.setUint32(4,36+frames*2,true);text(8,'WAVE');text(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,targetRate,true);view.setUint32(28,targetRate*2,true);view.setUint16(32,2,true);view.setUint16(34,16,true);text(36,'data');view.setUint32(40,frames*2,true);
 const ratio=sampleRate/targetRate;
 for(let i=0;i<frames;i++){
  // Integrate each output interval, avoiding alias-prone dropped samples.
  const from=i*ratio,to=Math.min(count,(i+1)*ratio);let weighted=0;
  for(let j=Math.floor(from);j<Math.ceil(to);j++)weighted+=(samples[j]||0)*(Math.min(to,j+1)-Math.max(from,j));
  const sample=Math.max(-1,Math.min(1,weighted/(to-from)));view.setInt16(44+i*2,Math.round(sample*(sample<0?32768:32767)),true);
 }
 return buffer;
}

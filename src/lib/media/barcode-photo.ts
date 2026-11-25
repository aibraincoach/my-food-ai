// A cold decoder download must not consume the photo's decode budget.
export type BarcodePhotoResult = {state:'found';code:string}|{state:'decoderSlow'|'error'|'unread'};
const expired=Symbol('deadline');
async function within<T>(work:()=>Promise<T>,ms:number):Promise<T|typeof expired>{
 let timer:ReturnType<typeof setTimeout>|undefined;
 try{return await Promise.race([work(),new Promise<typeof expired>(resolve=>{timer=setTimeout(()=>resolve(expired),ms);})]);}
 finally{clearTimeout(timer);}
}
export async function barcodeDecoderOutcome(load:()=>Promise<unknown>):Promise<{state:'loaded'|'decoderSlow'|'error'}>{
 try{
  if(await within(load,10000)===expired)return{state:'decoderSlow'};
  return{state:'loaded'};
 }catch{return{state:'error'};}
}
export async function barcodePhotoOutcome(load:()=>Promise<unknown>,decode:()=>Promise<string|null>):Promise<BarcodePhotoResult>{
 const loaded=await barcodeDecoderOutcome(load);
 if(loaded.state!=='loaded')return{state:loaded.state};
 try{
  const code=await within(decode,900);
  return code===expired||!code?{state:'unread'}:{state:'found',code};
 }catch{return{state:'unread'};}
}

import {createHash} from 'node:crypto';
import {NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';
import {createAdminClient} from '@/lib/supabase/admin';
import {capUser} from '@/lib/limits/user-cap';
import {isUuid} from '@/lib/posts/items';
import {identifyDrinks} from '@/lib/intake/identify-drinks';
import {traceContext} from '@/lib/trace/context';
export const maxDuration=300;
export async function POST(request:Request){
 const db=await createClient(),{data:{user}}=await db.auth.getUser();if(!user)return NextResponse.json({error:'Sign in required.'},{status:401});
 const body=await request.json().catch(()=>null);
 if(!isUuid(body?.upload_id)||!Number.isInteger(body?.position)||body.position<0||body.position>7)return NextResponse.json({error:'Choose an uploaded photo.'},{status:400});
 const admin=createAdminClient();
 const {data:draft,error:draftError}=await admin.from('post_upload_drafts').select('id,shots,published').eq('id',body.upload_id).eq('user_id',user.id).maybeSingle();
 if(draftError)return NextResponse.json({error:'The photo draft could not be read.'},{status:503});
 if(!draft||draft.published||!Array.isArray(draft.shots)||body.position>=draft.shots.length)return NextResponse.json({error:'Photo draft not found.'},{status:404});
 const {data:existing,error:existingError}=await admin.from('composer_drink_readings').select('id,position,drinks,all_drinks,state').eq('upload_id',body.upload_id).eq('position',body.position).eq('user_id',user.id).maybeSingle();
 if(existingError)return NextResponse.json({error:'Drinks could not be checked. You can still post the photo.'},{status:503});
 if(existing)return existing.state==='ready'?NextResponse.json({id:existing.id,position:existing.position,drinks:existing.drinks,allDrinks:existing.all_drinks}):NextResponse.json({error:existing.state==='pending'?'This photo is being checked.':'Drinks could not be checked. You can still post the photo.'},{status:existing.state==='pending'?409:502});
 const path=`${user.id}/${body.upload_id}/${body.position}.jpg`;
 const {data:photo,error:photoError}=await admin.storage.from('media').download(path);
 if(photoError||!photo||photo.size>20*1024*1024)return NextResponse.json({error:'The photo could not be opened.'},{status:400});
 const bytes=new Uint8Array(await photo.arrayBuffer()),hash=createHash('sha256').update(bytes).digest('hex');
 // Adding/removing another photo gives the upload manifest a fresh ID. Reuse
 // this owner's exact photo reading so unchanged photos never spend twice.
 const {data:cached,error:cacheError}=await admin.from('composer_drink_readings').select('drinks,all_drinks').eq('user_id',user.id).eq('photo_hash',hash).eq('state','ready').gte('created_at',new Date(Date.now()-3_600_000).toISOString()).limit(1).maybeSingle();
 if(cacheError)return NextResponse.json({error:'Drinks could not be checked. You can still post the photo.'},{status:503});
 if(cached){
  const {data:copy,error}=await admin.from('composer_drink_readings').insert({user_id:user.id,upload_id:body.upload_id,position:body.position,photo_hash:hash,state:'ready',drinks:cached.drinks,all_drinks:cached.all_drinks}).select('id').single();
  if(error)return NextResponse.json({error:'This photo is being checked.'},{status:error.code==='23505'?409:503});
  return NextResponse.json({id:copy.id,position:body.position,drinks:cached.drinks,allDrinks:cached.all_drinks});
 }
 const capped=await capUser(user.id,'drink_identify');if(capped)return capped;
 // Unique claims prevent concurrent rerenders and changed manifests from making two model calls.
 const {data:claimed,error:claimError}=await admin.from('composer_drink_readings').insert({user_id:user.id,upload_id:body.upload_id,position:body.position,photo_hash:hash}).select('id').single();
 if(claimError)return NextResponse.json({error:claimError.code==='23505'?'This photo has already been checked.':'Drinks could not be checked. You can still post the photo.'},{status:claimError.code==='23505'?409:503});
 try{
  // A prior pending claim may have finished between our cache lookup and insert.
  const {data:finished,error:finishedError}=await admin.from('composer_drink_readings').select('drinks,all_drinks').eq('user_id',user.id).eq('photo_hash',hash).eq('state','ready').gte('created_at',new Date(Date.now()-3_600_000).toISOString()).limit(1).maybeSingle();
  if(finishedError)throw Error('Reading cache could not be read.');
  const result=finished?{drinks:finished.drinks,allDrinks:finished.all_drinks}:await traceContext.run({postId:null},()=>identifyDrinks(admin,user.id,bytes));
  const {error}=await admin.from('composer_drink_readings').update({state:'ready',drinks:result.drinks,all_drinks:result.allDrinks}).eq('id',claimed.id);
  if(error)throw Error('Reading could not be stored.');
  return NextResponse.json({id:claimed.id,position:body.position,...result});
 }catch{await admin.from('composer_drink_readings').update({state:'failed'}).eq('id',claimed.id);return NextResponse.json({error:'Drinks could not be checked. You can still post the photo.'},{status:502});}
}

export async function PATCH(request:Request){
 const db=await createClient(),{data:{user}}=await db.auth.getUser();if(!user)return NextResponse.json({error:'Sign in required.'},{status:401});
 const body=await request.json().catch(()=>null),correction=body?.correction;
 if(!isUuid(body?.reading_id)||!Number.isInteger(body?.index)||body.index<0||!correction||typeof correction.name!=='string'||!correction.name.trim()||correction.name.length>80||correction.pack_unit!=='ml'||!Number.isFinite(correction.pack_amount)||correction.pack_amount<1||correction.pack_amount>5000||!correction.per_100)return NextResponse.json({error:'Choose a name, volume and nutrition.'},{status:400});
 for(const key of ['calories','protein_g','carbs_g','fat_g','fibre_g','sugar_g','sodium_mg']){const n=correction.per_100[key];if(n!==null&&(typeof n!=='number'||!Number.isFinite(n)||n<0||n>100000))return NextResponse.json({error:'Enter valid nutrition.'},{status:400});}
 const admin=createAdminClient();
 const {data:reading}=await admin.from('composer_drink_readings').select('id,upload_id,position,drinks,all_drinks').eq('id',body.reading_id).eq('user_id',user.id).eq('state','ready').maybeSingle();
 if(!reading||!Array.isArray(reading.drinks)||!reading.drinks[body.index])return NextResponse.json({error:'Drink reading not found.'},{status:404});
 const {data:draft}=await admin.from('post_upload_drafts').select('published').eq('id',reading.upload_id).eq('user_id',user.id).maybeSingle();
 if(!draft||draft.published)return NextResponse.json({error:'The photo was already posted.'},{status:409});
 const expected=reading.drinks;
 const drinks=structuredClone(reading.drinks) as import('@/lib/intake/photo-drinks').PhotoDrink[];
 const previous=drinks[body.index],ml=Math.round(correction.pack_amount),ratio=ml/previous.ml;
 const nutrition={...previous.nutrition,source_ref:`user:photo-drink:${reading.id}`};
 for(const key of ['calories','protein_g','carbs_g','fat_g','fibre_g','sugar_g','sodium_mg'] as const)nutrition[key]=correction.per_100[key]===null?null:correction.per_100[key]*ml/100;
 nutrition.micronutrients=nutrition.micronutrients.map(n=>({...n,value:n.value===null?null:Number(n.value)*ratio}));
 const caffeineMg=previous.caffeineMg===null?null:previous.caffeineMg*ratio;
 if(caffeineMg!==null&&caffeineMg>1000)return NextResponse.json({error:'Choose a smaller drink portion.'},{status:400});
 drinks[body.index]={...previous,name:correction.name.trim(),ml,grams:previous.grams===null?null:previous.grams*ratio,caffeineMg,kcal:nutrition.calories,nutrition};
 const {error}=await admin.rpc('correct_composer_drinks',{p_reading_id:reading.id,p_user_id:user.id,p_expected:expected,p_drinks:drinks});
 if(error)return NextResponse.json({error:'The correction could not be saved. Reload the photo draft and try again.'},{status:['40001','PT409'].includes(error.code)?409:503});
 return NextResponse.json({id:reading.id,position:reading.position,drinks,allDrinks:reading.all_drinks});
}

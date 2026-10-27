// Harness-only transport adapter. Future run_after keeps these jobs invisible
// to deployed workers; real claim concurrency is covered by job-ownership.test.
export function scopedFixtureClaims(admin,fixtureJobs,fixturePosts){
 return new Proxy(admin,{get(target,property){
  if(property==='rpc')return async(name,args)=>{
   if(name!=='claim_job'&&name!=='claim_owned_job')return target.rpc(name,args);
   if(!fixtureJobs.size)return {data:null,error:null};
   const {data:rows,error}=await target.from('jobs').select('*').in('id',[...fixtureJobs]).eq('status','queued').order('priority').order('created_at').order('id').limit(1);
   if(error||!rows?.length)return {data:null,error};const row=rows[0];
   if(!fixturePosts.includes(row.post_id))throw new Error('Fixture claim escaped its owned posts.');
   const claimed=await target.from('jobs').update({status:'running',started_at:new Date().toISOString(),attempts:row.attempts+1,payload:{...row.payload,post_ownership:true}}).eq('id',row.id).eq('status','queued').select('*').maybeSingle();
   if(claimed.error||!claimed.data)return claimed;
   const update=row.kind==='card_backfill'?{active_job_id:row.id}:{active_job_id:row.id,status:'processing',fail_reason:null};
   const owner=await target.from('posts').update(update).eq('id',row.post_id);
   if(owner.error)return {data:null,error:owner.error,status:owner.status};
   return claimed;
  };
  const value=Reflect.get(target,property);return typeof value==='function'?value.bind(target):value;
 }});
}

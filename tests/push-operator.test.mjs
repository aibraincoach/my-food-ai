import assert from 'node:assert/strict';
import test from 'node:test';
import Module, {createRequire} from 'node:module';

// #1001: an operator re-analysis or re-match publishes the meal without a notification;
// an ordinary job's ready meal and question still notify.
test('an operator job never notifies, and an ordinary job still does', async () => {
  const originalLoad=Module._load;const delivered=[];
  Module._load=function(name,...args){
    if(name==='web-push')return{sendNotification:async(_subscription,payload)=>delivered.push(JSON.parse(payload))};
    return originalLoad.call(this,name,...args);
  };
  let sendPostPush;
  try{({sendPostPush}=createRequire(import.meta.url)('../src/lib/push/send.ts'));}finally{Module._load=originalLoad;}
  const names=['NEXT_PUBLIC_VAPID_PUBLIC_KEY','VAPID_PRIVATE_KEY','VAPID_SUBJECT'];
  const previous=names.map(name=>process.env[name]);
  for(const name of names)process.env[name]='fixture';
  let post,job;const jobReads=[];
  const admin={from(table){
    let id;
    const data=()=>table==='posts'?post:table==='jobs'?(jobReads.push(id),job):[{id:'subscription',endpoint:'https://fcm.googleapis.com/fixture',keys:{p256dh:'A'.repeat(87),auth:'A'.repeat(22)}}];
    const q={select(){return q;},eq(column,value){if(column==='id')id=value;return q;},maybeSingle(){return q;},then(resolve){return Promise.resolve({data:data(),error:null}).then(resolve);}};
    return q;
  }};
  try{
    for(const operator of ['reanalysis','rematch','restore']){
      post={user_id:'owner',status:'ready',active_job_id:`job-${operator}`};job={payload:{operator,post_ownership:true}};
      await sendPostPush(admin,'meal');
    }
    assert.equal(delivered.length,0,'no operator job notifies');
    assert.deepEqual(jobReads,['job-reanalysis','job-rematch','job-restore'],'the meal\'s own active job is the one read');
    post={user_id:'owner',status:'ready',question:{question:'Was this a beer?'},active_job_id:'job-question'};job={payload:{operator:'reanalysis'}};
    await sendPostPush(admin,'meal','Was this a beer?');
    assert.equal(delivered.length,0,'an operator job asks no question by notification either');
    post={user_id:'owner',status:'ready',active_job_id:'job-plain'};job={payload:{post_ownership:true}};
    await sendPostPush(admin,'meal');
    assert.deepEqual(delivered.map(d=>d.title),['Your meal is ready'],'an ordinary job still notifies');
    post={user_id:'owner',status:'ready',active_job_id:null};
    await sendPostPush(admin,'meal');
    post={user_id:'owner',status:'ready',active_job_id:'job-gone'};job=null;
    await sendPostPush(admin,'meal');
    assert.equal(delivered.length,3,'a meal with no active job, or a job that cannot be read, still notifies');
  }finally{names.forEach((name,index)=>{if(previous[index]===undefined)delete process.env[name];else process.env[name]=previous[index];});}
});

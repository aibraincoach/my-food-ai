import assert from 'node:assert/strict';
import test from 'node:test';
import Module, {createRequire} from 'node:module';

test('push follows persisted waiting state and maintenance publication stays silent', async () => {
  const originalLoad=Module._load;const delivered=[];let renders=0,published=true;
  Module._load=function(name,...args){
    if(name==='web-push')return{sendNotification:async(_subscription,payload)=>delivered.push(JSON.parse(payload))};
    if(name.endsWith('/results-card'))return{renderResultsCard:async()=>{renders++;return published;}};
    return originalLoad.call(this,name,...args);
  };
  let sendPostPush,markReady,backfill;
  try{
    const require=createRequire(import.meta.url);
    ({sendPostPush}=require('../src/lib/push/send.ts'));
    ({markReady}=require('../src/lib/pipeline/persist.ts'));
    backfill=require('../src/lib/worker/jobs/card_backfill.ts').default;
  }finally{Module._load=originalLoad;}
  const names=['NEXT_PUBLIC_VAPID_PUBLIC_KEY','VAPID_PRIVATE_KEY','VAPID_SUBJECT'];
  const previous=names.map(name=>process.env[name]);
  for(const name of names)process.env[name]='fixture';
  let post={user_id:'owner',status:'queued',needs_input:{question:'Which food?'}};
  const admin={from(table){
    const data=table==='posts'?post:table==='post_media'?null:
      [{id:'subscription',endpoint:'https://fcm.googleapis.com/fixture',keys:{p256dh:'A'.repeat(87),auth:'A'.repeat(22)}}];
    const q={select(){return q;},eq(){return q;},order(){return q;},limit(){return q;},maybeSingle(){return q;},then(resolve){return Promise.resolve({data,error:null}).then(resolve);}};
    return q;
  }};
  try{
    await sendPostPush(admin,'meal','Which food?');
    assert.equal(delivered.length,0,'an answer queued during the model call must not prompt another reply');
    post={...post,status:'needs_input'};
    await sendPostPush(admin,'meal','An older question?');
    assert.equal(delivered.length,0,'a superseded question must not be delivered');
    await sendPostPush(admin,'meal','Which food?');
    assert.equal(delivered.length,1,'the persisted waiting question should be delivered');
    post={...post,status:'ready',needs_input:null};delivered.length=0;
    await backfill(admin,{id:'maintenance',post_id:'meal'});
    assert.equal(renders,1,'maintenance still renders and publishes the card');
    assert.equal(delivered.length,0,'historical ready meals must not produce a new-ready push');
    assert.equal(await markReady('meal',admin,'analysis'),true);
    assert.equal(delivered.length,1,'successful normal completion still notifies');
    delivered.length=0;published=false;
    assert.equal(await markReady('meal',admin,'stale-analysis'),false);
    assert.equal(delivered.length,0,'rejected publication must not notify');
    post={...post,status:'queued'};published=true;
    await markReady('meal',admin,'analysis');
    assert.equal(delivered.length,0,'a newer pending correction must suppress stale ready messaging');
  }finally{
    names.forEach((name,i)=>{if(previous[i]===undefined)delete process.env[name];else process.env[name]=previous[i];});
  }
});

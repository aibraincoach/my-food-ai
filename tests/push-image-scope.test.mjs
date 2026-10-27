import assert from 'node:assert/strict';
import test from 'node:test';
import Module, {createRequire} from 'node:module';

test('notification images never sign another meal or user storage path', async () => {
  const originalLoad=Module._load;const delivered=[];
  Module._load=function(name,...args){
    if(name==='web-push')return{sendNotification:async(_subscription,payload)=>delivered.push(JSON.parse(payload))};
    return originalLoad.call(this,name,...args);
  };
  let sendPostPush;
  try{({sendPostPush}=createRequire(import.meta.url)('../src/lib/push/send.ts'));}
  finally{Module._load=originalLoad;}
  const names=['NEXT_PUBLIC_VAPID_PUBLIC_KEY','VAPID_PRIVATE_KEY','VAPID_SUBJECT'];
  const previous=names.map(name=>process.env[name]);
  for(const name of names)process.env[name]='fixture';
  try{
    const generation='33333333-3333-3333-3333-333333333333';
    for(const [kind,path,expected]of [
      ['photo','owner/meal/0.jpg','owner/meal/0.feed.jpg'],
      ['card',`owner/meal/cards/${generation}/card.png`,`owner/meal/cards/${generation}/card.png`],
      ['photo','victim/meal/0.jpg',null],
      ['card',`victim/meal/cards/${generation}/card.png`,null],
      ['photo','owner/other/0.jpg',null],
      ['photo','owner/meal/../other/0.jpg',null],
    ]){
      const signed=[];delivered.length=0;
      const admin={from(table){
        const data=table==='posts'?{user_id:'owner',status:'ready',needs_input:null}:table==='post_media'?{kind,storage_path:path}:
          [{id:'subscription',endpoint:'https://fcm.googleapis.com/fixture',keys:{p256dh:'A'.repeat(87),auth:'A'.repeat(22)}}];
        const q={select(){return q;},eq(){return q;},order(){return q;},limit(){return q;},maybeSingle(){return q;},then(resolve){return Promise.resolve({data,error:null}).then(resolve);}};
        return q;
      },storage:{from:()=>({createSignedUrl:async path=>{signed.push(path);return{data:{signedUrl:'https://fixture.invalid/image'}};}})}};
      await sendPostPush(admin,'meal');
      assert.deepEqual(signed,expected?[expected]:[]);
      assert.equal(delivered.length,1,'valid subscription still gets a notification without an unsafe image');
      assert.equal(delivered[0].image,expected?'https://fixture.invalid/image':undefined);
    }
  }finally{
    names.forEach((name,i)=>{if(previous[i]===undefined)delete process.env[name];else process.env[name]=previous[i];});
  }
});

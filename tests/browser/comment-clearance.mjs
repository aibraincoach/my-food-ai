// Real-browser probe for a disposable ready meal. The caller seeds/authenticates
// its own fixture and verifies the returned comment id in the database afterward.
import assert from 'node:assert/strict';
export async function sendCommentAboveNavigation(page,{postId,body,doubleTap=false}) {
  const path=`/api/posts/${postId}/comments`;
  const input=page.getByRole('textbox',{name:'Comment or correct',exact:true});
  const send=page.getByRole('button',{name:'Send comment',exact:true});
  await input.tap();
  await input.fill(body);
  const hit=()=>send.evaluate(element=>{
    const rect=element.getBoundingClientRect();
    const target=document.elementFromPoint(rect.x+rect.width/2,rect.y+rect.height/2);
    return Boolean(target&&(target===element||element.contains(target)));
  });
  assert.equal(await hit(),true,'Send is covered after focusing and typing');
  await send.scrollIntoViewIfNeeded();
  assert.equal(await hit(),true,'Send is covered after scrollIntoViewIfNeeded');
  let count=0;
  const observe=request=>{if(request.method()==='POST'&&new URL(request.url()).pathname===path)count++;};
  page.on('request',observe);
  try {
    const response=page.waitForResponse(reply=>reply.request().method()==='POST'&&new URL(reply.url()).pathname===path);
    if(doubleTap){
      const rect=await send.boundingBox();
      assert.ok(rect);
      await page.touchscreen.tap(rect.x+rect.width/2,rect.y+rect.height/2);
      await page.touchscreen.tap(rect.x+rect.width/2,rect.y+rect.height/2);
    }else await send.tap();
    const reply=await response;
    assert.equal(reply.status(),201);
    const {comment}=await reply.json();
    assert.equal(comment.author,'user');
    assert.equal(comment.body,body);
    await page.getByRole('region',{name:'Meal comments',exact:true}).getByText(body,{exact:false}).waitFor();
    assert.equal(await input.inputValue(),'');
    assert.equal(count,1,'One action must submit exactly one comment request');
    return {id:comment.id,body,requests:count};
  }finally{page.off('request',observe);}
}

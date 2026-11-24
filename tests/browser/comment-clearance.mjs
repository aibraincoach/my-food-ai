// Real-browser probe for a disposable ready meal. The caller seeds/authenticates
// its own fixture and verifies the returned comment id in the database afterward.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const english=JSON.parse(await fs.readFile(new URL('../../messages/en.json',import.meta.url),'utf8')).thread;
export async function sendCommentAboveNavigation(page,{postId,body,doubleTap=false,words=english}) {
  const path=`/api/posts/${postId}/comments`;
  const input=page.getByRole('textbox',{name:words.commentOrCorrect,exact:true});
  const send=page.getByRole('button',{name:words.sendComment,exact:true});
  await input.tap();
  await input.fill(body);
  const hit=()=>send.evaluate(element=>{
    const rect=element.getBoundingClientRect();
    const target=document.elementFromPoint(rect.x+rect.width/2,rect.y+rect.height/2);
    window.__commentHitTest={at:performance.now(),rect:rect.toJSON(),scrollY,documentHeight:document.documentElement.scrollHeight,viewport:{width:innerWidth,height:innerHeight,offset:visualViewport?.offsetTop,visualHeight:visualViewport?.height},target:target?{tag:target.tagName,id:target.id,label:target.getAttribute('aria-label'),text:target.textContent?.slice(0,100)}:null};
    return Boolean(target&&(target===element||element.contains(target)));
  });
  // The composer is inline: centre Send before H4's bounded hit-test setup.
  await send.evaluate(async element=>{element.scrollIntoView({block:'center'});await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
  // A lasting cover still times out with its hit target.
  await page.waitForFunction(label=>{
    const button=[...document.querySelectorAll('button[aria-label]')].find(node=>node.getAttribute('aria-label')===label);
    if(!button)return false;
    const rect=button.getBoundingClientRect(),target=document.elementFromPoint(rect.x+rect.width/2,rect.y+rect.height/2);
    window.__commentHitTest={at:performance.now(),rect:rect.toJSON(),scrollY,documentHeight:document.documentElement.scrollHeight,viewport:{width:innerWidth,height:innerHeight,offset:visualViewport?.offsetTop,visualHeight:visualViewport?.height},target:target?{tag:target.tagName,id:target.id,label:target.getAttribute('aria-label'),text:target.textContent?.slice(0,100)}:null};
    return rect.top>=0&&rect.bottom<=innerHeight&&!button.disabled&&getComputedStyle(button).opacity==='1'&&Boolean(target&&(target===button||button.contains(target)));
  },words.sendComment,{timeout:10000});
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
    await page.getByRole('region',{name:words.mealComments,exact:true}).getByText(body,{exact:false}).waitFor();
    assert.equal(await input.inputValue(),'');
    assert.equal(count,1,'One action must submit exactly one comment request');
    return {id:comment.id,body,requests:count};
  }finally{page.off('request',observe);}
}

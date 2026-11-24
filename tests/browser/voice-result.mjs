import assert from 'node:assert/strict';
// The caller supplies a disposable authenticated page and captures the resulting
// post id for DB verification/cleanup. No page.route stub: use native transcription.
export async function postVoiceAndReadRenderedResult(page,{app,handle,onPost,words={postMeal:'Post a meal',text:'Text',speak:'Speak',stop:'Stop recording',caption:'Caption',post:'Post'}}) {
 page.setDefaultTimeout(30000);
 await page.goto(app,{waitUntil:'load'});
 await page.getByRole('button',{name:words.postMeal,exact:true}).tap();
 await page.getByRole('button',{name:words.text,exact:true}).tap();
 const transcribe=page.waitForResponse(r=>new URL(r.url()).pathname==='/api/transcribe'&&r.request().method()==='POST');
 await page.getByRole('button',{name:words.speak,exact:true}).tap();
 const stop=page.getByRole('button',{name:words.stop,exact:true});await stop.waitFor();
 await page.waitForTimeout(1000);await stop.tap();
 const audioReply=await transcribe;assert.equal(audioReply.status(),200,'Native transcription must reach the scripted provider');
 const caption=page.getByRole('textbox',{name:words.caption,exact:true});
 await page.waitForFunction(()=>document.querySelector('#capture-caption')?.value==='A bowl of porridge');
 assert.equal(await caption.inputValue(),'A bowl of porridge');
 const published=page.waitForResponse(r=>new URL(r.url()).pathname==='/api/posts'&&r.request().method()==='POST');
 await page.getByRole('button',{name:words.post,exact:true}).tap();
 const response=await published;assert.ok(response.ok());const body=await response.json();assert.match(body.postId,/^[a-f0-9-]{36}$/);await onPost(body.postId);
 const deadline=Date.now()+90000;let post;
 do{
  const r=await page.context().request.get(app+`/api/feed?ids=${body.postId}&tz=UTC`,{timeout:20000});assert.ok(r.ok());post=(await r.json()).posts.find(p=>p.id===body.postId);
  if(post?.status==='ready')break;
  await page.waitForTimeout(500);
 }while(Date.now()<deadline);
 assert.equal(post?.status,'ready');assert.equal(post.caption,'A bowl of porridge');assert.ok(post.items.length);assert.ok(post.items.every(item=>item.calories!==null&&Number.isFinite(Number(item.calories))));
 // This stack has no Realtime server; use the app's existing return reader once.
 await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
 const card=page.locator(`article[data-post-id="${body.postId}"][data-post-status="ready"]:visible`).first();
 await card.waitFor({timeout:Math.max(1,deadline-Date.now())});
 const text=await card.innerText();assert.doesNotMatch(text,/Processing/);
 const match=text.match(/(?:^|\n)([\d,]+)\s*\nkcal(?:\n|$)/);assert.ok(match,'Rendered result must contain its calories line');
 const shown=Number(match[1].replaceAll(',','')),stored=post.items.reduce((sum,item)=>sum+Number(item.calories),0);assert.equal(shown,Math.round(stored));
 const renderedCaption=await card.locator('p').evaluateAll((paragraphs,handle)=>{const p=paragraphs.find(p=>p.firstElementChild?.tagName==='SPAN'&&p.firstElementChild.textContent===handle);if(!p)return null;const copy=p.cloneNode(true);copy.firstElementChild.remove();return copy.textContent.trim();},handle);
 assert.equal(renderedCaption,'A bowl of porridge');
 return {postId:body.postId,apiStatus:audioReply.status(),caption:renderedCaption,shownCalories:shown,storedCalories:stored,post,cardText:text,focusReconcile:true};
}

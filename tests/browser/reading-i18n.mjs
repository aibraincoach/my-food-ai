// Disposable reading-screen parity and Japanese controls; no real model/account.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {readingRealtime} from '../fixtures/reading-realtime.mjs';
const app=process.env.APP_URL,base=process.env.I18N_BASE_URL,out=process.env.CAPTURE_CHECK_OUT,engine=process.env.ONLY_ENGINE;
if(process.env.MFA_TEST_DISPOSABLE!=='1'||!out||![app,base].every(value=>new URL(value).hostname==='127.0.0.1')||!['chromium','webkit'].includes(engine))throw Error('Disposable loopback reading proof only');
const fixture=JSON.parse(await fs.readFile(out+'/fixture-ledger.json','utf8')),cookies=JSON.parse(await fs.readFile(out+'/session.json','utf8'));
const dictionaries=Object.fromEntries(await Promise.all(['en','ja'].map(async locale=>[locale,JSON.parse(await fs.readFile(new URL('../../messages/'+locale+'.json',import.meta.url),'utf8'))])));
const {chromium,webkit,devices}=await import(process.env.MFA_PLAYWRIGHT_MODULE??'playwright');
const browser=await(engine==='webkit'?webkit:chromium).launch(engine==='chromium'?{executablePath:process.env.TEST_CHROMIUM_EXECUTABLE,args:['--no-sandbox']}:{});
const receipt={engine,parity:[],cases:[],errors:[],limits:['Emulated iPhone at390x844; no real iPhone/Safari proof','English DOM comparison blocks workers in both builds; translated flows use normal worker','Stored content and slice5 read-time sentences remain untranslated']};
const snapshots={},preflight=process.env.READING_PREFLIGHT==='1';
async function settled(page){await page.evaluate(async()=>{await document.fonts.ready;await Promise.all(document.getAnimations().filter(a=>a.effect?.getComputedTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})));await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});}
async function menu(page,m){const summary=page.getByLabel(m.postMenu.mealMenu,{exact:true});await summary.tap();await settled(page);}
async function plus(page,entry){
 const toggle=page.locator('#post-menu-toggle:visible');await toggle.tap();
 await page.waitForFunction(entry=>{const menu=document.querySelector('#post-menu'),button=menu?.querySelector('button[data-entry="'+entry+'"]');if(menu?.getAttribute('aria-hidden')!=='false'||!button||getComputedStyle(button).opacity!=='1'||getComputedStyle(button.querySelector('span')).opacity!=='1')return false;const rect=button.getBoundingClientRect();return document.elementFromPoint(rect.x+rect.width/2,rect.y+rect.height/2)?.closest('button')===button;},entry);
 await page.locator('#post-menu button[data-entry="'+entry+'"]').tap();
}
const states=[
 {name:'feed',path:'/'},
 {name:'detail',path:'post'},
 {name:'servings',path:'post',open:async(p,m)=>{await p.getByRole('button',{name:new RegExp('^'+(m===dictionaries.en?'Edit servings,':'食分の数を編集'))}).tap();await p.getByLabel(m.postMenu.servingsCount,{exact:true}).waitFor();}},
 {name:'nutrition',path:'post',open:async(p,m)=>{await p.getByRole('button',{name:new RegExp('^'+m.post.consumedAll.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'))}).tap();await p.getByRole('table').waitFor();}},
 {name:'item',path:'post',open:async(p,m)=>{await p.getByLabel(m.post.editItem.replace('{name}','検証用のご飯'),{exact:true}).first().tap();await p.getByRole('dialog',{name:m.postMenu.editMealItem,exact:true}).waitFor();}},
 {name:'add-item',path:'post',open:async(p,m)=>{await p.getByRole('button',{name:new RegExp('^'+m.post.consumedAll)}).tap();await p.getByRole('button',{name:m.post.addItem,exact:true}).tap();await p.getByRole('dialog',{name:m.postMenu.addMealItem,exact:true}).waitFor();}},
 {name:'caption',path:'post',open:async(p,m)=>{await menu(p,m);await p.getByRole('button',{name:m.postMenu.editCaption,exact:true}).tap();await p.getByRole('dialog',{name:m.postMenu.editCaption,exact:true}).waitFor();}},
 {name:'time',path:'post',open:async(p,m)=>{await menu(p,m);await p.getByRole('button',{name:new RegExp('^'+m.postMenu.editTime)}).tap();await p.getByRole('dialog',{name:m.postMenu.editTime,exact:true}).waitFor();}},
 {name:'delete',path:'post',open:async(p,m)=>{await menu(p,m);await p.getByRole('button',{name:m.post.delete,exact:true}).tap();await p.getByRole('dialog',{name:m.postMenu.deleteTitle,exact:true}).waitFor();}},
 {name:'correct-product',path:'post',open:async(p,m)=>{await menu(p,m);await p.getByRole('button',{name:m.postMenu.correctProduct,exact:true}).tap();await p.getByRole('dialog',{name:m.postMenu.correctThisProduct,exact:true}).waitFor();}},
 {name:'log-again',path:'post',open:async(p,m)=>{await menu(p,m);await p.locator('details[open]').getByRole('button',{name:m.post.eatAgain,exact:true}).tap();await p.getByRole('dialog',{name:m.post.eatAgain,exact:true}).waitFor();await p.locator('[data-log-again-content]').waitFor();await p.getByRole('button',{name:new RegExp('^'+(m===dictionaries.en?'Post ·':'投稿する ·'))}).waitFor();}},
 {name:'saved',path:'/',open:async(p,m)=>{await plus(p,'saved');await p.getByRole('dialog',{name:m.postMenu.savedMeals,exact:true}).waitFor();await p.getByText('検証用の保存した食事',{exact:true}).waitFor();}},
 {name:'drink',path:'/',open:async(p,m)=>{await plus(p,'drink');await p.getByRole('dialog',{name:m.postMenu.drinkTitle,exact:true}).waitFor();await p.getByText(m.postMenu.drinkTea,{exact:true}).waitFor();}},
 {name:'clarification',path:'/',open:async(p,m)=>{await p.getByText('これは何の料理ですか？',{exact:true}).tap();await p.getByRole('dialog',{name:m.postMenu.clarifyMeal,exact:true}).waitFor();}},
 {name:'no-food',path:'/',open:async(p,m)=>{await p.getByText(m.feed.noFoodFound,{exact:true}).waitFor();}},
];
function normalize(snapshot,name){const copy=structuredClone(snapshot);if(name==='log-again')copy.text=copy.text.replace(/\b\d{1,2}:\d{2}\s*(AM|PM)\b/g,'<clock>');return copy;}
async function capture(page,name){
 await settled(page);
 return page.evaluate(()=>({text:document.body.innerText,aria:[...document.querySelectorAll('[aria-label]')].filter(node=>node.getClientRects().length).map(node=>node.getAttribute('aria-label'))}));
}
try{
 const runs=process.env.READING_EN_ONLY==='1'?[['base','en',base],['head','en',app]]:process.env.READING_JA_ONLY==='1'?[[process.env.READING_OBSERVE_BASE==='1'?'base':'head','ja',process.env.READING_OBSERVE_BASE==='1'?base:app]]:preflight?[['head','en',app]]:engine==='chromium'?[['base','en',base],['head','en',app],['head','ja',app]]:[['head','en',app],['head','ja',app]];
 for(const [build,locale,url]of runs){
  const context=await browser.newContext({...devices['iPhone 13'],viewport:{width:390,height:844},locale:'en-US',timezoneId:'UTC',...(engine==='chromium'&&locale==='en'?{serviceWorkers:'block'}:{})});
  if(locale==='en'&&!preflight){receipt.realtime??=[];receipt.realtime.push({build,locale,transport:await readingRealtime(context)});}
  await context.addCookies([...cookies.map(cookie=>({name:cookie.name,value:cookie.value,url})),{name:'lang',value:locale,url},{name:'time-zone',value:'UTC',url}]);
  let closing=false,lastNavigation=null;
  const page=await context.newPage();page.setDefaultTimeout(15000);page.setDefaultNavigationTimeout(30000);
  const event=message=>({build,locale,message,at:new Date().toISOString(),url:page.url(),lastNavigation,closing});
  page.on('pageerror',error=>receipt.errors.push(event(error.message)));
  page.on('console',message=>{if(message.type()==='error'){receipt.consoleErrors??=[];receipt.consoleErrors.push(event(message.text()));}});
  try{
   const m=dictionaries[locale];
   for(const state of (preflight?states.filter(state=>state.name==='feed'):states)){
    receipt.current={build,locale,state:state.name};
    lastNavigation={at:new Date().toISOString(),state:state.name,url:url+(state.path==='post'?'/posts/'+fixture.post:state.path)};
    await page.goto(lastNavigation.url,{waitUntil:'load'});
    if(state.path==='post'){await page.locator('[data-post-detail-ready]').waitFor({state:'attached'});await page.getByRole('region',{name:dictionaries[locale].thread.mealComments,exact:true}).filter({hasText:'これは検証用の返信です。'}).waitFor();}
    else {await page.locator('[data-post-id="'+fixture.post+'"]').waitFor();if(['feed','clarification','no-food'].includes(state.name)){await page.getByText(m.feed.noFoodFound,{exact:true}).waitFor();await page.getByText('これは何の料理ですか？',{exact:true}).waitFor();}}
    await page.waitForFunction(()=>{const node=document.querySelector('[data-post-id]')??document.querySelector('summary');return node&&Object.keys(node).some(key=>key.startsWith('__reactFiber'));});
    if(state.open)await state.open(page,m);
    const snapshot=normalize(await capture(page,state.name),state.name);snapshots[build+'-'+locale+'-'+state.name]=snapshot;
    if(!preflight&&build==='head'&&locale==='en'&&engine==='chromium'){assert.deepEqual(snapshot,snapshots['base-en-'+state.name],'English parity '+state.name);receipt.parity.push(state.name);}
    const overflow=await page.evaluate(()=>[...document.querySelectorAll('button,label,p,h1,h2,input')].filter(node=>{const r=node.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(node).visibility!=='hidden'&&(r.left< -1||r.right>391||node.scrollWidth>node.clientWidth+2);}).map(node=>({tag:node.tagName,text:node.innerText,label:node.getAttribute('aria-label')})));
    const latin=locale==='ja'?await page.evaluate(()=>{
     const held='[data-i18n-stored],[data-i18n-server-wording],.text-avatar,.text-avatar-sm';
     const proper=['My Food AI','Coca-Cola','Open Food Facts','Open Database License','Muse Spark Open','Muse Spark 1.3','AI'];
     const stored=[...document.querySelectorAll('input[type=text],textarea,[data-correct-product-name]')].map(node=>node.value).filter(Boolean);
     const clean=value=>{for(const word of [...proper,...stored])value=value.split(word).join('');return value.replace(/\b(kcal|ml|mg|oz|g|IU|kJ)\b/g,'');};
     const result=[],walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
     while(walker.nextNode()){const node=walker.currentNode,parent=node.parentElement;if(!parent||parent.closest(held)||parent.closest('script,style')||!parent.getClientRects().length)continue;if(/[A-Za-z]/.test(clean(node.textContent)))result.push({text:node.textContent,tag:parent.tagName});}
     for(const node of document.querySelectorAll('[aria-label],input[placeholder],img[alt]')){if(!node.getClientRects().length||node.closest(held))continue;for(const key of ['aria-label','placeholder','alt']){const text=node.getAttribute(key);if(text&&/[A-Za-z]/.test(clean(text)))result.push({attribute:key,text});}}
     return result;
    }):[];
    if(locale==='ja')await page.screenshot({path:out+'/'+engine+'-ja-'+state.name+'.png',fullPage:true});
    receipt.cases.push({build,locale,state:state.name,overflow,latin});
    assert.equal(latin.length,0,'Japanese Latin text '+state.name+': '+JSON.stringify(latin));
    if(preflight){await page.locator('[data-post-id="'+fixture.post+'"]').getByRole('link',{name:dictionaries.en.postMenu.details,exact:true}).tap();await page.waitForURL('**/posts/'+fixture.post);await page.locator('[data-post-detail-ready]').waitFor({state:'attached'});await page.getByRole('region',{name:dictionaries[locale].thread.mealComments,exact:true}).filter({hasText:'これは検証用の返信です。'}).waitFor();receipt.cases.push({build,locale,state:'cached-post-open',pass:true});}
   }
   if(locale==='en'&&!preflight)assert.ok(receipt.realtime.at(-1).transport.acknowledgedJoins>0,'Realtime fixture must acknowledge a join in every snapshot context');
  }catch(error){await page.screenshot({path:out+'/'+engine+'-failure.png',fullPage:true});await fs.writeFile(out+'/'+engine+'-failure.html',await page.content(),{mode:0o600});throw error;}
  finally{closing=true;await context.close();}
 }
 assert.equal(receipt.errors.length,0,'No client runtime errors');receipt.pass=true;
}catch(error){receipt.pass=false;receipt.failure=String(error);process.exitCode=1;}
finally{await browser.close();await fs.writeFile(out+'/'+engine+(preflight?'-preflight':'')+'-reading.json',JSON.stringify(receipt,null,2));await fs.writeFile(out+'/'+engine+(preflight?'-preflight':'')+'-snapshots.json',JSON.stringify(snapshots,null,2));console.log(JSON.stringify({engine,pass:receipt.pass,cases:receipt.cases.length,current:receipt.current,failure:receipt.failure}));}
